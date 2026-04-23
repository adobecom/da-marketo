#!/usr/bin/env node
/**
 * sync-marketo.js
 *
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
import { fileURLToPath } from 'url';
import resolveScriptFilename from './filename-mapping.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(scriptDir, '../..');
const OUTPUT_DIR = join(REPO_ROOT, 'mkto');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MKTO_DEFAULTS = {
  host: 'engage.adobe.com',
  munchkinId: '360-KCI-804',
  pageUrl: 'https://milo.adobe.com/tools/marketo',
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

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { formId: 2277, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--form' && args[i + 1]) {
      i += 1;
      opts.formId = parseInt(args[i], 10);
    } else if (args[i] === '--help') {
      console.log(`
Usage: node build/sync-marketo/sync-marketo.js [options]

Options:
  --form <id>   Form ID to sync (default: 2277)
  --help        Show this help

Known form IDs:
${FORM_OPTIONS.map((f) => `  ${String(f.id).padEnd(6)} ${f.label}`).join('\n')}

Output: mkto/ (subfolders per script category)
`);
      process.exit(0);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Marketo API fetch
// ---------------------------------------------------------------------------

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
  console.log(`  → GET ${url.split('?')[0]}?form=${formId}&...`);

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

// ---------------------------------------------------------------------------
// Script extraction
// ---------------------------------------------------------------------------

function extractScriptTags(html) {
  const re = /<script([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  return Array.from(html.matchAll(re)).map((m) => {
    const srcMatch = (m[1] || '').match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    return { src: srcMatch ? srcMatch[1] : null, content: m[2] || '' };
  });
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
    extractScriptTags(field.Htmltext).forEach((tag) => {
      const { filename, sourcePath } = resolveScriptFilename(
        tag.content,
        tag.src,
        pos,
        usedPaths,
        true, /* subFolders */
        formId,
      );
      scripts.push({
        filename,
        content: tag.content,
        src: tag.src || undefined,
        sourcePath,
        pos,
      });
      pos += 1;
    });
  });

  return scripts;
}

// ---------------------------------------------------------------------------
// Content normalization
// ---------------------------------------------------------------------------

function normalizeScript(raw) {
  return `${raw
    .split('\n')
    .filter((line) => !/^\s*\/\/\s*<!\[CDATA\[/.test(line) && !/^\s*\/\/\s*\]\]>/.test(line))
    .join('\n')
    .replace(/^\n+|\n+$/g, '')}\n`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();

  const formConfig = FORM_OPTIONS.find((f) => f.id === opts.formId);
  if (!formConfig) {
    console.error(`Unknown form ID ${opts.formId}. Use --help to see known IDs.`);
    process.exit(1);
  }

  const { host, munchkinId, pageUrl } = MKTO_DEFAULTS;
  const { label } = formConfig;

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log(`  Syncing form ${opts.formId} (${label})`);
  console.log(`  Host: ${host}  |  Munchkin ID: ${munchkinId}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  if (opts.dryRun) console.log('  Mode: DRY RUN — no files will be written');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // 1. Fetch
  console.log('1/3  Fetching form data from Marketo...');
  const raw = await fetchFormData(host, munchkinId, opts.formId, pageUrl);
  if (raw && raw.error) throw new Error(`Marketo API error: ${JSON.stringify(raw.error)}`);
  console.log(`     Form: "${raw.Name}" (ID: ${raw.Id}, Status: ${raw.Status})`);

  // 2. Extract and map
  console.log('\n2/3  Extracting and mapping scripts...');
  const scripts = extractScripts(raw, opts.formId);
  const identified = scripts.filter((s) => s.sourcePath);
  const unknown = scripts.filter((s) => !s.sourcePath);

  if (scripts.length === 0) throw new Error('No scripts found in form. Check form ID and Marketo access.');

  console.log(`     Total:        ${scripts.length} scripts`);
  console.log(`     Identified:   ${identified.length}`);
  identified.forEach((s) => console.log(`       ✓  ${s.filename}`));
  if (unknown.length > 0) {
    console.log(`     Unidentified: ${unknown.length} (skipped)`);
    unknown.forEach((s) => console.log(`       ✗  ${s.filename}`));
  }

  if (opts.dryRun) {
    console.log('\n[DRY RUN] No files written.');
    return;
  }

  // 3. Write
  console.log('\n3/3  Writing to mkto/...');
  let written = 0;

  identified.forEach((s) => {
    const targetPath = join(OUTPUT_DIR, s.filename);
    const targetDir = dirname(targetPath);

    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    writeFileSync(targetPath, normalizeScript(s.content), 'utf8');
    console.log(`     wrote  ${s.filename}`);
    written += 1;
  });

  console.log(`\n✓ Done — ${written} files written, ${unknown.length} skipped.`);
  console.log(`  Output: ${OUTPUT_DIR}\n`);
}

main().catch((e) => {
  console.error('\n✗ Error:', e.message);
  process.exit(1);
});
