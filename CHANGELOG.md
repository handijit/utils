# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-11-10

The package is now built and resolved differently. The observable behaviour of
all 22 functions is unchanged. See "Migrating from 1.x" in the README for the
old and new behaviour side by side.

### Added

- ES module build (`build/index.mjs`) next to the CommonJS build, selected
  through the new `exports` map (`import` and `require` conditions).
- `"sideEffects": false`, so bundlers can drop the functions you do not import.
- Minified UMD bundle (`build/index.umd.js`, global `handijitUtils`) for
  `<script>` usage, wired to the `unpkg` and `jsdelivr` fields.
- Type declarations for ES module consumers (`build/index.d.mts`), identical to
  `build/index.d.ts`.
- Source maps for every published JavaScript file.
- `CHANGELOG.md` is published with the package.

### Changed

- **Breaking:** the package declares an `exports` map. Only `@handijit/utils`
  and `@handijit/utils/package.json` can be imported; deep paths such as
  `@handijit/utils/build/index.js` now fail with
  `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **Breaking:** `import` in Node.js loads a real ES module instead of the
  CommonJS file through interop. A default import
  (`import utils from "@handijit/utils"`) no longer works; use named imports or
  `import * as utils`.
- **Breaking:** the CommonJS entry moved from `build/index.js` to
  `build/index.cjs`. `require("@handijit/utils")` is unaffected.
- The ESM and CommonJS files are published unminified; consumers' bundlers
  minify them.
- Releases published from CI get a GitHub Release with the matching section of
  this file.

### Removed

- `build/index.js` and `build/index.js.map` (replaced by `build/index.cjs`).

## [1.0.0] - 2026-11-06

First release under the name `@handijit/utils`. Same code as
`@ahmetilhn/handy-utils` 4.2.0, the package's previous name.

[Unreleased]: https://github.com/handijit/utils/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/handijit/utils/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/handijit/utils/releases/tag/v1.0.0
