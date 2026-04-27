# @i18nez/react

## 1.2.0

### Minor Changes

- `I18nezProvider` defaults bumped to `batchInterval: 100` (was 50) and `batchSize: 50` (was 10). The new defaults match the server's `BATCH_MAX_SIZE` and give the debounce window enough room to coalesce StrictMode double-renders into a single batch — drastically reducing 429s on dense pages.

### Patch Changes

- Updated dependencies
  - @i18nez/core@1.2.0

## 1.1.1

### Patch Changes

- Fixed React 19 / StrictMode warning "Can't perform a state update on a component that hasn't mounted yet" triggered by `<T>` on first render. Provider's internal `bump()` now defers re-render scheduling to a microtask until the component is mounted.

## 1.1.0

### Minor Changes

- `<T>` now supports an `animate` prop with four CSS-only presets — `fade`, `blur`, `slide`, `typewriter` — playing whenever the translation changes. Optional `duration` (ms) per instance. Default is `none`.
- `<T>` exposes a `dynamic` prop. When set, the translation is served from the session cache but excluded from the locale bundle — keeps bundles lean on apps with runtime-variable content (e-commerce SKUs, UGC, CMS).
- Provider now gates enqueues on the locale bundle being loaded — no more wasteful batch requests for strings that are about to arrive in the bundle.
- Fixed invalid-hook-call / StrictMode regressions that could kill the translation queue after the first dev-mode double mount.
- Context value now re-emits on internal bumps so consumers re-render when a translation lands.

### Patch Changes

- Updated dependencies
  - @i18nez/core@1.1.0

## 1.0.0

### Major Changes

- Initial alpha release: core translation client + React hooks (useTranslate, useLocale) and <I18nezProvider />

### Patch Changes

- Updated dependencies
  - @i18nez/core@1.0.0
