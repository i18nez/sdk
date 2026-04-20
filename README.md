# i18nez SDK

Open-source client SDKs for the [i18nez](https://i18nez.dev) translation API.

## Packages

| Package | Description |
| --- | --- |
| [`@i18nez/core`](./packages/core) | Framework-agnostic client |
| [`@i18nez/react`](./packages/react) | React hooks and components |

More SDKs (React Native, Vue, Svelte, ...) coming.

## Development

```bash
bun install
bun run build
bun test
```

### Local linking

To use an in-development SDK from another project on your machine:

```bash
# from this repo
cd packages/core && bun link
cd ../react && bun link

# from the consumer project
bun link @i18nez/core
bun link @i18nez/react
```

## Contributing

PRs welcome. Open an issue first for non-trivial changes.

## License

MIT — see [LICENSE](./LICENSE).
