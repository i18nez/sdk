import type { I18nezClient } from "./client";
import type { TranslationCache } from "./cache";

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
}

export class TranslationQueue {
  private pending = new Map<string, QueueItem>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

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
      if (this.pending.size >= this.config.batchSize) {
        void this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => {
          void this.flush();
        }, this.config.batchInterval);
      }
    });
  }

  async flush(): Promise<void> {
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
      const locale = group[0].targetLocale;
      const dynamic = group[0].dynamic;
      try {
        const results = await this.client.translateBatch(
          group.map((i) => i.text),
          this.config.sourceLocale,
          locale,
          undefined,
          dynamic,
        );
        group.forEach((item, idx) => {
          const translated = results[idx]?.text ?? item.text;
          this.cache.set(item.hash, item.targetLocale, translated);
          item.resolvers.forEach((r) => r(translated));
        });
      } catch (err) {
        group.forEach((item) => {
          item.rejecters.forEach((rej) => rej(err));
        });
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
