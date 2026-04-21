import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "../src/client";
import {
  QuotaExceededError,
  RateLimitedError,
  InvalidApiKeyError,
} from "../src/types";

function mockFetch(
  responses: Array<{
    status: number;
    body?: unknown;
    headers?: Record<string, string>;
    throws?: Error;
  }>,
) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r.throws) {
      fn.mockRejectedValueOnce(r.throws);
      continue;
    }
    fn.mockResolvedValueOnce(
      new Response(r.body === undefined ? null : JSON.stringify(r.body), {
        status: r.status,
        headers: r.headers,
      }),
    );
  }
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("createClient.translate", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends POST with Bearer auth", async () => {
    const fetchFn = mockFetch([
      {
        status: 200,
        body: { text: "Ciao", source: "Hello", cached: false },
      },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    await client.translate("Hello", "en", "it");

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.i18nez.com/api/v1/translate");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk_test",
      "Content-Type": "application/json",
    });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      text: "Hello",
      source_locale: "en",
      target_locale: "it",
    });
  });

  it("returns translation result", async () => {
    mockFetch([
      {
        status: 200,
        body: { text: "Ciao", source: "Hello", cached: true },
      },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    const result = await client.translate("Hello", "en", "it");
    expect(result).toEqual({ text: "Ciao", source: "Hello", cached: true });
  });

  it("retries 3 times on 5xx", async () => {
    const fetchFn = mockFetch([
      { status: 500 },
      { status: 502 },
      { status: 200, body: { text: "Ciao", source: "Hello", cached: false } },
    ]);
    const client = createClient({
      apiKey: "sk_test",
      defaultLocale: "en",
      retries: 3,
    });
    const result = await client.translate("Hello", "en", "it");
    expect(result.text).toBe("Ciao");
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("does not retry on 400", async () => {
    const fetchFn = mockFetch([{ status: 400, body: { error: "bad" } }]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    await expect(client.translate("x", "en", "it")).rejects.toThrow();
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("throws QuotaExceededError on 402", async () => {
    mockFetch([{ status: 402, body: { error: "quota" } }]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    await expect(client.translate("x", "en", "it")).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });

  it("throws RateLimitedError on 429 with retry-after", async () => {
    mockFetch([{ status: 429, headers: { "retry-after": "30" } }]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    const error = await client
      .translate("x", "en", "it")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfter).toBe(30);
  });

  it("throws InvalidApiKeyError on 401", async () => {
    mockFetch([{ status: 401 }]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    await expect(client.translate("x", "en", "it")).rejects.toBeInstanceOf(
      InvalidApiKeyError,
    );
  });

  it("pauses subsequent requests after 429 until retry-after elapses", async () => {
    const fetchFn = mockFetch([
      { status: 429, headers: { "retry-after": "30" } },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });

    await expect(client.translate("a", "en", "it")).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    expect(fetchFn).toHaveBeenCalledOnce();

    const second = await client
      .translate("b", "en", "it")
      .catch((e: unknown) => e);
    expect(second).toBeInstanceOf(RateLimitedError);
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});

describe("createClient.translateBatch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends batch request and parses array response", async () => {
    mockFetch([
      {
        status: 200,
        body: {
          translations: [
            { text: "Ciao", source: "Hello", cached: false },
            { text: "Grazie", source: "Thanks", cached: false },
          ],
        },
      },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    const results = await client.translateBatch(
      ["Hello", "Thanks"],
      "en",
      "it",
    );
    expect(results).toHaveLength(2);
    expect(results[0].text).toBe("Ciao");
  });
});

describe("createClient.getBundle", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("GETs bundle endpoint with locale", async () => {
    const fetchFn = mockFetch([
      {
        status: 200,
        body: {
          locale: "it",
          translations: { h1: "Ciao" },
          updatedAt: "2026-04-16T00:00:00Z",
        },
      },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    const bundle = await client.getBundle("it");
    expect(bundle.translations).toEqual({ h1: "Ciao" });
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain("/translate/bundle");
    expect(url).toContain("target_locale=it");
  });

  it("includes since param when provided", async () => {
    const fetchFn = mockFetch([
      {
        status: 200,
        body: { locale: "it", translations: {}, updatedAt: "now" },
      },
    ]);
    const client = createClient({ apiKey: "sk_test", defaultLocale: "en" });
    await client.getBundle("it", "2026-04-15T00:00:00Z");
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain("since=");
  });
});
