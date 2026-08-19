import { normalizeCell, isBlank } from '../translations-core.js';

export const HEADER_MAP = {
  Label: 'label',
  Value: 'value',
  'Sort Position': 'sortPosition',
  'Filter Sheet': 'filterSheet',
  'Active Check': 'activeCheck',
  DME: 'dme',
  'Active Translation': 'activeTranslation',
};

export function mapHeader(header) {
  if (HEADER_MAP[header]) return HEADER_MAP[header];
  return header.trim().toLowerCase();
}

export function migrateRow(rawRow, langCols) {
  const row = {};
  const issues = [];

  Object.keys(rawRow).forEach((header) => {
    const key = mapHeader(header);
    if (!langCols.includes(key)) row[key] = rawRow[header];
  });

  const { value } = row;
  langCols.forEach((lang) => {
    const cell = rawRow[lang] ?? rawRow[lang.toUpperCase()] ?? '';
    if (isBlank(cell)) {
      row[lang] = '';
      issues.push({ value, lang, cell: String(cell), reason: 'blank' });
      return;
    }
    const { value: label, valid } = normalizeCell(cell, value);
    if (!valid) {
      row[lang] = String(cell);
      issues.push({ value, lang, cell: String(cell), reason: 'value-mismatch' });
    } else {
      row[lang] = label;
    }
  });

  return { row, issues };
}
