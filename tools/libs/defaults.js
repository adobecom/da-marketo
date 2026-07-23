function normalizeHost(host) {
  let h = String(host || '').trim();
  if (!h) return 'https://engage.adobe.com';
  if (!/^https?:\/\//i.test(h)) h = `https://${h}`;
  return h.replace(/\/$/, '');
}

export function buildGetFormBaseUrl(host, munchkinId, formId, pageUrl) {
  const root = normalizeHost(host);
  const qs = new URLSearchParams({
    munchkinId: String(munchkinId),
    form: String(formId),
    url: pageUrl,
    _: String(Date.now()),
  });
  return `${root}/index.php/form/getForm?${qs.toString()}`;
}

export const MKTO_DEFAULTS = {
  host: 'engage.adobe.com',
  munchkinId: '360-KCI-804',
  pageUrl: 'https://milo.adobe.com/tools/marketo',
};

export const DEFAULT_FORM_ID = 2277;

export const KNOWN_SCRIPT_LOCALES = [
  'cs', 'da', 'de', 'en', 'es_es', 'fi', 'fr_fr', 'it', 'ja_jp', 'ko',
  'nl', 'no', 'pl', 'pt', 'ru', 'sv', 'tr', 'zh_cn', 'zh_tw',
];

export const CODEBASE_DEFAULTS = {
  org: 'adobecom',
  repo: 'da-marketo',
  env: 'live',
};

export const BRANCH_OPTIONS = ['main', 'stage'];

function slugifyBranch(branch) {
  return String(branch || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCodebaseFileUrl(branch, filePath, options = {}) {
  const { org, repo, env } = { ...CODEBASE_DEFAULTS, ...options };
  const slug = slugifyBranch(branch);
  const path = String(filePath || '').replace(/^\/+/, '');
  return `https://${slug}--${repo}--${org}.aem.${env}/mkto/${path}`;
}

export const FORM_OPTIONS = [
  { id: 1723, label: 'MCZ Staging — Stage testing' },
  { id: 2259, label: 'MCZ Short Form — Staging' },
  { id: 2277, label: 'MCZ Production — PRODUCTION' },
  { id: 2945, label: 'DA Sandbox — Development' },
  { id: 3131, label: 'Data Layer Testing' },
  { id: 3410, label: 'Stage Clone' },
  { id: 3577, label: 'Magma Stage' },
  { id: 3770, label: 'Magma Sandbox' },
  { id: 3844, label: 'Progressive Profiling' },
  { id: 3888, label: 'Progressive Profiling (new)' },
];
