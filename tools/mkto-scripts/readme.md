
Implementation Details:

Use Marketo's getForm API endpoint (same shape as forms2 `loadForm`):

```
https://{host}/index.php/form/getForm?munchkinId={id}&form={formId}&url={encodedPageUrl}&callback={name}&_={timestamp}
```

Cross-origin calls use **JSONP** (dynamic `<script>` + global callback), not `fetch`, because Marketo historically relied on JSONP when CORS headers were unreliable.

The JSONP payload includes a `rows` array (nested) and optionally `fieldsetRows` (object of nested arrays). **Both** are flattened when collecting fields, matching `getFlattenedFields` in forms2.

Each field may have an `Htmltext` property containing raw HTML with embedded `<script>` tags. Parse each `Htmltext` to extract:

- HTML structure (strip embedded `script` tags for display; `<style>` nodes are removed from markup but not collected)
- All `<script>` tags in document order (inline `textContent` and/or `src` for externals)

**Script labels:** Implemented by **`resolveScriptFilename`** (default export) in [mkto-script-filename-mapping.js](./mkto-script-filename-mapping.js). It resolves paths from `// ## … .js` comments, lang/locale lines, `FORM_LINE_FILE_MAPPING`, then hash fallback. Pass **`subFolders`**: when **`false`**, use a **flat** basename list (strip any `dir/` from comment paths). When **`true`**, keep paths that already include `NN_folder/` from comments; otherwise prepend the folder from `BASENAME_TO_SUBFOLDER` (e.g. `adobe_analytics.js` → `50_analytics/adobe_analytics.js`, `state_translate-ru.js` → `80_translations/state_translate-ru.js`). External scripts: `marketo-script-external-{hash}.js`. Duplicate logical paths get `-2`, `-3`, … before `.js`.

## UI tool

Open [mkto-scripts.html](./mkto-scripts.html) via a local static server (or any https origin). Styles live in [mkto-scripts.css](./mkto-scripts.css).

**Fixed in code:** Marketo host, munchkin ID, and `url=` page URL — see `MKTO_DEFAULTS` in [mkto-scripts-defaults.js](./mkto-scripts-defaults.js) (shared with the scripts diff tool).

To **compare scripts between two form IDs**, use [../mkto-scripts-diff/mkto-scripts-diff.html](../mkto-scripts-diff/mkto-scripts-diff.html) (`?formA=` and `?formB=`).

**Form ID:** Dropdown or **`?form=`** only (no `formId`). If missing, `?form=2277` is applied. **`subFolders`** per form is defined on each `FORM_OPTIONS` entry and passed into `extractFromFormData(raw, { subFolders })`.

Example:

`http://localhost:3000/tools/mkto-scripts/mkto-scripts.html?form=3844`

After a successful load, **`window.mktoScriptsExtract`** is set to:

`{ raw, html, scripts: [{ filename, content, src?, position, sourcePath? }] }`

On error: `{ error, raw?, html: '', scripts: [] }`.

## Files

- [mkto-scripts-defaults.js](./mkto-scripts-defaults.js) — shared `MKTO_DEFAULTS`, `FORM_OPTIONS`, `subFoldersForFormId`
- [mkto-scripts.js](./mkto-scripts.js) — UI, `?form=`, `window.mktoScriptsExtract` (ES module)
- [mkto-form-fetch.js](./mkto-form-fetch.js) — getForm JSONP, flatten fields, Htmltext extraction
- [mkto-script-filename-mapping.js](./mkto-script-filename-mapping.js) — default export `resolveScriptFilename`
- [mkto-scripts.html](./mkto-scripts.html) — UI and `<pre>` output panels
- [mkto-scripts.css](./mkto-scripts.css) — page styles

Parsing approach (conceptual, in [mkto-form-fetch.js](./mkto-form-fetch.js)):

```js
// 1. Load JSONP (script tag + callback), receive `data`
// 2. Flatten fields from data.rows and Object.values(data.fieldsetRows || {})
// 3. For each field.Htmltext, DOMParser + tree walk; collect scripts; drop style nodes
// 4. Remove script/style nodes; append doc.body.innerHTML to combined HTML string
```
