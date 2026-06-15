# Marketo form scripts diff

Compares extracted `<script>` chunks between two Marketo form IDs using the Marketo getForm JSONP API.

Open [mkto-diff.html](./mkto-diff.html) via a local static server.

**URL:** `?formA=<id>&formB=<id>`. Omit either param for an empty select; both must be chosen before a compare runs.

**Fixed in code:** host, munchkin ID, and `url=` — see `MKTO_DEFAULTS` in [../libs/defaults.js](../libs/defaults.js).

Scripts are identified and assigned logical filenames (e.g. `scripts/30_privacy/privacy_validation.js`) using the same `resolveScriptFilename` logic as the build pipeline — see [../libs/filename-mapping.js](../libs/filename-mapping.js).

After a successful compare, **`window.mktoScriptsDiff`** includes `extractedA`, `extractedB`, `byFilename` (per-file `lineStats` and unified diff text when changed), `aggregateLineDiff` (`{ added, removed }` summed over changed scripts), and `rawA` / `rawB`.

The UI shows a **line-number gutter** on every block. **Identical** scripts are **collapsed** under `<details>`; changed and form-only scripts stay expanded. Each row shows **line-diff stats**: for changed files, `+N −M · U unchanged`; for identical / only-on-one-side, total **line count**. Changed scripts include a **jump bar** to move between **change hunks** (contiguous runs of `+`/`-` lines). The diff **starts at the top** of the file (`Top · N hunks`); use Prev/Next (or focus the bar and use ←/→ or P/N) to scroll. **Prev** from the first hunk returns to the top.

## Files

- [mkto-diff.js](./mkto-diff.js) — UI, dual selects, `window.mktoScriptsDiff`
- [mkto-diff-lines.js](./mkto-diff-lines.js) — line-based unified diff text
- [mkto-diff.html](./mkto-diff.html) — page
- [mkto-diff.css](./mkto-diff.css) — styles

### Shared libs (`../libs/`)

- [defaults.js](../libs/defaults.js) — `MKTO_DEFAULTS`, `FORM_OPTIONS`, `buildGetFormBaseUrl`
- [form-fetch.js](../libs/form-fetch.js) — JSONP loader, `extractFromFormData`, `getFlattenedFields`
- [filename-mapping.js](../libs/filename-mapping.js) — script identification and logical path resolution
