export const LANGUAGES = [
  'en_us', 'es_es', 'de', 'fr_fr', 'zh_cn', 'ja_jp', 'ko', 'zh_tw', 'da', 'sv',
  'it', 'en_gb', 'nl', 'no', 'pt', 'fi', 'ru', 'tr', 'pl', 'cs',
];

export const HELPER_COLS = [
  'sortPosition', 'filterSheet', 'activeCheck', 'activeTranslation', 'dme',
];

export const FIELDS = [
  { key: 'country', label: 'Country', path: '/tools/translations/country.json' },
  { key: 'industry', label: 'Industry', path: '/tools/translations/industry.json' },
  { key: 'functional-area', label: 'Functional Area', path: '/tools/translations/functional-area.json' },
  { key: 'job-role', label: 'Job Role', path: '/tools/translations/job-role.json', regionalCols: ['anz', 'in', 'sea'] },
  { key: 'product-of-interest', label: 'Product of Interest', path: '/tools/translations/product-of-interest.json' },
  { key: 'salutation', label: 'Salutation', path: '/tools/translations/salutation.json' },
  { key: 'company-type', label: 'Company Type', path: '/tools/translations/company-type.json' },
];

const LANG_RE = /^[a-z]{2}(_[a-z]{2})?$/;

export function validateLangCode(input, existing = []) {
  const code = (input ?? '').trim().toLowerCase();
  if (!LANG_RE.test(code)) return { ok: false, code, error: 'Invalid format — use e.g. "ar" or "pt_br".' };
  if (existing.includes(code)) return { ok: false, code, error: `Language "${code}" already exists.` };
  return { ok: true, code };
}

export function normalizeCell(input, value) {
  const trimmed = (input ?? '').trim();
  if (!trimmed.includes('|')) return { value: trimmed, valid: true };
  const idx = trimmed.lastIndexOf('|');
  const label = trimmed.slice(0, idx).trim();
  const suffix = trimmed.slice(idx + 1).trim();
  if (suffix === value && !label.includes('|')) return { value: label, valid: true };
  return { value: trimmed, valid: false };
}

export function isBlank(cell) {
  return !cell || !String(cell).trim();
}

export function hasStrayPipe(cell) {
  return String(cell ?? '').includes('|');
}

export function countTranslated(rows, lang) {
  const done = rows.filter((r) => !isBlank(r[lang]) && !hasStrayPipe(r[lang])).length;
  return { done, total: rows.length };
}

export function addLanguageColumn(rows, code) {
  return rows.map((r) => (code in r ? { ...r } : { ...r, [code]: '' }));
}

export function checkExportReady(rows, lang) {
  let blanks = 0;
  let invalids = 0;
  rows.forEach((r) => {
    if (isBlank(r[lang])) blanks += 1;
    else if (hasStrayPipe(r[lang])) invalids += 1;
  });
  return { ready: blanks === 0 && invalids === 0, blanks, invalids };
}

export function composeExportColumn(rows, lang) {
  return [...rows]
    .sort((a, b) => Number(a.sortPosition) - Number(b.sortPosition))
    .map((r) => `${String(r[lang] ?? '').trim()}|${r.value}`)
    .join('\n');
}

export function normalizeSheet(json) {
  if (json && json[':type'] === 'sheet') return json.data ?? [];
  return [];
}

export function toSheetFormat(rows) {
  return {
    total: rows.length,
    limit: rows.length,
    offset: 0,
    data: rows,
    ':type': 'sheet',
    ':sheetname': 'data',
  };
}
