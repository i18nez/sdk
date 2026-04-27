import type { I18nezClient } from "./client";
import type { TranslationCache } from "./cache";
import { RateLimitedError } from "./types";

interface QueueItem {
  text: string;
  hash: string;
  targetLocale: string;
  context?: string;
  dynamic?: boolean;
  resolvers: Array<(text: string) => void>;
  rejecters: Array<(err: unknown) => void>;
}

interface QueueConfig {
  batchInterval: number;
  batchSize: number;
  sourceLocale: string;
  maxRetries?: number;
}

export class TranslationQueue {
  private pending = new Map<string, QueueItem>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private inflight: Promise<void> = Promise.resolve();

  constructor(
    private client: I18nezClient,
    private cache: TranslationCache,
    private config: QueueConfig,
  ) {}

  enqueue(
    text: string,
    hash: string,
    targetLocale: string,
    context?: string,
    dynamic?: boolean,
  ): Promise<string> {
    if (this.destroyed) {
      return Promise.reject(new Error("Queue destroyed"));
    }
    const key = `${targetLocale}:${dynamic ? "d:" : "s:"}${hash}`;
    return new Promise<string>((resolve, reject) => {
      const existing = this.pending.get(key);
      if (existing) {
        existing.resolvers.push(resolve);
        existing.rejecters.push(reject);
        return;
      }
      this.pending.set(key, {
        text,
        hash,
        targetLocale,
        context,
        dynamic,
        resolvers: [resolve],
        rejecters: [reject],
      });
      if (!this.timer) {
        this.timer = setTimeout(() => {
          void this.flush();
        }, this.config.batchInterval);
      }
    });
  }

  flush(): Promise<void> {
    const next = this.inflight.then(() => this.doFlush());
    this.inflight = next.catch(() => {});
    return next;
  }

  private async doFlush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.pending.size === 0) return;

    const items = Array.from(this.pending.values());
    this.pending.clear();

    const byGroup = new Map<string, QueueItem[]>();
    for (const item of items) {
      const key = `${item.targetLocale}:${item.dynamic ? "d" : "s"}`;
      const list = byGroup.get(key) ?? [];
      list.push(item);
      byGroup.set(key, list);
    }

    for (const group of byGroup.values()) {
      for (let i = 0; i < group.length; i += this.config.batchSize) {
        const chunk = group.slice(i, i + this.config.batchSize);
        await this.sendChunk(chunk);
      }
    }
  }

  private async sendChunk(chunk: QueueItem[]): Promise<void> {
    const locale = chunk[0].targetLocale;
    const dynamic = chunk[0].dynamic;
    const maxRetries = this.config.maxRetries ?? 3;
    let attempt = 0;

    while (true) {
      try {
        const results = await this.client.translateBatch(
          chunk.map((i) => i.text),
          this.config.sourceLocale,
          locale,
          undefined,
          dynamic,
        );
        chunk.forEach((item, idx) => {
          const translated = results[idx]?.text ?? item.text;
          this.cache.set(item.hash, item.targetLocale, translated);
          item.resolvers.forEach((r) => r(translated));
        });
        return;
      } catch (err) {
        if (err instanceof RateLimitedError && attempt < maxRetries) {
          attempt++;
          const waitSeconds = err.retryAfter > 0 ? err.retryAfter : 2 ** attempt;
          await sleep(waitSeconds * 1000);
          continue;
        }
        chunk.forEach((item) => {
          item.rejecters.forEach((rej) => rej(err));
        });
        return;
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const item of this.pending.values()) {
      item.rejecters.forEach((rej) => rej(new Error("Queue destroyed")));
    }
    this.pending.clear();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
