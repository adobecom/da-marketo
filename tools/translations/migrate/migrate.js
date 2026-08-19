/* eslint-disable no-console, import/no-extraneous-dependencies */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { read, utils } from 'xlsx';
import { FIELDS, LANGUAGES, toSheetFormat } from '../translations-core.js';
import { migrateRow } from './parse-workbook.js';

// NOTE: xlsx (SheetJS) npm build 0.18.5 has known CVEs (prototype pollution / ReDoS);
// used here only as dev-only, run-once, local script over trusted first-party workbooks.
// SheetJS recommends their CDN build for production use.

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const SHEET_NAME = 'Language Select Filter List';

// xlsx filename per field key (from context/MCZ Form - Select Lists - Language Files/)
const WORKBOOK = {
  country: 'UPGRADED - Country.xlsx',
  industry: 'UPGRADED - Industry.xlsx',
  'functional-area': 'UPGRADED - Functional Area.xlsx',
  'job-role': 'UPGRADED - Job Role.xlsx',
  'product-of-interest': 'UPGRADED - Product of Interest.xlsx',
  salutation: 'Salutation.xlsx',
  'company-type': 'UPGRADED - Company Type.xlsx',
};

function parseWorkbook(xlsxPath, field) {
  const wb = read(readFileSync(xlsxPath));
  const ws = wb.Sheets[SHEET_NAME];
  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" not found in ${xlsxPath}`);
  const rawRows = utils.sheet_to_json(ws, { defval: '', raw: false });
  const langCols = [...LANGUAGES, ...(field.regionalCols ?? [])];
  const rows = [];
  const allIssues = [];
  rawRows.forEach((raw) => {
    if (!raw.Value) return; // skip blank rows
    const { row, issues } = migrateRow(raw, langCols);
    rows.push(row);
    allIssues.push(...issues.map((i) => ({ field: field.key, ...i })));
  });
  return { rows, issues: allIssues };
}

function main() {
  const srcDir = process.argv[2];
  if (!srcDir) { console.error('Usage: npm run migrate:translations -- "<path to xlsx folder>"'); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  const report = [];
  FIELDS.forEach((field) => {
    const xlsxPath = join(srcDir, WORKBOOK[field.key]);
    console.log(`Parsing ${field.label}…`);
    const { rows, issues } = parseWorkbook(xlsxPath, field);
    writeFileSync(join(OUT, `${field.key}.json`), JSON.stringify(toSheetFormat(rows), null, 2));
    report.push(...issues);
    console.log(`  ${rows.length} rows, ${issues.length} issues`);
  });
  writeFileSync(join(OUT, 'migration-report.json'), JSON.stringify(report, null, 2));
  console.log(`\nWrote ${FIELDS.length} sheets + migration-report.json to ${OUT}`);
  console.log(`Total issues to review: ${report.length}`);
  // NOTE: DA push is a separate, manual step after report review — see Step 5.
}

main();
