import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TranslationQueue } from "../src/queue";
import { TranslationCache } from "../src/cache";
import { QuotaExceededError, type TranslationResult } from "../src/types";
import type { I18nezClient } from "../src/client";

function stubClient(
  translateBatch: (texts: string[]) => Promise<TranslationResult[]>,
): I18nezClient {
  return {
    translate: vi.fn(),
    translateBatch: vi.fn((texts: string[]) => translateBatch(texts)),
    getBundle: vi.fn(),
  } as unknown as I18nezClient;
}

describe("TranslationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("batches requests within the interval window", async () => {
    const batch = vi.fn(async (texts: string[]) =>
      texts.map(
        (t) => ({ text: `${t}-it`, source: t, cached: false }) as TranslationResult,
      ),
    );
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p1 = q.enqueue("Hello", "h1", "it");
    const p2 = q.enqueue("World", "h2", "it");
    expect(batch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(batch).toHaveBeenCalledOnce();
    expect(r1).toBe("Hello-it");
    expect(r2).toBe("World-it");
    q.destroy();
  });

  it("flushes immediately when batch size is hit", async () => {
    const batch = vi.fn(async (texts: string[]) =>
      texts.map((t) => ({ text: `${t}!`, source: t, cached: false })),
    );
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 2,
      sourceLocale: "en",
    });

    const p1 = q.enqueue("a", "h1", "it");
    const p2 = q.enqueue("b", "h2", "it");
    await Promise.all([p1, p2]);
    expect(batch).toHaveBeenCalledOnce();
    q.destroy();
  });

  it("deduplicates by hash+targetLocale", async () => {
    const batch = vi.fn(async (texts: string[]) =>
      texts.map((t) => ({ text: `${t}!`, source: t, cached: false })),
    );
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p1 = q.enqueue("Hello", "h1", "it");
    const p2 = q.enqueue("Hello", "h1", "it");
    await vi.advanceTimersByTimeAsync(50);
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe("Hello!");
    expect(r2).toBe("Hello!");
    expect(batch.mock.calls[0][0]).toEqual(["Hello"]);
    q.destroy();
  });

  it("writes results into the cache", async () => {
    const client = stubClient(async (texts) =>
      texts.map((t) => ({ text: `${t}!`, source: t, cached: false })),
    );
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p = q.enqueue("Hi", "h1", "it");
    await vi.advanceTimersByTimeAsync(50);
    await p;
    expect(cache.get("h1", "it")).toBe("Hi!");
    q.destroy();
  });

  it("rejects pending promises on quota exceeded", async () => {
    const client = stubClient(async () => {
      throw new QuotaExceededError();
    });
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p = q.enqueue("Hi", "h1", "it");
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(50);
    await expect(p).rejects.toBeInstanceOf(QuotaExceededError);
    q.destroy();
  });

  it("flush() forces pending queue out", async () => {
    const batch = vi.fn(async (texts: string[]) =>
      texts.map((t) => ({ text: t, source: t, cached: false })),
    );
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 10_000,
      batchSize: 100,
      sourceLocale: "en",
    });

    const p = q.enqueue("x", "h1", "it");
    await q.flush();
    await p;
    expect(batch).toHaveBeenCalledOnce();
    q.destroy();
  });
});
