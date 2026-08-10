# Marketo form scripts diff

Compares extracted `<script>` chunks between two sides, **A** and **B**, each independently either a Marketo form (using the Marketo getForm JSONP API) or a **da-marketo codebase branch** (the `mkto/scripts/**` source files served from that branch's AEM live host).

Open [mkto-diff.html](./mkto-diff.html) via a local static server.

**URL:** `?formA=<id-or-branch>&b=<id-or-branch>`. Each side is classified automatically — all-digits means a Marketo form ID, anything else means a da-marketo branch name (e.g. `main`, `diff`). Omit either param for an empty field; both must be filled before a compare runs. The **swap button** always swaps A and B, whichever kind each side is.

**Ignore structural diffs** (checkbox, on by default; `&ignoreStructural=0` to disable): strips `// <![CDATA[` / `// ]]>` wrapper comment lines before comparing, since forms include them and codebase source files don't.

**Ignore whitespace** (checkbox, off by default; `&ignoreWhitespace=1` to enable): treats two lines as equal if they differ only in whitespace (like `diff -w`), and also drops blank/whitespace-only lines entirely before comparing so an extra or missing blank line doesn't count as a change either.

**Always ignored, regardless of either toggle:** the `const templateVersion = "...";` line — its value is expected to differ per form/branch by design (e.g. `"1723:MCZ Staging (1723)"` vs `"2277:MCZ Production(2277)"`).

**Codebase fetch details:** for branch mode, every known script path (see `listKnownScriptPaths` in [../libs/filename-mapping.js](../libs/filename-mapping.js)) is fetched from `https://<branch>--da-marketo--adobecom.aem.live/mkto/<path>`. Uses `.aem.live`, not `.aem.page` — `.aem.page` (preview) requires an authenticated session and 401s on plain `fetch()`, while `.aem.live` serves the same code-sync'd files with `Access-Control-Allow-Origin: *`. A script only shows as "only in A" if it's live in the form but the file 404s on that branch — there's no way to detect codebase-only files that were never deployed to any form.

**Fixed in code:** host, munchkin ID, and `url=` — see `MKTO_DEFAULTS` in [../libs/defaults.js](../libs/defaults.js). Codebase org/repo/env and the locale list used to expand `state_translate-*.js` are in the same file (`CODEBASE_DEFAULTS`, `KNOWN_SCRIPT_LOCALES`).

Scripts are identified and assigned logical filenames (e.g. `scripts/30_privacy/privacy_validation.js`) using the same `resolveScriptFilename` logic as the build pipeline — see [../libs/filename-mapping.js](../libs/filename-mapping.js).

After a successful compare, **`window.mktoScriptsDiff`** includes `extractedA`, `extractedB`, `byFilename` (per-file `lineStats` and unified diff text when changed), `aggregateLineDiff` (`{ added, removed }` summed over changed scripts), and `rawA` / `rawB`.

The UI shows a **line-number gutter** on every block. **Identical** scripts are **collapsed** under `<details>`; changed and form-only scripts stay expanded. Each row shows **line-diff stats**: for changed files, `+N −M · U unchanged`; for identical / only-on-one-side, total **line count**. Changed scripts include a **jump bar** to move between **change hunks** (contiguous runs of `+`/`-` lines). The diff **starts at the top** of the file (`Top · N hunks`); use Prev/Next (or focus the bar and use ←/→ or P/N) to scroll. **Prev** from the first hunk returns to the top.

## Files

- [mkto-diff.js](./mkto-diff.js) — UI, form/branch input, `window.mktoScriptsDiff`
- [mkto-diff-lines.js](./mkto-diff-lines.js) — line-based unified diff text
- [mkto-diff.html](./mkto-diff.html) — page
- [mkto-diff.css](./mkto-diff.css) — styles

### Shared libs (`../libs/`)

- [defaults.js](../libs/defaults.js) — `MKTO_DEFAULTS`, `FORM_OPTIONS`, `buildGetFormBaseUrl`, `CODEBASE_DEFAULTS`, `KNOWN_SCRIPT_LOCALES`, `BRANCH_OPTIONS`, `buildCodebaseFileUrl`
- [form-fetch.js](../libs/form-fetch.js) — JSONP loader, `extractFromFormData`, `getFlattenedFields`, `fetchTextFile`
- [filename-mapping.js](../libs/filename-mapping.js) — script identification and logical path resolution, `listKnownScriptPaths`
