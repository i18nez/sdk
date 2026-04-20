# @i18nez/core

Framework-agnostic TypeScript client for the [i18nez](https://i18nez.dev) translation API.

Use this package directly if you're building for a framework without a dedicated i18nez SDK (Vue, Svelte, Solid, plain TS). React developers should reach for [`@i18nez/react`](https://www.npmjs.com/package/@i18nez/react) instead.

```bash
npm install @i18nez/core
```

## Quickstart

```ts
import { createClient, TranslationCache, TranslationQueue } from "@i18nez/core";

const client = createClient({
  apiKey: "tlv_pub_...",
  defaultLocale: "en",
});

// One-shot translation
const { text } = await client.translate({
  text: "Welcome to our app",
  sourceLocale: "en",
  targetLocale: "it",
});

// Bulk-fetch a locale bundle
const bundle = await client.getBundle("it");

// Batched, de-duplicated queue
const cache = new TranslationCache();
const queue = new TranslationQueue(client, cache, {
  sourceLocale: "en",
  batchInterval: 50,
  batchSize: 10,
});
await queue.enqueue("Hello world", hash, "it");
```

## Exports

| Export | Purpose |
|---|---|
| `createClient(config)` | HTTP client with retry, rate-limit handling, error classes |
| `TranslationCache` | In-memory LRU cache with optional persistence adapter |
| `TranslationQueue` | Batches and de-duplicates concurrent translate calls |
| `hashText(s)` | SHA-256 content hash (matches backend) |
| `detectLocale()` | Browser + Node locale detection |
| `isValidLocale / normalizeLocale` | BCP-47 validation |
| `QuotaExceededError`, `RateLimitedError`, `InvalidApiKeyError` | Typed error classes |

## Persistence

Provide any adapter matching the `PersistenceAdapter` interface — localStorage, AsyncStorage, IndexedDB, SQLite:

```ts
const adapter: PersistenceAdapter = {
  async get(key) { return localStorage.getItem(key); },
  async set(key, value) { localStorage.setItem(key, value); },
  async remove(key) { localStorage.removeItem(key); },
};
```

## License

MIT
