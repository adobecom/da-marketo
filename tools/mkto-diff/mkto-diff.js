/**
 * Compare Marketo form scripts between a form ID and either another form ID or a
 * da-marketo codebase branch. Exposes window.mktoScriptsDiff after a successful compare.
 * Query: ?formA=<id>&b=<id-or-branch>
 */

import {
  buildGetFormBaseUrl,
  extractFromFormData,
  fetchTextFile,
  loadJsonp,
} from '../libs/form-fetch.js';
import {
  BRANCH_OPTIONS,
  buildCodebaseFileUrl,
  FORM_OPTIONS,
  KNOWN_SCRIPT_LOCALES,
  MKTO_DEFAULTS,
} from '../libs/defaults.js';
import { listKnownScriptPaths } from '../libs/filename-mapping.js';
import {
  lineCount,
  normalizeNewlines,
  unifiedDiffWithStats,
} from './mkto-diff-lines.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function scriptDisplayText(s) {
  if (!s) return '';
  if (s.src) {
    return `/* src: ${s.src} */\n${s.content || ''}`.trim();
  }
  return normalizeNewlines(s.content || '');
}

function scriptsToMap(scripts) {
  const m = new Map();
  for (let i = 0; i < scripts.length; i += 1) {
    m.set(scripts[i].filename, scripts[i]);
  }
  return m;
}

// Structural boilerplate that isn't meaningful code, e.g. CDATA wrapper comments.
const STRUCTURAL_LINE_PATTERNS = [
  /^\/\/\s*<!\[CDATA\[\s*$/,
  /^\/\/\s*\]\]>\s*$/,
  /^\s*const templateVersion = ".*";?\s*$/,
];

let ignoreStructural = true; // eslint-disable-line prefer-const -- set by the toolbar checkbox
let ignoreWhitespace = false; // eslint-disable-line prefer-const -- set by the toolbar checkbox

function stripIgnoredLines(text) {
  const patterns = ignoreStructural ? [...STRUCTURAL_LINE_PATTERNS] : [];
  return text
    .split('\n')
    .filter((line) => !patterns.some((re) => re.test(line)))
    .join('\n')
    .trim();
}

function normalizeForCompare(s) {
  return stripIgnoredLines(normalizeNewlines(scriptDisplayText(s)));
}

function whitespaceKey(line) {
  return line.replace(/\s+/g, '');
}

function getLineKey() {
  return ignoreWhitespace ? whitespaceKey : undefined;
}

// A whitespace-only line differing purely in blank-line count (extra/missing blank
// line) still changes the total line count, so lineKey alone can't align it away —
// drop blank lines outright before diffing when whitespace is being ignored.
function stripBlankLinesIfIgnoringWhitespace(text) {
  if (!ignoreWhitespace) return text;
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

function lineClassForUnified(line) {
  if (line.startsWith('---') || line.startsWith('+++')) {
    return 'mkto-diff-line-hdr';
  }
  if (line.startsWith('+')) return 'mkto-diff-line-add';
  if (line.startsWith('-')) return 'mkto-diff-line-del';
  return '';
}

function renderLinesWithNumbers(text, { unified } = {}) {
  const lines = String(text).split('\n');
  const wrap = document.createElement('div');
  wrap.className = unified ? 'mkto-diff-pre-lined mkto-diff-pre-unified' : 'mkto-diff-pre-lined';
  for (let i = 0; i < lines.length; i += 1) {
    const row = document.createElement('div');
    row.className = 'mkto-diff-line-row';
    const num = document.createElement('span');
    num.className = 'mkto-diff-linenum';
    num.textContent = String(i + 1);
    const content = document.createElement('span');
    content.className = 'mkto-diff-line-text';
    const line = lines[i];
    const cls = unified ? lineClassForUnified(line) : '';
    if (cls) {
      content.innerHTML = `<span class="${cls}">${escapeHtml(line)}</span>`;
    } else {
      content.textContent = line;
    }
    row.append(num, content);
    wrap.appendChild(row);
  }
  return wrap;
}

function rowHasDiffLine(row) {
  const textSpan = row.querySelector('.mkto-diff-line-text');
  if (!textSpan) return false;
  return !!(textSpan.querySelector('.mkto-diff-line-add')
    || textSpan.querySelector('.mkto-diff-line-del'));
}

function getChangeHunkStartRows(wrapEl) {
  const rows = wrapEl.querySelectorAll('.mkto-diff-line-row');
  const hunks = [];
  let prevChange = false;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const hasChange = rowHasDiffLine(row);
    if (hasChange && !prevChange) hunks.push(row);
    prevChange = hasChange;
  }
  return hunks;
}

function scrollUnifiedToTop(wrapEl) {
  if (!wrapEl) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrapEl.scrollTop = 0;
    });
  });
}

function scrollUnifiedToRow(wrapEl, row) {
  if (!wrapEl || !row || !wrapEl.contains(row)) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cRect = wrapEl.getBoundingClientRect();
      const rRect = row.getBoundingClientRect();
      wrapEl.scrollTop += rRect.top - cRect.top;
    });
  });
}

function attachUnifiedDiffNavigator(wrapEl) {
  if (!wrapEl || !wrapEl.classList.contains('mkto-diff-pre-unified')) return null;
  const hunks = getChangeHunkStartRows(wrapEl);
  if (hunks.length === 0) return null;

  const bar = document.createElement('div');
  bar.className = 'mkto-diff-jump-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Jump between change hunks in this diff');

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'mkto-diff-jump-btn';
  prevBtn.textContent = 'Prev change';
  prevBtn.setAttribute('aria-label', 'Previous change hunk');

  const pos = document.createElement('span');
  pos.className = 'mkto-diff-jump-pos';
  pos.setAttribute('aria-live', 'polite');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'mkto-diff-jump-btn';
  nextBtn.textContent = 'Next change';
  nextBtn.setAttribute('aria-label', 'Next change hunk');

  let idx = -1;

  function updateControls() {
    if (idx < 0) {
      pos.textContent = hunks.length ? `Top · ${hunks.length} hunks` : '0 / 0';
    } else {
      pos.textContent = `${idx + 1} / ${hunks.length}`;
    }
    prevBtn.disabled = idx < 0;
    nextBtn.disabled = idx >= hunks.length - 1;
  }

  function goTo(i) {
    idx = Math.max(-1, Math.min(hunks.length - 1, i));
    if (idx < 0) {
      scrollUnifiedToTop(wrapEl);
    } else {
      scrollUnifiedToRow(wrapEl, hunks[idx]);
    }
    updateControls();
  }

  prevBtn.addEventListener('click', () => {
    if (idx > -1) goTo(idx - 1);
  });
  nextBtn.addEventListener('click', () => {
    if (idx < hunks.length - 1) goTo(idx + 1);
  });

  bar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
      if (idx > -1) {
        e.preventDefault();
        goTo(idx - 1);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
      if (idx < hunks.length - 1) {
        e.preventDefault();
        goTo(idx + 1);
      }
    }
  });

  bar.append(prevBtn, pos, nextBtn);
  bar.tabIndex = 0;
  updateControls();

  return bar;
}

function getRawInputValue(id) {
  const el = document.getElementById(id);
  return (el && el.value ? el.value : '').trim();
}

/** A numeric value is a form ID; anything else is treated as a branch name. */
function classifyInput(raw) {
  if (!raw) return { kind: 'none', value: '' };
  return /^\d+$/.test(raw) ? { kind: 'form', value: raw } : { kind: 'branch', value: raw };
}

function parseFormPairFromUrl() {
  const sp = new URLSearchParams(window.location.search);
  const rawA = sp.get('formA') || '';
  const rawB = sp.get('b') || '';
  return { rawA, rawB };
}

function populateComboDatalist(datalistId) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;
  dl.replaceChildren();
  for (let i = 0; i < FORM_OPTIONS.length; i += 1) {
    const o = FORM_OPTIONS[i];
    const opt = document.createElement('option');
    opt.value = String(o.id);
    opt.textContent = `${o.id} — ${o.label}`;
    dl.appendChild(opt);
  }
  for (let i = 0; i < BRANCH_OPTIONS.length; i += 1) {
    const opt = document.createElement('option');
    opt.value = BRANCH_OPTIONS[i];
    dl.appendChild(opt);
  }
}

function syncInputsToUrl() {
  const { rawA, rawB } = parseFormPairFromUrl();
  const inA = document.getElementById('mkto-diff-form-a');
  const inB = document.getElementById('mkto-diff-form-b');
  const structuralCheckbox = document.getElementById('mkto-diff-ignore-structural');
  const whitespaceCheckbox = document.getElementById('mkto-diff-ignore-whitespace');
  const sp = new URLSearchParams(window.location.search);
  if (inA) inA.value = rawA;
  if (inB) inB.value = rawB;
  ignoreStructural = sp.get('ignoreStructural') !== '0';
  ignoreWhitespace = sp.get('ignoreWhitespace') === '1';
  if (structuralCheckbox) structuralCheckbox.checked = ignoreStructural;
  if (whitespaceCheckbox) whitespaceCheckbox.checked = ignoreWhitespace;
}

function setStatus(el, message, isError) {
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
  el.classList.toggle('mkto-diff-error', !!isError);
}

async function loadFormExtracted(formIdStr) {
  const formId = parseInt(formIdStr, 10);
  const { host, munchkinId, pageUrl } = MKTO_DEFAULTS;
  const baseUrl = buildGetFormBaseUrl(host, munchkinId, formIdStr, pageUrl);
  const raw = await loadJsonp(baseUrl);
  if (raw && raw.error) {
    const err = typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error);
    return { formId: formIdStr, raw, error: err, extracted: { html: '', scripts: [] } };
  }
  const extracted = extractFromFormData(raw, { formId });
  return { formId: formIdStr, raw, extracted, error: null };
}

async function loadCodebaseExtracted(branch) {
  const paths = listKnownScriptPaths(KNOWN_SCRIPT_LOCALES);
  const scripts = [];
  const results = await Promise.all(paths.map(async (p) => {
    const url = buildCodebaseFileUrl(branch, p);
    try {
      const { ok, content } = await fetchTextFile(url);
      return ok ? { filename: p, content } : null;
    } catch {
      return null;
    }
  }));
  for (let i = 0; i < results.length; i += 1) {
    if (results[i]) scripts.push(results[i]);
  }
  return { branch, extracted: { html: '', scripts }, error: null };
}

function aggregateChangedLineStats(results) {
  let added = 0;
  let removed = 0;
  for (let i = 0; i < results.length; i += 1) {
    const r = results[i];
    if (r.status === 'changed' && r.lineStats) {
      added += r.lineStats.added;
      removed += r.lineStats.removed;
    }
  }
  return { added, removed };
}

function compareMaps(mapA, mapB, labelA, labelB) {
  const keys = new Set([...mapA.keys(), ...mapB.keys()]);
  const sorted = [...keys].sort();
  const results = [];
  let identical = 0;
  let changed = 0;
  let onlyA = 0;
  let onlyB = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    const filename = sorted[i];
    const a = mapA.get(filename);
    const b = mapB.get(filename);
    if (a && !b) {
      onlyA += 1;
      const ca = normalizeForCompare(a);
      results.push({
        filename,
        status: 'onlyA',
        scriptA: a,
        scriptB: null,
        normA: ca,
        lineStats: { lines: lineCount(ca) },
      });
    } else if (!a && b) {
      onlyB += 1;
      const cb = normalizeForCompare(b);
      results.push({
        filename,
        status: 'onlyB',
        scriptA: null,
        scriptB: b,
        normB: cb,
        lineStats: { lines: lineCount(cb) },
      });
    } else if (a && b) {
      const ca = normalizeForCompare(a);
      const cb = normalizeForCompare(b);
      if (ca === cb) {
        identical += 1;
        results.push({
          filename,
          status: 'identical',
          scriptA: a,
          scriptB: b,
          normA: ca,
          lineStats: { lines: lineCount(ca) },
        });
      } else {
        const opts = { lineKey: getLineKey() };
        const da = stripBlankLinesIfIgnoringWhitespace(ca);
        const db = stripBlankLinesIfIgnoringWhitespace(cb);
        const { diffText, stats } = unifiedDiffWithStats(da, db, labelA, labelB, opts);
        if (stats.added === 0 && stats.removed === 0) {
          identical += 1;
          results.push({
            filename,
            status: 'identical',
            scriptA: a,
            scriptB: b,
            normA: ca,
            lineStats: { lines: lineCount(ca) },
          });
        } else {
          changed += 1;
          results.push({
            filename,
            status: 'changed',
            scriptA: a,
            scriptB: b,
            diffText,
            lineStats: {
              added: stats.added,
              removed: stats.removed,
              unchanged: stats.unchanged,
            },
          });
        }
      }
    }
  }

  return {
    results,
    counts: { identical, changed, onlyA, onlyB, total: sorted.length },
    aggregate: aggregateChangedLineStats(results),
  };
}

function getFormLabel(id) {
  const opt = FORM_OPTIONS.find((o) => o.id === id);
  return opt ? opt.label : null;
}

function formDisplayName(id) {
  const label = getFormLabel(id);
  return label ? `${id} — ${label}` : String(id);
}

function renderSummary(host, counts, aggregate, nameA, nameB) {
  if (!host) return;
  host.replaceChildren();

  const comparing = document.createElement('p');
  comparing.className = 'mkto-diff-summary-comparing';
  const strongA = document.createElement('strong');
  strongA.textContent = `A: ${nameA}`;
  const strongB = document.createElement('strong');
  strongB.textContent = `B: ${nameB}`;
  comparing.append(strongA, ' vs ', strongB);
  host.appendChild(comparing);

  const parts = [];
  if (counts.changed) parts.push(`${counts.changed} changed`);
  if (counts.identical) parts.push(`${counts.identical} identical`);
  if (counts.onlyA) parts.push(`${counts.onlyA} only in A`);
  if (counts.onlyB) parts.push(`${counts.onlyB} only in B`);
  parts.push(`${counts.total} total`);
  if (aggregate && (aggregate.added > 0 || aggregate.removed > 0)) {
    parts.push(`+${aggregate.added} \u2212${aggregate.removed} lines`);
  }

  const countsP = document.createElement('p');
  countsP.className = 'mkto-diff-summary-counts';
  countsP.textContent = parts.join(' \u00b7 ');
  host.appendChild(countsP);
}

function formatChunkStats(r) {
  if (!r.lineStats) return '';
  if (r.status === 'changed') {
    const s = r.lineStats;
    return `+${s.added} \u2212${s.removed} · ${s.unchanged} unchanged`;
  }
  if (r.status === 'identical' || r.status === 'onlyA' || r.status === 'onlyB') {
    const n = r.lineStats.lines;
    return `${n} line${n === 1 ? '' : 's'}`;
  }
  return '';
}

function badgeTextForStatus(status, nameA, nameB) {
  switch (status) {
    case 'identical': return '(identical)';
    case 'onlyA': return `(only in A — ${nameA})`;
    case 'onlyB': return `(only in B — ${nameB})`;
    default: return '(changed)';
  }
}

function renderDetails(host, comparison, nameA, nameB) {
  if (!host) return;
  host.replaceChildren();

  for (let i = 0; i < comparison.results.length; i += 1) {
    const r = comparison.results[i];
    const badge = document.createElement('span');
    badge.className = 'mkto-diff-badge';
    badge.textContent = badgeTextForStatus(r.status, nameA, nameB);

    const statsText = formatChunkStats(r);
    let statsEl = null;
    if (statsText) {
      statsEl = document.createElement('span');
      statsEl.className = 'mkto-diff-stats';
      statsEl.textContent = statsText;
    }

    const title = document.createElement('span');
    title.className = 'mkto-diff-chunk-title';
    title.textContent = r.filename;

    let bodyEl = null;
    if (r.status === 'identical') {
      bodyEl = renderLinesWithNumbers(r.normA);
    } else if (r.status === 'changed' && r.diffText) {
      bodyEl = renderLinesWithNumbers(r.diffText, { unified: true });
    } else if (r.status === 'onlyA' && r.scriptA) {
      bodyEl = renderLinesWithNumbers(r.normA);
    } else if (r.status === 'onlyB' && r.scriptB) {
      bodyEl = renderLinesWithNumbers(r.normB);
    }

    if (r.status === 'identical') {
      const det = document.createElement('details');
      det.className = 'mkto-diff-chunk mkto-diff-chunk-collapsed';
      const sum = document.createElement('summary');
      sum.className = 'mkto-diff-summary';
      sum.append(title, document.createTextNode(' '), badge);
      if (statsEl) {
        sum.append(document.createTextNode(' · '), statsEl);
      }
      det.appendChild(sum);
      if (bodyEl) {
        const inner = document.createElement('div');
        inner.className = 'mkto-diff-chunk-body';
        inner.appendChild(bodyEl);
        det.appendChild(inner);
      }
      host.appendChild(det);
    } else {
      const section = document.createElement('section');
      section.className = 'mkto-diff-chunk mkto-diff-chunk-open';
      const h = document.createElement('h3');
      h.append(title, document.createTextNode(' '), badge);
      if (statsEl) {
        h.append(document.createTextNode(' · '), statsEl);
      }
      section.appendChild(h);
      if (bodyEl) {
        const inner = document.createElement('div');
        inner.className = 'mkto-diff-chunk-body';
        if (r.status === 'changed') {
          const nav = attachUnifiedDiffNavigator(bodyEl);
          if (nav) inner.appendChild(nav);
        }
        inner.appendChild(bodyEl);
        section.appendChild(inner);
      }
      host.appendChild(section);
    }
  }

  if (comparison.results.length === 0) {
    const p = document.createElement('p');
    p.className = 'mkto-diff-hint';
    p.textContent = 'No scripts extracted from either form.';
    host.appendChild(p);
  }
}

function emptyDiffState(formA, b) {
  return {
    formA,
    b,
    error: null,
    rawA: null,
    rawB: null,
    extractedA: null,
    extractedB: null,
    byFilename: [],
    aggregateLineDiff: null,
  };
}

async function loadCompare() {
  const statusEl = document.getElementById('mkto-diff-status');
  const summarySection = document.getElementById('mkto-diff-summary-section');
  const summaryUl = document.getElementById('mkto-diff-summary');
  const details = document.getElementById('mkto-diff-details');

  const a = classifyInput(getRawInputValue('mkto-diff-form-a'));
  const b = classifyInput(getRawInputValue('mkto-diff-form-b'));

  if (a.kind === 'none' || b.kind === 'none') {
    setStatus(statusEl, 'Enter a form ID or branch name for A, and a form ID or branch name for B.', false);
    if (details) details.textContent = '';
    if (summarySection) summarySection.hidden = true;
    window.mktoScriptsDiff = emptyDiffState(a.value, b.value);
    return;
  }

  const nameA = a.kind === 'form' ? formDisplayName(parseInt(a.value, 10)) : `codebase:${a.value}`;
  const nameB = b.kind === 'form' ? formDisplayName(parseInt(b.value, 10)) : `codebase:${b.value}`;

  setStatus(statusEl, 'Loading…', false);
  if (details) details.textContent = '';
  if (summarySection) summarySection.hidden = true;

  window.mktoScriptsDiff = emptyDiffState(a.value, b.value);

  try {
    const [outA, outB] = await Promise.all([
      a.kind === 'form' ? loadFormExtracted(a.value) : loadCodebaseExtracted(a.value),
      b.kind === 'form' ? loadFormExtracted(b.value) : loadCodebaseExtracted(b.value),
    ]);

    window.mktoScriptsDiff.rawA = outA.raw || null;
    window.mktoScriptsDiff.rawB = outB.raw || null;

    if (outA.error || outB.error) {
      const parts = [];
      if (outA.error) parts.push(`${a.kind === 'form' ? 'Form A' : 'Codebase'}: ${outA.error}`);
      if (outB.error) parts.push(`${b.kind === 'form' ? 'Form B' : 'Codebase'}: ${outB.error}`);
      setStatus(statusEl, parts.join(' · '), true);
      window.mktoScriptsDiff.error = parts.join(' · ');
      window.mktoScriptsDiff.extractedA = outA.extracted;
      window.mktoScriptsDiff.extractedB = outB.extracted;
      return;
    }

    const mapA = scriptsToMap(outA.extracted.scripts);
    const mapB = scriptsToMap(outB.extracted.scripts);
    const labelA = a.kind === 'form' ? `form-${a.value}` : `codebase-${a.value}`;
    const labelB = b.kind === 'form' ? `form-${b.value}` : `codebase-${b.value}`;
    const comparison = compareMaps(mapA, mapB, labelA, labelB);

    window.mktoScriptsDiff.extractedA = outA.extracted;
    window.mktoScriptsDiff.extractedB = outB.extracted;
    window.mktoScriptsDiff.byFilename = comparison.results;
    window.mktoScriptsDiff.aggregateLineDiff = comparison.aggregate;

    setStatus(statusEl, 'Done. Data is on window.mktoScriptsDiff', false);
    if (summarySection) summarySection.hidden = false;
    renderSummary(summaryUl, comparison.counts, comparison.aggregate, nameA, nameB);
    renderDetails(details, comparison, nameA, nameB);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    setStatus(statusEl, msg, true);
    window.mktoScriptsDiff.error = msg;
  }
}

function onInputChange() {
  const inA = document.getElementById('mkto-diff-form-a');
  if (!inA) return;
  const u = new URL(window.location.href);
  const rawA = getRawInputValue('mkto-diff-form-a');
  const rawB = getRawInputValue('mkto-diff-form-b');
  const structuralCheckbox = document.getElementById('mkto-diff-ignore-structural');
  const whitespaceCheckbox = document.getElementById('mkto-diff-ignore-whitespace');
  if (rawA) u.searchParams.set('formA', rawA);
  else u.searchParams.delete('formA');
  if (rawB) u.searchParams.set('b', rawB);
  else u.searchParams.delete('b');
  ignoreStructural = !structuralCheckbox || structuralCheckbox.checked;
  ignoreWhitespace = !!whitespaceCheckbox && whitespaceCheckbox.checked;
  if (ignoreStructural) u.searchParams.delete('ignoreStructural');
  else u.searchParams.set('ignoreStructural', '0');
  if (ignoreWhitespace) u.searchParams.set('ignoreWhitespace', '1');
  else u.searchParams.delete('ignoreWhitespace');
  window.history.replaceState(null, '', u.toString());
  loadCompare();
}

function flipForms() {
  const inA = document.getElementById('mkto-diff-form-a');
  const inB = document.getElementById('mkto-diff-form-b');
  if (!inA || !inB) return;
  const tmp = inA.value;
  inA.value = inB.value;
  inB.value = tmp;
  onInputChange();
}

function init() {
  populateComboDatalist('mkto-diff-list-a');
  populateComboDatalist('mkto-diff-list-b');
  syncInputsToUrl();
  const inA = document.getElementById('mkto-diff-form-a');
  const inB = document.getElementById('mkto-diff-form-b');
  const flipBtn = document.getElementById('mkto-diff-flip');
  const structuralCheckbox = document.getElementById('mkto-diff-ignore-structural');
  const whitespaceCheckbox = document.getElementById('mkto-diff-ignore-whitespace');
  if (inA) inA.addEventListener('change', onInputChange);
  if (inB) inB.addEventListener('change', onInputChange);
  if (flipBtn) flipBtn.addEventListener('click', flipForms);
  if (structuralCheckbox) structuralCheckbox.addEventListener('change', onInputChange);
  if (whitespaceCheckbox) whitespaceCheckbox.addEventListener('change', onInputChange);
  loadCompare();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
