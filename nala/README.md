# Nala E2E Tests

End-to-end tests for the `da-marketo` block, built on [Playwright](https://playwright.dev/) using the NALA pattern (spec / test / page-object separation).

See the [root README](/README.md#testing-changes-on-bacom-pages) for how `?marketolibs` controls which branch the block and `mkto/` scripts load from — the `MARKETO_LIBS` env var below sets that same param for test runs.

## Structure

```
nala/
├── features/    # Human-readable test specs — one array entry per test case
├── tests/       # Playwright test code that reads from the specs
├── selectors/   # Page Object Models — locators + helper methods
├── utils/       # Shared test data (fixtures)
├── fixtures.js  # Playwright test/browser fixtures (incl. BrowserStack)
└── results/     # Playwright output (HTML report, traces) — gitignored
```

| File | Purpose |
|---|---|
| `features/marketo.block.spec.js` | Test case definitions: `tcid`, `name`, `path`, `tags`, `type`, `formType` |
| `tests/marketo.block.test.js` | Test runner — groups features by `type` and drives the flow |
| `selectors/marketo.block.page.js` | `MarketoBlock` page object — locators and reusable actions |
| `utils/marketo.test.data.js` | Static `TEST_DATA` used to fill form fields |

## Running tests

```sh
npm run test:nala          # headless, all browsers/projects
npm run test:nala:headed   # headed (visible browser)
npm run test:nala:ui       # Playwright UI mode
npm run test:nala:bstack   # BrowserStack cross-browser (browserstack.config.js)
```

Run a single test by name:

```sh
npx playwright test nala/tests/marketo.block.test.js --grep "Full template"
```

Run by tag (tags are embedded in the test title, e.g. `@smoke`, `@regression`):

```sh
npx playwright test nala/tests/marketo.block.test.js --grep "@smoke"
```

## Environment variables

| Var | Purpose | Default |
|---|---|---|
| `BASE_URL` | Site under test | `https://main--da-marketo--adobecom.aem.live` |
| `MILO_LIBS` | Appends `?milolibs=<branch>` to test URLs | unset |
| `MARKETO_LIBS` | Appends `?marketolibs=<branch>` to test URLs — also used by CDN routing, privacy-locale, and locale-translation tests to determine the expected script origin | unset |
| `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` | Required for `test:nala:bstack` | unset |
| `CI` | Extends per-test timeout to 3 min and switches the reporter | unset |

Some tests (`cdnRouting`, `privacyLocale`, `localeTranslation`) are skipped unless `MARKETO_LIBS` is set to a non-`main`/`stage` branch — these validate PR-branch behavior against prod/stage baselines, which aren't yet patched.

### Examples

Run against the default `da-marketo` test pages, no `?marketolibs` override:

```sh
npm run test:nala
```

Test a `da-marketo` PR branch's block + `mkto/` scripts against `da-marketo`'s own pages:

```sh
MARKETO_LIBS=my-branch npm run test:nala
```

Test MCZ forms on `da-bacom` pages:

```sh
BASE_URL=https://main--da-bacom--adobecom.aem.live npm run test:nala
```

Test a branch end-to-end on `da-bacom` loading a `da-marketo` branch via `externalLibs`:

```sh
BASE_URL=https://main--da-bacom--adobecom.aem.live MARKETO_LIBS=my-branch npm run test:nala
```

Test a specific feature on `da-bacom` pages:

```sh
BASE_URL=https://main--da-bacom--adobecom.aem.live npx playwright test nala/tests/marketo.block.test.js --grep "@marketoProgramId"
```

Test a specific feature on `da-bacom` pages with a `MARKETO_LIBS` override:

```sh
BASE_URL=https://main--da-bacom--adobecom.aem.live MARKETO_LIBS=my-branch npx playwright test nala/tests/marketo.block.test.js --grep "@marketoProgramId"
```

## Scoping tests to a site

Some features only apply on specific sites (e.g. `/ie/` and `/jp/` locale pages are currently only authored under `da-marketo`, not `da-bacom`). Add a `sites: ['da-marketo']` array to a feature in `features/marketo.block.spec.js` to restrict it — omit `sites` to run everywhere (the default).

The current site is derived from `BASE_URL`'s `<branch>--<repo>--<org>.aem.live` hostname (the `<repo>` segment, e.g. `da-marketo`, `da-bacom`). Tests whose feature doesn't list the current site are skipped via `test.skip`, not failed — so running the suite against `da-bacom` won't flag `ie`/`jp` tests as broken, just not applicable. To add support for a new site, add its repo name to the relevant features' `sites` arrays.

## Adding a test case

1. Add an entry to `features/marketo.block.spec.js` with a unique `tcid`, a descriptive `name`, the authored DA `path`, `tags`, and a `type` that matches (or introduces) a test group.
2. If `type` is new, add a corresponding `features.filter((f) => f.type === '<type>')` block in `tests/marketo.block.test.js`.
3. Add any new locators or helper methods to `selectors/marketo.block.page.js` rather than inlining selectors in the test.

## Notes

- Test pages live under `/drafts/nala/blocks/marketo/*` (or `/drafts/denli/blocks/marketo/*` for field-preference fixtures) in DA content — see the `path` field per feature.
- `results/` is Playwright's output directory (HTML report + test-results/traces) and should not be committed.
