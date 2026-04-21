# @i18nez/react

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
