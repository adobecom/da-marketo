# Branch Functionality Summary

## Criterion 1: Code matching / replacing `github.com/adobecom/mkto-frms`

These branches have a local copy of the mkto-frms scripts hosted within the repo itself (files like `cleaning_validation.js`, `field_preferences.js`, `marketo_form_setup_process.js`, `adobe_analytics.js`, `rendering_review.js`):

| Branch | Folder | Notes |
|---|---|---|
| **`self-host-scripts`** | `blocks/marketo-v2/mkto-frms/` | Most complete — loads all scripts in a full chain via `loadScript()` |
| **`self-host`** | `blocks/marketo-v2/mkto-frms/` | Same file set, slightly shorter load chain |
| **`marketo-clean`** | `blocks/marketo-v2/mkto-frms/` | Same files |
| **`marketo-v2`** | `blocks/marketo-v2/forms/` | Same scripts, different folder name |
| **`v2`** | `blocks/marketo-v2/mcz/` | Same scripts, different folder name |

`self-host-scripts` is the most developed of these — its `marketo-v2.js` chains 12 `loadScript()` calls to load all the self-hosted form logic in order.

## Criterion 2: Function that strips the rich HTML text field from loading forms

**`debugging`** is the only branch with dedicated tooling for this. It has `tools/mkto-scripts/mkto-form-fetch.js` which:
- Fetches Marketo form data via JSONP using the `getForm` API
- Iterates each field's `Htmltext` property (the rich HTML text attached to the form)
- Uses `DOMParser` to parse it, walks the DOM to collect and then remove all `<script>` and `<style>` tags
- Returns clean HTML separately from the extracted scripts

No other branch has this logic.

## Summary

- For **self-hosting mkto-frms**: see **`self-host-scripts`** (most complete)
- For **stripping rich HTML text fields**: see **`debugging`** (`tools/mkto-scripts/mkto-form-fetch.js`)

---

## Branch Recency: `self-host-scripts` vs `debugging`

_Added: 2026-04-16_

**`debugging`** has the newer commits.

| Branch | Latest Commit Date | Latest Commit Message |
|---|---|---|
| **`self-host-scripts`** | 2025-02-12 | "No script tags" |
| **`debugging`** | 2026-03-25 | "Diffing forms" |

`debugging` is over a year more recent than `self-host-scripts`, making it the more actively maintained of the two.

---

## Correction: Which Branch Satisfies Which Criterion

_Added: 2026-04-16_

On closer inspection, no single branch satisfies both criteria. The coverage breaks down as follows:

**`debugging` — satisfies Criterion 2 only (rich text stripping), NOT Criterion 1**

`debugging`'s `marketo-v2.js` only loads `deps/forms2.min.js`. There is no local copy of the mkto-frms scripts in this branch. The rich text stripping logic lives exclusively in `tools/mkto-scripts/mkto-form-fetch.js`, specifically the `extractFromHtmltext()` function (line 80), which:
- Parses each field's `Htmltext` via `DOMParser`
- Walks the DOM and collects `<script>` nodes
- Calls `node.remove()` on each one
- Pushes the cleaned `doc.body.innerHTML` to an output array

**`self-host-scripts` — satisfies Criterion 1 only (mkto-frms dependency code), NOT Criterion 2**

`self-host-scripts` hosts the full mkto-frms script suite locally under `blocks/marketo-v2/mkto-frms/` and chains all 12 scripts via `loadScript()` in `marketo-v2.js`. However, it has no tooling to strip rich HTML text fields from loading forms.

**No branch currently satisfies both criteria simultaneously.** Combining the self-hosting approach from `self-host-scripts` with the rich text stripping logic from `debugging` would be required to meet both goals.
