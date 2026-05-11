# @i18nez/core

## 1.3.0

### Minor Changes

- 4a0f4d5: Per-label `context` now propagates through the batch translation queue.
  The `TranslationQueue` previously accepted `context` on `enqueue()` but
  discarded it at flush time, so the API received `undefined` and short
  ambiguous labels (e.g. "Left", "Share", "Run") could not be disambiguated
  even when callers passed per-instance context. Queue items are grouped by
  `(targetLocale, dynamic, context)` and the active context is forwarded to
  `translateBatch`. The pending-item dedup key now includes context too, so
  identical `(source, targetLocale)` pairs with different contexts produce
  separate translations.

  Note: requires the server-side context-aware cache (translations table
  `context_hash` column plus cache-key change). Deploy the API before
  publishing this SDK release, otherwise the client sends the right context
  but the server still collapses translations across contexts.

  New `clientBundle` option on `I18nezCoreConfig` (core) and
  `I18nezProvider` props (React). When set, every request includes an
  `X-Client-Bundle` header carrying the iOS bundle ID or Android package
  name, used by the API to enforce per-key bundle allowlists on mobile,
  where there is no browser `Origin` header. On React Native, pass the
  value from `react-native-device-info` (`getBundleId()`).

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
