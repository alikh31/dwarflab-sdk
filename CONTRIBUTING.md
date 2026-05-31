# Contributing

Thanks for your interest in improving the (unofficial) DWARFLAB SDK! This is a
community project and contributions — code, docs, and especially **hardware
reports** — are very welcome.

## Ground rules

- This project is **not affiliated with DWARFLAB**. Please keep contributions
  free of any proprietary material (decompiled code, leaked firmware, internal
  documents). The protocol description here is derived from observing a device's
  own network traffic; keep it that way.
- Be respectful. See the issue tracker for existing discussions before opening a
  new one.

## Project layout

This is an npm-workspaces monorepo:

- `packages/sdk` — `@alikh/dwarflab-sdk`, the core SDK (browser + Node.js)
- `packages/ble` — `@alikh/dwarflab-ble`, BLE Wi-Fi setup (Node.js only)
- `proto/` — protocol buffer definitions
- `docs/` — documentation

The protobuf TypeScript bindings in `packages/sdk/src/generated/` are committed.
They are produced from `proto/*.proto`; do not hand-edit them. If you change a
`.proto` file, regenerate with `npm run proto:generate` and commit the result.

## Development setup

```bash
git clone https://github.com/alikh31/dwarflab-sdk.git
cd dwarflab-sdk
npm install
npm run build
npm test
```

## Before opening a pull request

Run the full local gate — CI runs the same checks:

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit (all packages)
npm test            # vitest (all packages)
npm run build       # tsup (all packages)
```

All four must pass. Please add or update tests for behavior changes, and update
the relevant docs in `docs/` and the package READMEs.

## Hardware reports

Only the **DWARF 3** has been verified against physical hardware. If you have a
DWARF 2, DWARF 3 Plus, or DWARF Mini, reports of what works (and what doesn't)
are extremely valuable — please open an issue with:

- device model and firmware version,
- what you tried (method calls / commands),
- what happened (including any error codes and notification payloads).

## Commit / PR conventions

- Keep PRs focused; one logical change per PR where practical.
- Describe *why*, not just *what*. If a behavior was verified on hardware, say
  which device and firmware.
- Note any new commands/notifications you added and how you confirmed their
  shape.

## Releasing (maintainers)

Releases are tag-driven and tokenless (npm Trusted Publishing / OIDC). To cut
a release `vX.Y.Z`:

1. Bump `version` to `X.Y.Z` in **both** `packages/sdk/package.json` **and**
   `packages/ble/package.json`. They must be equal and must match the tag — the
   release workflow fails fast otherwise.
2. Add an `X.Y.Z` entry to [CHANGELOG.md](./CHANGELOG.md).
3. Commit, then tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```
4. `.github/workflows/release.yml` runs the full gate, then publishes both
   packages to npm with provenance via OIDC. No token is involved.
5. Create the GitHub Release (e.g. `gh release create vX.Y.Z --notes-file ...`).

Each package already has a Trusted Publisher configured on npmjs.com (GitHub
Actions → `alikh31/dwarflab-sdk`, workflow `release.yml`). If you add a third
package, configure its Trusted Publisher the same way before its first CI
publish, and bootstrap its very first version with a local `npm publish`
(npm has no trusted-publisher setup for a package that does not yet exist).

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
