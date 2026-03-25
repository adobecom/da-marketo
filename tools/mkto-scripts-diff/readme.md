# Marketo form scripts diff

Compares extracted `<script>` chunks between two Marketo form IDs using the same getForm JSONP pipeline as [../mkto-scripts/](../mkto-scripts/).

Open [mkto-scripts-diff.html](./mkto-scripts-diff.html) via a local static server.

**URL:** `?formA=<id>&formB=<id>`. Omit either param for an empty select; both must be chosen before a compare runs (no hard-coded default IDs in the URL).

**Fixed in code:** host, munchkin ID, and `url=` — see `MKTO_DEFAULTS` in [mkto-scripts-defaults.js](../mkto-scripts/mkto-scripts-defaults.js).

After a successful compare, **`window.mktoScriptsDiff`** includes `extractedA`, `extractedB`, `byFilename` (per-file `lineStats` and unified diff text when changed), `aggregateLineDiff` (`{ added, removed }` summed over changed scripts), and `rawA` / `rawB`.

The UI shows a **line-number gutter** on every block. **Identical** scripts are **collapsed** under `<details>`; changed and form-only scripts stay expanded. Each row shows **line-diff stats**: for changed files, `+N −M · U unchanged`; for identical / only-on-one-side, total **line count**. Changed scripts include a **jump bar** to move between **change hunks** (contiguous runs of `+`/`-` lines). The diff **starts at the top** of the file (`Top · N hunks`); use Prev/Next (or focus the bar and use ←/→ or P/N) to scroll. **Prev** from the first hunk returns to the top.

## Files

- [mkto-scripts-diff.js](./mkto-scripts-diff.js) — UI, dual selects, `window.mktoScriptsDiff`
- [mkto-diff-lines.js](./mkto-diff-lines.js) — line-based unified diff text
- [mkto-scripts-diff.html](./mkto-scripts-diff.html) — page
- [mkto-scripts-diff.css](./mkto-scripts-diff.css) — styles
