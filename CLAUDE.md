# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **da-marketo**, an AEM EDS project that serves Marketo forms from business.adobe.com (Adobe for Business). It uses the Milo framework and AEM Live / Helix for delivery.

- **Org**: adobecom
- **Main branch**: `main`
- **Stage branch**: `stage`
- **Live**: https://main--da-marketo--adobecom.aem.live
- **Stage**: https://stage--da-marketo--adobecom.aem.live

## Commands

```sh
# Local development server — runs on port 6586 (set AEM_PORT=6586 in .env)
aem up

# Unit tests (web-test-runner)
npm test
npm run test:watch

# E2E tests (Playwright / NALA)
npm run test:nala
npm run test:nala:headed
npm run test:nala:ui
npm run test:nala:bstack   # BrowserStack cross-browser

# Linting
npm run lint        # JS + CSS
npm run lint:js
npm run lint:css
```

For Milo integration testing: run `npm run libs` in the Milo folder (port 6456), then add `?milolibs=local` to URLs.

To run lint automatically after each file edit (Cursor):
```json
// .cursor/hooks.json:
{
  "hooks": {
    "afterFileEdit": [
      "npm run lint:fix"
    ]
  }
}
```

### Running a single unit test

```sh
npx wtr "./test/scripts/utils.test.js" --node-resolve --port=2000
```

### Running a single E2E test

```sh
npx playwright test nala/tests/marketo.block.test.js --grep "Full template"
```

## Project context

This repo has two purposes:

1. **`blocks/da-marketo/`** — The EDS block that acts as a translation layer between DA-authored content and the Marketo script pipeline. This is the v2 replacement for Milo's built-in marketo block.

2. **`mkto/`** — An EDS-agnostic Marketo script pipeline (migrated from `mkto-frms`). These scripts know nothing about EDS or DA — the block translates DA content into the state they need to run against the Marketo Forms2 API.

### Editing `mkto/scripts/` files

Each file carries a header timestamp comment (`// ## Updated <YYYYMMDDTHHMMSS>` / `// ##  <path> - <YYYYMMDDTHHMMSS>`) and a `//# sourceURL=<filename>` at the end. When updating any `mkto/scripts/` file:

- Update the timestamp comment at the top to the current UTC time in `YYYYMMDDTHHMMSS` format.
- Ensure the `//# sourceURL=<filename>` line is still present at the end of the file.

### Development and testing cadence for `mkto/scripts`

1. Optionally write a unit test first, if expedient.
2. Develop the feature.
3. Test locally with `?marketolibs=local` (nala + manual verification).
4. Check the diff, commit, and push the branch.
5. Test again with `?marketolibs=<branch>` against the pushed branch.

## Architecture

See `ARCHITECTURE.md` for the full loading chain, phase descriptions, and environment matrix. Summary:

- **v1 (production)**: Milo's built-in marketo block — this repo not involved
- **v2 (active POC)**: `da-bacom` loads `blocks/da-marketo/` from this repo via Milo's `externalLibs` mechanism, triggered by `?marketolibs=<branch>`
- **v3 (future)**: Milo's own block updated to also load from `mkto/`

### `?marketolibs` param

Controls which branch of da-marketo is used for both the block and `mkto/` scripts:

| Param value | Block + scripts load from |
|---|---|
| `local` | `http://localhost:6586` |
| `sync-forms` | `https://sync-forms--da-marketo--adobecom.aem.live` |
| `main` | `https://main--da-marketo--adobecom.aem.live` |
| `org--repo--branch` | `https://org--repo--branch.aem.live` |

The param is handled in `da-bacom/scripts/scripts.js` (`MARKETO_LIBS`). When set, da-bacom renames `.marketo` blocks to `.da-marketo` (including inside fragments via `decorateArea`) and adds an `externalLibs` entry so Milo loads the block from this repo.

### Stack

- **Runtime**: Native ES modules (`"type": "module"`)
- **UI layer**: Preact (via `deps/htm-preact.js`) for the configurator block; vanilla JS everywhere else
- **Milo**: Loaded dynamically at runtime from `https://milo.adobe.com/libs` (or `?milolibs=<branch>` in dev). All shared utilities (`createTag`, `loadScript`, `loadLink`, `parseEncodedConfig`, etc.) are re-exported through `utils/utils.js` — never import from Milo URLs directly.

### Block architecture

Each block is a directory under `blocks/` with at least `<name>.js` and `<name>.css`. Milo's `loadArea` auto-discovers and decorates them.

| Block | Purpose |
|---|---|
| `blocks/da-marketo/` | Marketo form embed — translation layer + Forms2 loader |
| `blocks/da-marketo-config/` | Preact-based configuration UI for form authors |

`da-marketo.js` uses `BLOCK_BASE = new URL('../../', import.meta.url).href` to anchor all relative asset loads (including `mkto/`) to its own origin — this is how the block and scripts stay in sync across environments without extra config.

### Content source

`fstab.yaml` maps `/` to `https://content.da.live/adobecom/da-marketo/`. Block code is served from this repo; page content is served from DA (Document Authoring).

### Test structure

**Unit tests** (`test/`) use `@web/test-runner` + Chai. The runner config (`web-test-runner.config.js`) blocks all external network requests, so tests must mock any external dependencies.

**Unit testing `mkto/scripts/` files**: these are plain classic scripts (no `import`/`export`), loaded at runtime via `<script src>` injection in production, not ES modules — they attach everything to `window`/global scope with idempotency guards (`if (typeof window.X == "undefined")`) and rely on load order. Don't `import` them like `test/mkto/libs.test.js` does for `mkto/libs.js` (a real ES module) — top-level `var`/function declarations won't land on `window` the same way. Instead:

1. Load the real source files as classic `<script>` tags via a small helper (`createElement('script')` + `src` + await `onload`), mirroring production's `loadScript` behavior.
2. Provide only the dependency scripts the target code path actually touches, plus the minimum DOM/state needed to avoid early-return guards. For example, `mkto_checkTemplate` in `90_build/global.js` needs: a stub `<form class="mktoForm">` in the DOM (touched directly by `90_build/marketo_form_setup_process.js`), `00_config/marketo_form_setup_rules.js` (defines `mkf_c`), `90_build/marketo_form_setup_process.js` (defines `mktoFrmParams`), and `20_template_manager/template_rules.js` (defines `window.templateRules` — required because the function bails out early unless `mczPrefs.form.template` matches a real template with a `program_id` key).
3. Set up `window.mcz_marketoForm_pref` with just enough shape to pass those guards, call the real global function (e.g. `window.mkto_checkTemplate(...)`), and assert on the resulting `window.mcz_marketoForm_pref` state — same pattern as the nala tests, but in a real (Chrome) browser via `@web/test-runner`, no network or live DA page required.

See `test/mkto/scripts/` for worked examples of this pattern.

**Why `npm test` runs two `wtr` invocations**: every `mkto/scripts/` file ends with a `//# sourceURL=<filename>` comment (required — see "Editing `mkto/scripts/` files" above). When one of these is loaded via `<script src>`, V8 reports its coverage entry under that bare `sourceURL` (e.g. `global.js`) instead of a full URL, which crashes `@web/test-runner-coverage-v8`'s `new URL(entry.url)` call — before any `coverageConfig.exclude` pattern gets a chance to filter it out. `package.json`'s `test` script therefore runs `test/mkto/scripts/**` in a second, separate `wtr` call without `--coverage`, after the main coverage-instrumented run. Keep new `mkto/scripts/` unit test files under `test/mkto/scripts/` so they stay on the non-coverage path.

**E2E tests** (`nala/`) use Playwright / NALA:
- `nala/features/*.spec.js` — human-readable test specs (URL, scenarios, data)
- `nala/tests/*.test.js` — Playwright test code that reads from the spec
- `nala/selectors/*.page.js` — Page Object Models with selectors and helpers

Default E2E base URL: `https://main--da-bacom--adobecom.aem.live` (override with `BASE_URL` env var).

### Linting

ESLint uses Airbnb-base. `nala/` test files may import from devDependencies. `mkto/` is excluded from linting. No `console` calls in source files.

### Logging

Use `window.lana.log()` instead of `console.log()`. Logs go to Splunk.
```js
window.lana.log('message', { severity: 'warning', tags: 'block-name' });
```
Severity levels: `critical`, `error`, `warning`, `info`, `debug`.
