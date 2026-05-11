import {
  type BundleResult,
  type I18nezCoreConfig,
  InvalidApiKeyError,
  QuotaExceededError,
  RateLimitedError,
  type TranslationResult,
} from "./types";

export interface I18nezClient {
  translate(
    text: string,
    sourceLocale: string,
    targetLocale: string,
    context?: string,
  ): Promise<TranslationResult>;

  translateBatch(
    texts: string[],
    sourceLocale: string,
    targetLocale: string,
    context?: string,
    dynamic?: boolean,
  ): Promise<TranslationResult[]>;

  getBundle(targetLocale: string, since?: string): Promise<BundleResult>;
}

const DEFAULT_BASE = "https://api.i18nez.com";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 3;

interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
}

export function createClient(config: I18nezCoreConfig): I18nezClient {
  const baseUrl = (config.apiUrl ?? DEFAULT_BASE).replace(/\/$/, "");
  const retries = config.retries ?? DEFAULT_RETRIES;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  let rateLimitedUntil = 0;

  async function request<T>(opts: RequestOptions): Promise<T> {
    const query = opts.query
      ? "?" +
        Object.entries(opts.query)
          .filter(([, v]) => v !== undefined)
          .map(
            ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`,
          )
          .join("&")
      : "";
    const url = `${baseUrl}${opts.path}${query}`;

    const now = Date.now();
    if (rateLimitedUntil > now) {
      const remaining = Math.ceil((rateLimitedUntil - now) / 1000);
      throw new RateLimitedError(remaining);
    }

    let attempt = 0;
    let delay = 500;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      let res: Response;
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        };
        if (config.clientBundle) {
          headers["X-Client-Bundle"] = config.clientBundle;
        }
        res = await fetch(url, {
          method: opts.method,
          headers,
          body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        if (attempt >= retries) throw err;
        attempt++;
        await sleep(delay);
        delay *= 2;
        continue;
      }
      clearTimeout(timer);

      if (res.ok) {
        return (await res.json()) as T;
      }

      if (res.status === 401) throw new InvalidApiKeyError();
      if (res.status === 402) throw new QuotaExceededError();
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "0");
        if (retryAfter > 0) {
          rateLimitedUntil = Date.now() + retryAfter * 1000;
        }
        throw new RateLimitedError(retryAfter);
      }

      if (res.status >= 500 && attempt < retries) {
        attempt++;
        await sleep(delay);
        delay *= 2;
        continue;
      }

      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
  }

  return {
    async translate(text, sourceLocale, targetLocale, context) {
      return request<TranslationResult>({
        method: "POST",
        path: "/api/v1/translate",
        body: {
          text,
          source_locale: sourceLocale,
          target_locale: targetLocale,
          ...(context !== undefined ? { context } : {}),
        },
      });
    },

    async translateBatch(texts, sourceLocale, targetLocale, context, dynamic) {
      const response = await request<{ translations: TranslationResult[] }>({
        method: "POST",
        path: "/api/v1/translate/batch",
        body: {
          texts,
          source_locale: sourceLocale,
          target_locale: targetLocale,
          ...(context !== undefined ? { context } : {}),
          ...(dynamic ? { dynamic: true } : {}),
        },
      });
      return response.translations;
    },

    async getBundle(targetLocale, since) {
      return request<BundleResult>({
        method: "GET",
        path: "/api/v1/translate/bundle",
        query: { target_locale: targetLocale, since },
      });
    },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
