import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TranslationQueue } from "../src/queue";
import { TranslationCache } from "../src/cache";
import {
  QuotaExceededError,
  RateLimitedError,
  type TranslationResult,
} from "../src/types";
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

  it("waits for the debounce window even when batch size is reached", async () => {
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

    q.enqueue("a", "h1", "it");
    q.enqueue("b", "h2", "it");
    expect(batch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(50);
    expect(batch).toHaveBeenCalledOnce();
    q.destroy();
  });

  it("chunks oversized batches into sequential requests (no parallel burst)", async () => {
    let inFlight = 0;
    let maxConcurrent = 0;
    const batch = vi.fn(async (texts: string[]) => {
      inFlight++;
      maxConcurrent = Math.max(maxConcurrent, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
      return texts.map((t) => ({ text: `${t}!`, source: t, cached: false }));
    });
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const promises = Array.from({ length: 25 }, (_, i) =>
      q.enqueue(`t${i}`, `h${i}`, "it"),
    );
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTimersAsync();
    await Promise.all(promises);

    expect(batch).toHaveBeenCalledTimes(3);
    expect(batch.mock.calls[0][0]).toHaveLength(10);
    expect(batch.mock.calls[1][0]).toHaveLength(10);
    expect(batch.mock.calls[2][0]).toHaveLength(5);
    expect(maxConcurrent).toBe(1);
    q.destroy();
  });

  it("retries on RateLimitedError respecting retryAfter", async () => {
    let calls = 0;
    const batch = vi.fn(async (texts: string[]) => {
      calls++;
      if (calls === 1) throw new RateLimitedError(2);
      return texts.map((t) => ({ text: `${t}!`, source: t, cached: false }));
    });
    const client = stubClient(batch);
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p = q.enqueue("Hi", "h1", "it");
    await vi.advanceTimersByTimeAsync(50);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.runAllTimersAsync();
    const result = await p;
    expect(result).toBe("Hi!");
    expect(batch).toHaveBeenCalledTimes(2);
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

  it("groups by context and forwards it to the batch call", async () => {
    const batch = vi.fn(
      async (
        texts: string[],
        _src: string,
        _tgt: string,
        _context?: string,
      ) => texts.map((t) => ({ text: `${t}-x`, source: t, cached: false })),
    );
    const client = stubClient(async (texts) =>
      texts.map((t) => ({ text: `${t}-x`, source: t, cached: false })),
    );
    (client.translateBatch as unknown as typeof batch) = batch;
    const cache = new TranslationCache();
    const q = new TranslationQueue(client, cache, {
      batchInterval: 50,
      batchSize: 10,
      sourceLocale: "en",
    });

    const p1 = q.enqueue("left", "h1", "it", "remaining time");
    const p2 = q.enqueue("right", "h2", "it", "direction");
    const p3 = q.enqueue("home", "h3", "it");

    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2, p3]);

    expect(batch).toHaveBeenCalledTimes(3);
    const ctxArgs = new Set(batch.mock.calls.map((c) => c[3]));
    expect(ctxArgs).toEqual(new Set([undefined, "direction", "remaining time"]));
    q.destroy();
  });

  it("does NOT dedupe identical hash+locale when contexts differ", async () => {
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

    const p1 = q.enqueue("left", "h1", "it", "remaining time");
    const p2 = q.enqueue("left", "h1", "it", "direction");
    await vi.advanceTimersByTimeAsync(50);
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);
    expect(batch).toHaveBeenCalledTimes(2);
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
