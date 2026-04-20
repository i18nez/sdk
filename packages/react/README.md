# @i18nez/react

React hooks and components for the [i18nez](https://i18nez.dev) translation API.

Drop-in i18n for React apps. Wrap your tree once, write English in your JSX, and i18nez translates on the fly into every locale you target. Translations are cached per-tenant and distributed to every user of your app — you pay for the translation once, not once per user.

```bash
npm install @i18nez/react @i18nez/core
```

## Quickstart

```tsx
import { I18nezProvider, T } from "@i18nez/react";

export default function App() {
  return (
    <I18nezProvider
      apiKey={process.env.NEXT_PUBLIC_I18NEZ_KEY!}
      defaultLocale="en"
    >
      <h1><T>Welcome to our store</T></h1>
      <p><T>Browse thousands of products.</T></p>
    </I18nezProvider>
  );
}
```

On first render i18nez fetches the translation bundle for the active locale. Missing strings are queued, batched, and sent to the API. The returned translation is cached locally and (optionally) persisted so every subsequent render is instant.

## API

### `<I18nezProvider>`

```tsx
<I18nezProvider
  apiKey="tlv_pub_..."         // public key (safe in client)
  defaultLocale="en"
  fallbackLocale="en"          // optional — used when target has no translation
  apiUrl="https://api.i18nez.dev"  // optional override
  preloadLocales={["it","fr"]} // optional — warm caches at boot
  context="e-commerce product page"  // optional — guides the LLM
  tone="friendly"
  persistence={localStorageAdapter}  // optional — persist bundles across reloads
/>
```

### `useTranslation()`

```tsx
const { t, locale, setLocale, isLoading } = useTranslation();

return <button>{t("Add to cart")}</button>;
// with params
return <span>{t("Hello, {name}!", { params: { name: user.name } })}</span>;
```

### `<T>` component

```tsx
<T>Sign up free</T>
<T params={{ count }}>You have {count} items</T>
<T context="call-to-action">Get started</T>
```

### `useLocale()`

```tsx
const [locale, setLocale] = useLocale();
```

### `<LocaleSwitcher>`

```tsx
<LocaleSwitcher locales={["en", "it", "fr", "es"]} />
```

### `<TranslationBoundary>`

```tsx
<TranslationBoundary fallback={<SourceText />}>
  <T>Anything that might fail</T>
</TranslationBoundary>
```

## How it works

1. First render — `<T>Welcome</T>` emits the source text; i18nez hashes it, checks the local cache, shows the source as fallback, and enqueues a translation request.
2. Response arrives — cache is updated, the tree re-renders with the translated text.
3. Next session — the persisted bundle is loaded synchronously; translations appear without any network round-trip.

Dynamic content (user-generated, backend data) is hashed and translated on-demand the first time it's seen; all subsequent users of your app get the cached translation from the edge.

## SSR / Next.js

Wrap the root layout; the provider is a client component.

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return <html><body><Providers>{children}</Providers></body></html>;
}

// app/providers.tsx
"use client";
import { I18nezProvider } from "@i18nez/react";
export function Providers({ children }) {
  return (
    <I18nezProvider apiKey={process.env.NEXT_PUBLIC_I18NEZ_KEY!} defaultLocale="en">
      {children}
    </I18nezProvider>
  );
}
```

## License

MIT
