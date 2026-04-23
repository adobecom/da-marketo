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
| `blocks/marketo-config/` | Preact-based configuration UI for form authors |

`da-marketo.js` uses `BLOCK_BASE = new URL('../../', import.meta.url).href` to anchor all relative asset loads (including `mkto/`) to its own origin — this is how the block and scripts stay in sync across environments without extra config.

### Content source

`fstab.yaml` maps `/` to `https://content.da.live/adobecom/da-marketo/`. Block code is served from this repo; page content is served from DA (Document Authoring).

### Test structure

**Unit tests** (`test/`) use `@web/test-runner` + Chai. The runner config (`web-test-runner.config.js`) blocks all external network requests, so tests must mock any external dependencies.

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
