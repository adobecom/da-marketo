/**
 * Marketo form scripts inspector UI.
 * Exposes window.mktoScriptsExtract after a successful load.
 * Query: ?form=<id> (optional; default 2277).
 */

import {
  buildGetFormBaseUrl,
  extractFromFormData,
  loadJsonp,
} from './mkto-form-fetch.js';

const MKTO_DEFAULTS = {
  host: 'engage.adobe.com',
  munchkinId: '360-KCI-804',
  pageUrl: 'https://milo.adobe.com/tools/marketo',
};

const DEFAULT_FORM_ID = 2277;

const FORM_OPTIONS = [
  { id: 1723, label: 'MCZ Staging — Stage testing', subFolders: true },
  { id: 2259, label: 'MCZ Short Form — Staging', subFolders: false },
  { id: 2277, label: 'MCZ Production — PRODUCTION', subFolders: false },
  { id: 2945, label: 'DA Sandbox — Development', subFolders: false },
  { id: 3131, label: 'Data Layer Testing', subFolders: false },
  { id: 3410, label: 'Stage Clone', subFolders: false },
  { id: 3577, label: 'Magma Stage', subFolders: false },
  { id: 3770, label: 'Magma Sandbox', subFolders: false },
  { id: 3844, label: 'Progressive Profiling', subFolders: true },
];

function getFormId() {
  const sel = document.getElementById('mkto-form-select');
  const fromSelect = sel && sel.value ? sel.value : '';
  const fromUrl = new URLSearchParams(window.location.search).get('form') || '';
  return fromSelect || fromUrl || String(DEFAULT_FORM_ID);
}

function subFoldersForFormId(formIdStr) {
  const id = parseInt(formIdStr, 10);
  const opt = FORM_OPTIONS.find((o) => o.id === id);
  return opt ? opt.subFolders : false;
}

function populateFormSelect() {
  const sel = document.getElementById('mkto-form-select');
  if (!sel) return;
  sel.replaceChildren();
  for (let i = 0; i < FORM_OPTIONS.length; i += 1) {
    const o = FORM_OPTIONS[i];
    const opt = document.createElement('option');
    opt.value = String(o.id);
    opt.textContent = `${o.id} — ${o.label}`;
    sel.appendChild(opt);
  }
}

function parseFormFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('form');
  if (raw && /^\d+$/.test(raw)) return parseInt(raw, 10);
  return DEFAULT_FORM_ID;
}

function syncSelectToUrl() {
  const sel = document.getElementById('mkto-form-select');
  if (!sel) return;
  const id = parseFormFromUrl();
  const known = FORM_OPTIONS.some((o) => o.id === id);
  if (!known) {
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = `${id} (from URL)`;
    sel.appendChild(opt);
  }
  sel.value = String(id);
}

function ensureFormInUrl() {
  if (new URLSearchParams(window.location.search).get('form')) return;
  const u = new URL(window.location.href);
  u.searchParams.set('form', String(DEFAULT_FORM_ID));
  window.history.replaceState(null, '', u.toString());
}

function setStatus(el, message, isError) {
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
  el.classList.toggle('mkto-scripts-error', !!isError);
}

function renderExtracted(extracted, raw) {
  const htmlPre = document.getElementById('mkto-out-html');
  const scriptsHost = document.getElementById('mkto-out-scripts');

  if (htmlPre) htmlPre.textContent = extracted.html;

  if (scriptsHost) {
    scriptsHost.textContent = '';
    for (let i = 0; i < extracted.scripts.length; i += 1) {
      const s = extracted.scripts[i];
      const section = document.createElement('section');
      section.className = 'mkto-scripts-chunk';
      const h = document.createElement('h3');
      h.textContent = s.filename + (s.src ? ` (src: ${s.src})` : '');
      const pre = document.createElement('pre');
      pre.textContent = s.src ? `/* external */\n${s.content || ''}`.trim() : s.content;
      section.append(h, pre);
      scriptsHost.append(section);
    }
  }

  window.mktoScriptsExtract = {
    raw,
    html: extracted.html,
    scripts: extracted.scripts,
  };
}

async function loadForm() {
  const statusEl = document.getElementById('mkto-status');
  const formId = getFormId();
  const subFolders = subFoldersForFormId(formId);

  if (!formId) {
    setStatus(statusEl, 'Select a form ID.', true);
    return;
  }

  const { host, munchkinId, pageUrl } = MKTO_DEFAULTS;
  const baseUrl = buildGetFormBaseUrl(host, munchkinId, formId, pageUrl);

  setStatus(statusEl, 'Loading…', false);
  const htmlPre = document.getElementById('mkto-out-html');
  const scriptsHost = document.getElementById('mkto-out-scripts');
  if (htmlPre) htmlPre.textContent = '';
  if (scriptsHost) scriptsHost.textContent = '';

  try {
    const raw = await loadJsonp(baseUrl);
    if (raw && raw.error) {
      setStatus(statusEl, `API error: ${typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error)}`, true);
      window.mktoScriptsExtract = { raw, error: raw.error, html: '', scripts: [] };
      return;
    }
    const extracted = extractFromFormData(raw, { subFolders });
    setStatus(statusEl, 'Loaded. Data is on window.mktoScriptsExtract', false);
    renderExtracted(extracted, raw);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    setStatus(statusEl, msg, true);
    window.mktoScriptsExtract = { error: msg, html: '', scripts: [] };
  }
}

function onFormSelectChange() {
  const sel = document.getElementById('mkto-form-select');
  if (!sel) return;
  const u = new URL(window.location.href);
  u.searchParams.set('form', sel.value);
  window.history.replaceState(null, '', u.toString());
  loadForm();
}

function init() {
  populateFormSelect();
  ensureFormInUrl();
  syncSelectToUrl();
  const sel = document.getElementById('mkto-form-select');
  if (sel) sel.addEventListener('change', onFormSelectChange);
  loadForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
