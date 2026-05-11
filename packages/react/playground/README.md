# @i18nez/playground

Vite + React example app that exercises every feature of `@i18nez/react` using
MSW (Mock Service Worker) to fake the i18nez backend. No real API credentials
or backend required.

Lives at `packages/react/playground` so it sits next to the package it
demonstrates. The folder is not published (the `@i18nez/react`
`files: ["dist"]` entry keeps it out of the npm tarball).

## Running

```bash
# From repo root:
bun install

# Build the SDK once (playground consumes the workspace `dist/` output):
bun run --cwd packages/core build
bun run --cwd packages/react build

# Start the playground:
bun run --cwd packages/react/playground dev
```

Open http://localhost:5173 and the service worker registers on first load.

> If you're iterating on the SDK, run `bun run --cwd packages/react dev` in a
> second terminal so tsup rebuilds `dist/` on every save.

## Manual test checklist

Before declaring the SDK foundation validated, walk through every tab and
confirm the observed behavior matches the expectation:

### Static <T>
- [ ] On first paint, English text appears ("Hello", "Welcome", "Add to cart").
- [ ] Within ~100 ms, translations update to the default locale `en` (unchanged
      here, the bundle contains identity mappings).
- [ ] Switch the header `LocaleSwitcher` to `it`. All three items flip to
      "Ciao", "Benvenuto", "Aggiungi al carrello".
- [ ] Flip through every locale. No flicker or stale text.

### Params
- [ ] Default shows "Ciao Dani" (or the English source pre-bundle).
- [ ] Type in the Name input → translation updates live with interpolation.
- [ ] Change Count → "Hai 7 messaggi" etc.

### Dynamic
- [ ] On mount, "I love pizza" briefly shows as raw text.
- [ ] After ~50 ms (batch interval), it replaces with `[IT] I love pizza`
      (since the source isn't seeded in the bundle, the mock `/translate/batch`
      endpoint returns the locale-tagged fallback).
- [ ] Edit the textbox → new text hashes, enqueues, resolves.

### Fallback
- [ ] First line shows the English source immediately (no fallback prop).
- [ ] Second line shows a gray skeleton bar while `status === "initializing"`,
      then swaps to the translation.
- [ ] Switch locales: skeleton reappears briefly between fetches.

### Locale switch
- [ ] `useLocale()` values match the current locale and available list grows
      as bundles load.
- [ ] Clicking the inline language buttons triggers a fetch and flips the UI.

### Boundary
- [ ] Idle state shows "Boundary is idle."
- [ ] Click "Arm explosion" → fallback text replaces the idle message and the
      error message is displayed in red above.
- [ ] React dev-mode may log the error to the console. That's expected.

### Persistence
- [ ] The `writes` array grows by one entry per locale loaded.
- [ ] Toggle between `en` and `it` → both locales appear in `localesPersisted`.
- [ ] Refresh the page: first paint should fire a `save` for the current
      locale from the nested provider (because MSW returns fresh bundles).

### Status
- [ ] `locale` matches the active locale.
- [ ] `status` cycles `initializing` → `ready`.
- [ ] `isLoading` is `true` only during `initializing`.

## Troubleshooting

- **"Cannot find module '@i18nez/react'"**, run `bun install` at the repo root
  so bun workspaces re-link, then rebuild the SDK (`bun run --cwd packages/react build`).
- **"Service worker registration failed"**, delete
  `public/mockServiceWorker.js` and rerun `bun run msw:init` inside this
  directory.
- **Network errors for `mock.i18nez.test`**, MSW didn't start. Check the dev
  console for "[MSW] Mocking enabled".
