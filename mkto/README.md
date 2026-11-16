# mkto/

Marketo script pipeline for business.adobe.com forms. These scripts run against the [Marketo Forms 2.0 API](https://engage.adobe.com) and know nothing about EDS or DA — the `blocks/da-marketo/` block is responsible for translating page content into the state they need.

**Exceptions:** `libs.js` is the Milo/AEM EDS entry point, and `features/marketo-consent-banner/` contains the thank-you reminder UI — see [EDS/Milo entry point](#edsmilo-entry-point) below.

## Relationship to mkto-frms

These scripts are synced from the private [`mkto-frms`](https://github.com/adobecom/mkto-frms) repo, which is the current source of truth. DA-Marketo is working toward becoming the source of truth (v3).

**Do not edit these files directly.** Make changes in `mkto-frms` and sync them here:

```sh
npm run build:sync-marketo
```

This fetches scripts directly from a live Marketo form on `engage.adobe.com`, maps each inline script to its filename, and writes the result to this folder. To target a specific form:

```sh
npm run build:sync-marketo -- --form 1723
```

Available forms: `2277` (MCZ Production, default), `2259` (MCZ Short Form), `1723` (MCZ Staging), `3844` (Progressive Profiling), `2945` (DA Sandbox).

## Not yet migrated

The following modules exist in `mkto-frms` but have not yet been synced here:

| Folder | Purpose |
|---|---|
| `95_known_visitor/` | Known visitor detection and prefill from cookies/localStorage/sessionStorage |
| `98_progressive/` | Multi-step progressive form controller with cross-iframe postMessage sync |

## Folder structure

Numeric prefixes indicate load order. Scripts are loaded sequentially by `mkto.js` — order matters.

| Folder | Purpose |
|---|---|
| `00_config/` | Data layer init (`window.mcz_marketoForm_pref`), default rules, LANA logging setup |
| `20_template_manager/` | Template selection and field visibility rules per template |
| `30_privacy/` | Adobe Privacy consent validation, IMS integration, Korea compliance |
| `40_field_management/` | Field visibility, dependency logic (e.g. State depends on Country), prefill preferences |
| `50_analytics/` | Adobe Analytics / Alloy event tracking for form view, prefill, submit, and errors |
| `60_enrichment/` | Demandbase API integration for B2B company field enrichment |
| `80_translations/` | Translated button text and state/province labels for 23+ locales |
| `90_build/` | Core engine: form render, validation, submission, auto-success, cookies |

## Central state object

All form configuration lives in `window.mcz_marketoForm_pref`. This is populated by the `da-marketo` block before scripts load. Modules read from this object to drive behavior — do not use module-local state for anything shared across modules.

## EDS/Milo entry point

`libs.js` is the Milo/AEM EDS loader. Consumers (e.g. `da-bacom/scripts/scripts.js`, or eventually Milo itself) import it and call `register({ getConfig, setConfig })` to activate da-marketo on a page:

```js
const mkto = await import(`${MARKETO_LIBS}/libs.js`);
mkto.register({ getConfig, setConfig });
```

`MARKETO_LIBS` is the base URL for this repo's `mkto/` folder (e.g. `https://main--da-marketo--adobecom.aem.live/mkto`), so the import resolves to `mkto/libs.js` on the correct origin.

`register()` reads the current Milo config, appends `{ base, blocks: ['da-marketo'] }` to `externalLibs`, and wraps `decorateArea` to rename `.marketo` elements to `.da-marketo`. The base URL is self-resolved via `import.meta.url` — no URL needs to be passed in.

The loader and consent-banner renderer use Milo's API; the numbered pipeline scripts remain EDS-agnostic.

`eslint.config.js` explicitly ignores `mkto/mkto.js`, `mkto/deps/**`, and `mkto/[0-9]*/**` (the vendored pipeline scripts) but **not** `libs.js` — so linting applies here.

### Germany consent reminder POC

The block's genuine Forms2 success callback queues a reminder only for submitted `Country === 'DE'` and `mktoKoreaPrivacyThirdParty === 'yes'`. This mapping is verified for form 2277, not all form families. The destination comes from the custom runtime's current configuration, not Forms2's follow-up URL. Like the custom controller, valid URL content is treated as a redirect even when the runtime type is `msg` or `message`. Modal, section, IMS, Adobe Connect, actual message, cross-origin and same-path outcomes do not queue a reminder. Auto-success and test-emulation controllers do not invoke this hook.

The one-shot `milo:marketo-consent-reminder` session entry contains only version, destination origin/path and creation time, with a 10-minute expiry. New submissions and ineligible successes clear old intent. The German banner is dismissible and removed on `pagehide`; no analytics, URL flags, cookies, local storage or raw form values are added.

`register()` conditionally imports the receiver after Milo's deferred readiness when pending state exists, including pages without a form. This works with unchanged `milolibs=main`, but **both the form and thank-you page must load this da-marketo branch** through the existing `marketolibs` URL or `marketo-libs` metadata setup. A form-page query parameter is not automatically carried across the redirect. No new banner metadata is required.

For branch previews, select `milolibs=main&marketolibs=marketo-germany-check-poc` on both pages (or use existing site metadata to select the same da-marketo branch). Production hostnames use the host's `/mkto` mapping rather than a query-selected feature branch.

Manual focused checks:

```sh
npx wtr './test/blocks/da-marketo/consent-reminder.test.js' './test/blocks/da-marketo/da-marketo.test.js' './test/mkto/libs.test.js' --node-resolve --port=2000
npx eslint mkto/libs.js mkto/blocks/da-marketo/da-marketo.js mkto/features/marketo-consent-banner/*.js test/blocks/da-marketo/consent-reminder.test.js test/blocks/da-marketo/mocks/sanitizeHtml.js web-test-runner.config.js
npx stylelint 'mkto/features/marketo-consent-banner/*.css'
```

Site-wide consent-field coverage, deployed redirects, actual email confirmation and applicable functional-storage/CMP policy remain rollout gates.

## Marketo entry point

`mkto.js` is the Marketo pipeline loader. It loads `deps/forms2.min.js` from the same origin, calls `MktoForms2.loadForm` against `engage.adobe.com`, then chains the scripts above in order before calling `marketoFormSetup('stage1')`.

It is called by `blocks/da-marketo/da-marketo.js` after the block has translated DA content into `window.mcz_marketoForm_pref`.

## Logging

Use LANA — no `console` calls.

```js
window.lana.log('message', { sampleRate: 100, tags: 'mkto-frms', severity: 'error' });
```
