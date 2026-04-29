#!/usr/bin/env node
/**
 * Fetches a live Marketo form, maps each inline script to its logical filename,
 * and writes the result to mkto/ in this repo.
 *
 * Usage:
 *   node build/sync-marketo/sync-marketo.js [--form <id>]
 *
 * Run via npm:
 *   npm run build:sync-marketo
 *   npm run build:sync-marketo -- --form 1723
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { parseArgs } from 'util';
import { fileURLToPath } from 'url';
import resolveScriptFilename from './filename-mapping.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = join(REPO_ROOT, 'mkto');

const MKTO_DEFAULTS = {
  host: 'engage.adobe.com',
  munchkinId: '360-KCI-804',
  pageUrl: 'https://milo.adobe.com/tools/marketo',
  formId: 2277,
};

const FORM_OPTIONS = [
  { id: 2277, label: 'MCZ Production' },
  { id: 2259, label: 'MCZ Short Form' },
  { id: 1723, label: 'MCZ Staging' },
  { id: 3844, label: 'Progressive Profiling' },
  { id: 2945, label: 'DA Sandbox' },
  { id: 3131, label: 'Data Layer Testing' },
  { id: 3410, label: 'Stage Clone' },
  { id: 3577, label: 'Magma Stage' },
  { id: 3770, label: 'Magma Sandbox' },
];

function helpText() {
  return `Usage: node build/sync-marketo/sync-marketo.js [options]

Options:
  --form <id>   Form ID to sync (default: ${MKTO_DEFAULTS.formId})
  --help        Show this help

Form IDs:
${FORM_OPTIONS.map((f) => `  ${String(f.id).padEnd(6)} ${f.label}`).join('\n')}

Output: mkto/ (subfolders per script category)
`;
}

function parseCli() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    strict: true,
    allowPositionals: false,
    options: {
      form: { type: 'string' },
      help: { type: 'boolean' },
    },
  });

  if (values.help) {
    console.log(helpText());
    process.exit(0);
  }

  const formId = values.form !== undefined ? parseInt(values.form, 10) : MKTO_DEFAULTS.formId;
  if (Number.isNaN(formId)) {
    console.error('Invalid --form: expected a number.');
    process.exit(1);
  }

  return { formId };
}

async function fetchFormData(host, munchkinId, formId, pageUrl) {
  const cbName = `mktoSync${Date.now()}`;
  const qs = new URLSearchParams({
    munchkinId: String(munchkinId),
    form: String(formId),
    url: pageUrl,
    _: String(Date.now()),
    callback: cbName,
  });
  const url = `https://${host}/index.php/form/getForm?${qs}`;
  console.log(`  → GET ${url.split('?')[0]}...`);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; da-marketo-sync/1.0)',
      Accept: '*/*',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const text = await res.text();
  const jsonMatch = text.match(/^[a-zA-Z_$][a-zA-Z0-9_$.]*\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/);
  if (!jsonMatch) {
    throw new Error(`Unexpected response (not JSONP). First 300 chars:\n${text.slice(0, 300)}`);
  }
  return JSON.parse(jsonMatch[1]);
}

function extractScriptTags(html) {
  const re = /<script[^>]*>([\s\S]*?)<\/script\s*>/gi;
  return Array.from(html.matchAll(re), (m) => m[1] || '');
}

function flattenRows(arr, accum = []) {
  if (!arr) return accum;
  arr.forEach((v) => {
    if (Array.isArray(v)) flattenRows(v, accum);
    else accum.push(v);
  });
  return accum;
}

function getAllHtmltextFields(raw) {
  const fields = flattenRows(raw.rows || []);
  if (raw.fieldsetRows && typeof raw.fieldsetRows === 'object') {
    Object.values(raw.fieldsetRows).forEach((vals) => flattenRows(vals, fields));
  }
  return fields.filter((f) => f && typeof f.Htmltext === 'string' && f.Htmltext.length > 0);
}

function extractScripts(raw, formId) {
  const usedPaths = new Map();
  let pos = 0;
  const scripts = [];

  getAllHtmltextFields(raw).forEach((field) => {
    extractScriptTags(field.Htmltext).forEach((content) => {
      const { filename, sourcePath } = resolveScriptFilename(
        content,
        pos,
        usedPaths,
        formId,
      );
      scripts.push({
        filename,
        content,
        sourcePath,
        pos,
      });
      pos += 1;
    });
  });

  return scripts;
}

function normalizeScript(raw) {
  return `${raw
    .split('\n')
    .filter((line) => !/^\s*\/\/\s*<!\[CDATA\[/.test(line) && !/^\s*\/\/\s*\]\]>/.test(line))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')}\n`;
}

async function main() {
  const { formId } = parseCli();

  const formConfig = FORM_OPTIONS.find((f) => f.id === formId);
  if (!formConfig) {
    console.error(`Unknown form ID ${formId}. Use --help to see known IDs.`);
    process.exit(1);
  }

  const { host, munchkinId, pageUrl } = MKTO_DEFAULTS;
  const { label } = formConfig;

  console.log(`Form ${formId} (${label})  ${host}  ${munchkinId}\n`);

  const raw = await fetchFormData(host, munchkinId, formId, pageUrl);
  if (raw && raw.error) throw new Error(`Marketo API error: ${JSON.stringify(raw.error)}`);
  console.log(`Form: "${raw.Name}" id=${raw.Id} status=${raw.Status}\n`);

  const scripts = extractScripts(raw, formId);
  const identified = scripts.filter((s) => s.sourcePath);
  const unknown = scripts.filter((s) => !s.sourcePath);

  if (scripts.length === 0) throw new Error('No scripts found in form. Check form ID and Marketo access.');

  console.log(`Scripts: ${scripts.length} total, ${identified.length} mapped, ${unknown.length} skipped`);
  identified.forEach((s) => console.log(`  ${s.filename} (${s.content.split('\n').length} lines)`));
  unknown.forEach((s) => console.log(`  (unmapped) ${s.filename} (${s.content.split('\n').length} lines)`));

  let written = 0;
  console.log('');

  identified.forEach((s) => {
    const targetPath = join(OUTPUT_DIR, s.filename);
    const targetDir = dirname(targetPath);

    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    writeFileSync(targetPath, normalizeScript(s.content), 'utf8');
    written += 1;
  });

  console.log(`\nDone. ${written} files → ${OUTPUT_DIR}\n`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
