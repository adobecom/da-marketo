/**
 * Compare Marketo form scripts between two form IDs.
 * Exposes window.mktoScriptsDiff after a successful compare.
 * Query: ?formA=<id>&formB=<id>
 */

import {
  buildGetFormBaseUrl,
  extractFromFormData,
  loadJsonp,
} from '../mkto-scripts/mkto-form-fetch.js';
import {
  FORM_OPTIONS,
  MKTO_DEFAULTS,
  subFoldersForFormId,
} from '../mkto-scripts/mkto-scripts-defaults.js';
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

function normalizeForCompare(s) {
  return normalizeNewlines(scriptDisplayText(s));
}

function lineClassForUnified(line) {
  if (line.startsWith('---') || line.startsWith('+++')) {
    return 'mkto-diff-line-hdr';
  }
  if (line.startsWith('+')) return 'mkto-diff-line-add';
  if (line.startsWith('-')) return 'mkto-diff-line-del';
  return '';
}

function renderPlainWithLineNumbers(text) {
  const lines = String(text).split('\n');
  const wrap = document.createElement('div');
  wrap.className = 'mkto-diff-pre-lined';
  for (let i = 0; i < lines.length; i += 1) {
    const row = document.createElement('div');
    row.className = 'mkto-diff-line-row';
    const num = document.createElement('span');
    num.className = 'mkto-diff-linenum';
    num.textContent = String(i + 1);
    const content = document.createElement('span');
    content.className = 'mkto-diff-line-text';
    content.textContent = lines[i];
    row.append(num, content);
    wrap.appendChild(row);
  }
  return wrap;
}

function renderUnifiedWithLineNumbers(diffText) {
  const lines = String(diffText).split('\n');
  const wrap = document.createElement('div');
  wrap.className = 'mkto-diff-pre-lined mkto-diff-pre-unified';
  for (let i = 0; i < lines.length; i += 1) {
    const row = document.createElement('div');
    row.className = 'mkto-diff-line-row';
    const num = document.createElement('span');
    num.className = 'mkto-diff-linenum';
    num.textContent = String(i + 1);
    const content = document.createElement('span');
    content.className = 'mkto-diff-line-text';
    const line = lines[i];
    const cls = lineClassForUnified(line);
    const esc = escapeHtml(line);
    if (cls) {
      content.innerHTML = `<span class="${cls}">${esc}</span>`;
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

function getFormIdFromSelect(id) {
  const sel = document.getElementById(id);
  const fromSelect = sel && sel.value ? sel.value : '';
  return fromSelect;
}

function parseFormPairFromUrl() {
  const sp = new URLSearchParams(window.location.search);
  const rawA = sp.get('formA');
  const rawB = sp.get('formB');
  let a = null;
  let b = null;
  if (rawA && /^\d+$/.test(rawA)) a = parseInt(rawA, 10);
  if (rawB && /^\d+$/.test(rawB)) b = parseInt(rawB, 10);
  return { formA: a, formB: b };
}

function populateFormSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.replaceChildren();
  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = 'Select a form';
  sel.appendChild(emptyOpt);
  for (let i = 0; i < FORM_OPTIONS.length; i += 1) {
    const o = FORM_OPTIONS[i];
    const opt = document.createElement('option');
    opt.value = String(o.id);
    opt.textContent = `${o.id} — ${o.label}`;
    sel.appendChild(opt);
  }
}

function syncSelectsToUrl() {
  const { formA, formB } = parseFormPairFromUrl();
  const selA = document.getElementById('mkto-diff-form-a');
  const selB = document.getElementById('mkto-diff-form-b');
  const ensureOption = (sel, id) => {
    if (!sel || id == null) return;
    const known = FORM_OPTIONS.some((o) => o.id === id);
    if (!known) {
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = `${id} (from URL)`;
      sel.appendChild(opt);
    }
    sel.value = String(id);
  };
  if (selA) {
    if (formA == null) selA.value = '';
    else ensureOption(selA, formA);
  }
  if (selB) {
    if (formB == null) selB.value = '';
    else ensureOption(selB, formB);
  }
}

function setStatus(el, message, isError) {
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
  el.classList.toggle('mkto-diff-error', !!isError);
}

async function loadFormExtracted(formIdStr) {
  const subFolders = subFoldersForFormId(formIdStr);
  const { host, munchkinId, pageUrl } = MKTO_DEFAULTS;
  const baseUrl = buildGetFormBaseUrl(host, munchkinId, formIdStr, pageUrl);
  const raw = await loadJsonp(baseUrl);
  if (raw && raw.error) {
    const err = typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error);
    return { formId: formIdStr, raw, error: err, extracted: { html: '', scripts: [] } };
  }
  const extracted = extractFromFormData(raw, { subFolders });
  return { formId: formIdStr, raw, extracted, error: null };
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
          lineStats: { lines: lineCount(ca) },
        });
      } else {
        changed += 1;
        const { diffText, stats } = unifiedDiffWithStats(ca, cb, labelA, labelB);
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

  return {
    results,
    counts: { identical, changed, onlyA, onlyB, total: sorted.length },
    aggregate: aggregateChangedLineStats(results),
  };
}

function renderSummary(ul, counts, aggregate) {
  if (!ul) return;
  ul.replaceChildren();
  const items = [
    `Identical: ${counts.identical}`,
    `Changed: ${counts.changed}`,
    `Only form A: ${counts.onlyA}`,
    `Only form B: ${counts.onlyB}`,
    `Total logical files: ${counts.total}`,
  ];
  for (let i = 0; i < items.length; i += 1) {
    const li = document.createElement('li');
    li.textContent = items[i];
    ul.appendChild(li);
  }
  if (aggregate && (aggregate.added > 0 || aggregate.removed > 0)) {
    const li = document.createElement('li');
    li.textContent = `Across changed scripts (line diff): +${aggregate.added} \u2212${aggregate.removed}`;
    ul.appendChild(li);
  }
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

function renderDetails(host, comparison, formIdA, formIdB) {
  if (!host) return;
  host.replaceChildren();

  for (let i = 0; i < comparison.results.length; i += 1) {
    const r = comparison.results[i];
    const badge = document.createElement('span');
    badge.className = 'mkto-diff-badge';
    let badgeText = '(changed)';
    if (r.status === 'identical') badgeText = '(identical)';
    else if (r.status === 'onlyA') badgeText = `(only form A — ${formIdA})`;
    else if (r.status === 'onlyB') badgeText = `(only form B — ${formIdB})`;
    badge.textContent = badgeText;

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
      bodyEl = renderPlainWithLineNumbers(normalizeForCompare(r.scriptA));
    } else if (r.status === 'changed' && r.diffText) {
      bodyEl = renderUnifiedWithLineNumbers(r.diffText);
    } else if (r.status === 'onlyA' && r.scriptA) {
      bodyEl = renderPlainWithLineNumbers(normalizeForCompare(r.scriptA));
    } else if (r.status === 'onlyB' && r.scriptB) {
      bodyEl = renderPlainWithLineNumbers(normalizeForCompare(r.scriptB));
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

async function loadCompare() {
  const statusEl = document.getElementById('mkto-diff-status');
  const summarySection = document.getElementById('mkto-diff-summary-section');
  const summaryUl = document.getElementById('mkto-diff-summary');
  const details = document.getElementById('mkto-diff-details');

  const idAStr = getFormIdFromSelect('mkto-diff-form-a');
  const idBStr = getFormIdFromSelect('mkto-diff-form-b');

  if (!idAStr || !idBStr) {
    setStatus(statusEl, 'Select a form ID for both Form A and Form B.', false);
    if (details) details.textContent = '';
    if (summarySection) summarySection.hidden = true;
    window.mktoScriptsDiff = {
      formA: idAStr || '',
      formB: idBStr || '',
      error: null,
      rawA: null,
      rawB: null,
      extractedA: null,
      extractedB: null,
      byFilename: [],
      aggregateLineDiff: null,
    };
    return;
  }

  const formIdA = parseInt(idAStr, 10);
  const formIdB = parseInt(idBStr, 10);

  setStatus(statusEl, 'Loading…', false);
  if (details) details.textContent = '';
  if (summarySection) summarySection.hidden = true;

  window.mktoScriptsDiff = {
    formA: idAStr,
    formB: idBStr,
    error: null,
    rawA: null,
    rawB: null,
    extractedA: null,
    extractedB: null,
    byFilename: [],
    aggregateLineDiff: null,
  };

  try {
    const [outA, outB] = await Promise.all([
      loadFormExtracted(idAStr),
      loadFormExtracted(idBStr),
    ]);

    window.mktoScriptsDiff.rawA = outA.raw;
    window.mktoScriptsDiff.rawB = outB.raw;

    if (outA.error || outB.error) {
      const parts = [];
      if (outA.error) parts.push(`Form A: ${outA.error}`);
      if (outB.error) parts.push(`Form B: ${outB.error}`);
      setStatus(statusEl, parts.join(' · '), true);
      window.mktoScriptsDiff.error = parts.join(' · ');
      window.mktoScriptsDiff.extractedA = outA.extracted;
      window.mktoScriptsDiff.extractedB = outB.extracted;
      return;
    }

    const mapA = scriptsToMap(outA.extracted.scripts);
    const mapB = scriptsToMap(outB.extracted.scripts);
    const labelA = `form-${formIdA}`;
    const labelB = `form-${formIdB}`;
    const comparison = compareMaps(mapA, mapB, labelA, labelB);

    window.mktoScriptsDiff.extractedA = outA.extracted;
    window.mktoScriptsDiff.extractedB = outB.extracted;
    window.mktoScriptsDiff.byFilename = comparison.results;
    window.mktoScriptsDiff.aggregateLineDiff = comparison.aggregate;

    setStatus(statusEl, 'Done. Data is on window.mktoScriptsDiff', false);
    if (summarySection) summarySection.hidden = false;
    renderSummary(summaryUl, comparison.counts, comparison.aggregate);
    renderDetails(details, comparison, formIdA, formIdB);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    setStatus(statusEl, msg, true);
    window.mktoScriptsDiff.error = msg;
  }
}

function onSelectChange() {
  const selA = document.getElementById('mkto-diff-form-a');
  const selB = document.getElementById('mkto-diff-form-b');
  if (!selA || !selB) return;
  const u = new URL(window.location.href);
  if (selA.value) u.searchParams.set('formA', selA.value);
  else u.searchParams.delete('formA');
  if (selB.value) u.searchParams.set('formB', selB.value);
  else u.searchParams.delete('formB');
  window.history.replaceState(null, '', u.toString());
  loadCompare();
}

function init() {
  populateFormSelect('mkto-diff-form-a');
  populateFormSelect('mkto-diff-form-b');
  syncSelectsToUrl();
  const selA = document.getElementById('mkto-diff-form-a');
  const selB = document.getElementById('mkto-diff-form-b');
  if (selA) selA.addEventListener('change', onSelectChange);
  if (selB) selB.addEventListener('change', onSelectChange);
  loadCompare();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
