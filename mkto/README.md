# mkto/

EDS-agnostic Marketo script pipeline for business.adobe.com forms. These scripts run against the [Marketo Forms 2.0 API](https://engage.adobe.com) and know nothing about EDS or DA — the `blocks/da-marketo/` block is responsible for translating page content into the state they need.

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

## Entry point

`mkto.js` is the only public export. It loads `deps/forms2.min.js` from the same origin, calls `MktoForms2.loadForm` against `engage.adobe.com`, then chains the scripts above in order before calling `marketoFormSetup('stage1')`.

## Logging

Use LANA — no `console` calls.

```js
window.lana.log('message', { sampleRate: 100, tags: 'mkto-frms', severity: 'error' });
```
