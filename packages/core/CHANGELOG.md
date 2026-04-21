# @i18nez/core

## 1.1.0

### Minor Changes

- Endpoints realigned to `/api/v1/*` to match the versioned server contract.
- `translateBatch` accepts an optional `dynamic` flag. When `true`, the server translates and caches the result in Redis but skips persistence to the locale bundle — ideal for product names, user text, CMS bodies.
- Batch response now reads `translations` (aligned with the server), replacing the previous `results`.
- Queue deduplication key now includes the `dynamic` flag so static and dynamic enqueues for the same string/locale don't collide.

## 1.0.0

### Major Changes

- Initial alpha release: core translation client + React hooks (useTranslate, useLocale) and <I18nezProvider />
