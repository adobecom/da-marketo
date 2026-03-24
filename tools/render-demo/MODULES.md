# Form Engine Demo – Module Walkthrough

Overview of each file and how they fit together. Flow: **config** → **engine** (index → buildFormState → renderSkeleton → renderForm → applyInteractivity) using **modules** and **config**.

---

## App shell (not a “module” but the entry)

| File | Role |
|------|------|
| **render-demo.html** | Entry page: nexter.css, import map (da-lit, styles), `<form-engine-demo>`. |
| **render-demo.js** | LitElement root: configurator UI, preview container ref, debug panel. Builds `currentConfig` from controls, calls `engine.run(config, { delayMs, container, locale })`, wires `onStateChange` / `onEvent` to debug. Uses `_engineHasRunOnce` to avoid double run. |
| **render-demo.css** | Layout (main row: configurator | preview, debug below), form-demo-* styles, two-column fieldset, responsive. |

---

## Config

| File | Role |
|------|------|
| **config/strings.js** | Two locales (`en`, `de`). Keys: app/configurator/debug labels, field labelKey/placeholderKey, validation, buttons, subtypes, options. `getString(locale, key)` with fallback to `en`. |
| **config/presets.js** | **RenderConfig** source: `ALL_FIELDS`, `getConfigForTemplate(template, overrides)` (flex_contact / flex_event / flex_content → steps, fields, default subtype), `DEFAULT_RENDER_CONFIG`, `PRESETS` (Short, Multi-step with PP, All features). |

---

## Engine

| File | Role |
|------|------|
| **engine/index.js** | Single entry: `run(config, { delayMs, container, locale })`. Clears container → renderSkeleton → optional delay → getKnownUserFieldIds (pp) → buildFormState → remove skeleton → renderForm → applyInteractivity. Holds `formStateRef`, `currentState`; exposes `getStateSnapshot`, `onStateChange`, `onEvent`, `getEventLog`, `reset`. `setState` / `reRenderForm` / `emitEvent` passed to applyInteractivity. |
| **engine/buildFormState.js** | `buildFormState(config, { knownUserFieldIds, locale })`. Maps config.fields: resolve label/placeholder via `getString`, set `visible = !ppHiddenFieldIds.has(id)`, add value/error. Calls `getEffectiveSteps(steps, fields)`; returns `{ state, effectiveSteps }`. |
| **engine/renderSkeleton.js** | `renderSkeleton(config, container)`. Uses `steps[0].fieldIds.length` → step0 rows (ceil(count/2)), 2-col grid. Classes: `form-demo-skeleton`, `form-demo-skeleton-row`, `form-demo-skeleton-field`. |
| **engine/renderForm.js** | `renderForm(formState, container)`. Builds form DOM: fieldset (2-col grid), one div per field (label + input/select/textarea), optional privacy block, step nav (Next/Back/Submit). When `multiStep` false, shows all visible fields; when true, only current step. Uses `form-demo-form-visible`, form-demo-* classes. |
| **engine/applyInteractivity.js** | `applyInteractivity(container, api)`. Binds: input/change → `updateFieldValue` (setState, conditional visibility, country → privacy block); Company/CompanyName blur → mock enrichment; Next/Back → setState currentStepIndex, reRenderForm; submit → validateVisibleRequired → on invalid set errors and reRenderForm, on valid → handleSuccess. Uses getState, setState, reRenderForm, emitEvent from api. |

---

## Modules (shared helpers)

| File | Role |
|------|------|
| **modules/pp.js** | Progressive profiling / known user: `getKnownUserFieldIds(formId)`, `setKnownUserFieldIds(formId, fieldIds)`, `clearKnownUser(formId)`. Key: `form_demo_known_<formId>`, value: JSON array of submitted field ids. |
| **modules/effectiveSteps.js** | `getEffectiveSteps({ steps, fields })`. Returns steps that have at least one visible field (stepIndex, fieldIds, visibleCount). Used so multi-step skips empty steps after PP. |
| **modules/mockEnrichment.js** | `runMockEnrichment(companyValue, onEnrich)`. Mock lookup (e.g. "Acme" → CompanyName, Country, PostCode); 300ms delay then `onEnrich(prefill)`. |
| **modules/validation.js** | `validateVisibleRequired(formState, getString)`. For each visible required field, if value empty sets error via getString(locale, 'validationRequired'). Returns `{ errors, valid }`. |
| **modules/successHandler.js** | `handleSuccess(success, container, submittedFieldIds, formId, getString, locale)`. Calls `setKnownUserFieldIds`; if redirect type and content, `window.location.href`; else replaces container with success message div (`form-demo-success-message`). |

---

## Data flow (summary)

1. **Configurator** → builds RenderConfig (template, subtype, features, success, etc.) → `engine.run(config, { delayMs, container, locale })`.
2. **Engine run**: skeleton (from step0 field count) → delay → **pp** get known user ids → **buildFormState** (strings, pp visibility, **effectiveSteps**) → **renderForm** (all fields or current step, 2-col fieldset) → **applyInteractivity** (input, blur, next/back, submit).
3. **On submit**: **validation** (visible required) → if valid, **successHandler** (persist field ids for PP, message or redirect).
4. **Debug** reads `getStateSnapshot()` and `getEventLog()`; state/events updated via `onStateChange` / `onEvent`.

If you tell me which module you want to change first (e.g. pp, validation, presets), we can go through it line by line or adjust behavior.

---

## Alignment with Marketo Block (milo final design)

The **marketo block** (milo `libs/blocks/marketo/`) is the production form: it loads forms in an iframe and styles them with `.marketo`-scoped CSS (`.marketo-form-wrapper`, `.mktoForm`, `.mktoFormRow`, `.mktoFormCol`, `.mktoLabel`, `.mktoField`, `.mktoButton`, etc.).

**Ways to close the gap:**

1. **Visual alignment (current approach)**  
   Keep the demo’s DOM and class names (`form-demo-*`). Update `render-demo.css` so the demo matches the marketo block’s look: wrapper (max-width 600px, background #FAFAFA, padding), 2-col grid with 4.6% gap, label/input/error/button styles, and error state (red border + icon). No changes to `renderForm.js` structure or `applyInteractivity.js` selectors.

2. **Structural alignment**  
   Change `renderForm.js` to output the same DOM and classes as the marketo block (e.g. `form.mktoForm`, `.mktoFormRow.mktoFormRowTop`, `.mktoFormCol.mktoVisible`, `.mktoFieldWrap`, `.mktoLabel`, `.mktoField`, `.mktoButton`). Wrap the output in `.marketo` and `.marketo-form-wrapper`. Then either load milo’s `marketo.css` in the demo or copy the relevant rules. Update `applyInteractivity.js` and `engine/index.js` (e.g. wrapper selector for re-render) to use the new selectors. This gives full parity so the same CSS file can be shared.

Recommendation: use **(1)** for a quick, low-risk visual match; use **(2)** when you want the demo to be a drop-in preview of the same markup the block expects.

---

## Comparison with Marketo Features (wiki)

| Wiki feature | Demo status | Notes |
|--------------|-------------|--------|
| **Known User** | ✅ Covered | localStorage stores submitted field ids; next load hides those fields (PP). |
| **Auto Submit (Known User)** | ⏭️ Skipped | Wiki says disabled; not in demo. |
| **Enrichment (Demandbase)** | ✅ Mock | Company/CompanyName blur → mock prefill (CompanyName, Country, PostCode). No real Demandbase. |
| **Dynamic POI** | ❌ Missing | Pre-select Primary Product of Interest from MEP/block/referrer. Demo has no prefill source for POI. |
| **One-page gated** | ❌ Missing | Show/hide sections after submit, `?form=off` to ungate. Demo only does message or redirect. |
| **Multi-step** | ✅ Covered | Steps, Next/Back, effective steps (skip empty after PP). |
| **Progressive Profiling** | ⚠️ Partial | **Visibility:** ✅ hide previously submitted fields. **Pre-fill:** ❌ no known-user prefill (would need Marketo/session data). |

**Not in wiki but in demo:** Privacy by country (show legal after Country), Conditional visibility (e.g. State when Country in US/CA). These are form-presentation behaviors the demo uses to show flexibility.

---

## Recommended path forward

1. **Document and leave as-is for POC**  
   Treat the demo as “form engine + subset of Marketo features.” Add a short README or comment that Dynamic POI, One-page gated, and PP pre-fill are out of scope for this POC; link to the wiki for full feature list.

2. **Add minimal “feature parity” for demo only**  
   - **Dynamic POI:** Configurator option or URL param (e.g. `?poi=Analytics`) to set Primary Product of Interest prefill so the behavior is demonstrable.  
   - **PP pre-fill:** When known user, pre-fill visible fields from a small localStorage cache (e.g. last submitted values keyed by formId) so “known user” shows both fewer fields and prefilled values.  
   - **One-page gated:** Leave out of demo unless you need to prove section show/hide; that’s more of a page/block concern than the form engine itself.

3. **Align naming with wiki**  
   In configurator or MODULES.md, add a line mapping: “Progressive profiling” = Known User + field visibility (and optionally pre-fill); “Enrichment” = Company enrichment (mock Demandbase). No code change required if behavior is already correct.

Recommendation: do **(1)** and, if you want the demo to better mirror production, add **(2)** for Dynamic POI and PP pre-fill only; keep One-page gated for a later iteration.

---

## Progressive Profiling Test Plan alignment

Reference: [Progressive Profiling Test Plan](context/marketo/wiki/Progressive%20Profiling%20Test%20Plan.md).

**Principle in the plan:** Previously collected fields are **hidden** on subsequent forms; only **new** fields are shown. Known user is shared across form types (Short → Medium → RFI in the same session).

### Field names: test plan vs demo

| Test plan (technical name) | Demo field id | Notes |
|----------------------------|---------------|--------|
| FirstName, LastName | FirstName, LastName | Match |
| Email | BusinessEmail | Different name; same role |
| mktoFormsCompany / Organization name | CompanyName | Different name |
| Country, State, PostalCode | Country, State, PostCode | Match (PostalCode ↔ PostCode) |
| Phone | BusinessPhone | Different name |
| mktoFormsJobTitle | JobTitle | Match |
| mktoFormsFunctionalArea | Department | Different name |
| mktoFormsPrimaryProductInterest | PrimaryProductOfInterest | Different name |
| mktoFormsCompanyType (Company type, depends on POI) | — | Not in demo; conditional on POI in plan |

### What the demo does today

- **Per-formId known user:** We store submitted field ids in `form_demo_known_<formId>`. Each form (Short vs Medium vs RFI) has its own “known” state. Submitting Short does **not** hide FirstName/LastName/Company on Medium, because Medium uses a different formId.
- **Visibility:** For a given formId, we hide fields that were in that form’s “submitted” list on the next load. “Reset known user” clears that formId’s key.

### What the test plan expects (cross-form PP)

- **Shared known user across form types:** Submit Short → visit Medium. FirstName, LastName, Organization name are **hidden** on Medium because they were collected on Short. Known user is global (or per program/session), not per formId.
- **Journeys:** Short → Medium: hide firstName, lastName, company; show email, country, jobTitle, department. Short → RFI: hide firstName, lastName, company; show the rest. Medium → RFI: hide firstName, lastName, company, jobTitle, department; show the rest.

### Path forward to match the test plan

1. **Single shared key for PP in the demo**  
   Use one storage key for “submitted field ids” across all demo forms (e.g. `form_demo_known_global`). On submit, merge submitted field ids into that key. When rendering any form (Short, Medium, RFI), read the same key and hide those fields. Then Short → Medium and Short → RFI match the test plan.

2. **“Reset known user”** clears the shared key so all forms show full fields again (like Test 10 – cleared cookies).

3. **Field ids** can stay as-is; behavior (which fields hidden/shown) is what the test plan validates.

4. **Company type** (depends on POI): omit for POC unless you need POI-dependent visibility.

Implementing (1) and (2) would let the demo run the same journey tests as the wiki (Short → Medium, Short → RFI, Medium → RFI).
