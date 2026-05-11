---
"@i18nez/core": minor
"@i18nez/react": minor
---

Per-label `context` now propagates through the batch translation queue.
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
