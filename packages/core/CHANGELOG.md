# @i18nez/core

## 1.2.0

### Minor Changes

- `TranslationQueue` no longer flushes immediately when `batchSize` is reached, it always waits for the debounce window and serializes flushes via an internal in-flight chain. This collapses an entire page of `t()` calls into a single window and prevents parallel request bursts that triggered server-side 429s.
- Oversized batches (more than `batchSize` items) are split into chunks and dispatched **sequentially**, so a page with 200 strings produces ⌈200/batchSize⌉ ordered requests instead of a parallel burst.
- Automatic retry on `RateLimitedError`: the queue now respects the server's `Retry-After` (with exponential-backoff fallback, max 3 attempts) before surfacing a 429 to callers.

## 1.1.0

### Minor Changes

- Endpoints realigned to `/api/v1/*` to match the versioned server contract.
- `translateBatch` accepts an optional `dynamic` flag. When `true`, the server translates and caches the result in Redis but skips persistence to the locale bundle, ideal for product names, user text, CMS bodies.
- Batch response now reads `translations` (aligned with the server), replacing the previous `results`.
- Queue deduplication key now includes the `dynamic` flag so static and dynamic enqueues for the same string/locale don't collide.

## 1.0.0

### Major Changes

- Initial alpha release: core translation client + React hooks (useTranslate, useLocale) and <I18nezProvider />
