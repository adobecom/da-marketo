#!/usr/bin/env node
/**
 * build-forms2.js
 *
 * Downloads forms2.js from Marketo's CDN, applies forms2.patch, then uses
 * microbundle to produce deps/forms2.min.js.
 *
 * Usage:
 *   npm run build:forms2
 */

import { execSync } from 'child_process';
import { writeFileSync, renameSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(scriptDir, '../..');
const FORMS2_SRC = resolve(REPO_ROOT, 'deps/forms2.js');
const FORMS2_MIN = resolve(REPO_ROOT, 'deps/forms2.min.js');
const FORMS2_URL = 'https://engage.adobe.com/js/forms2/js/forms2.js';
const PATCH_FILE = resolve(scriptDir, 'forms2.patch');
const BUILD_TMP = resolve(REPO_ROOT, 'build/forms2/tmp');

// ---------------------------------------------------------------------------
// Patch
// Matches the context robustly so minor upstream whitespace changes don't
// break the apply. Throws if the anchor isn't found so failures are loud.
// ---------------------------------------------------------------------------

const PATCH_ANCHOR = '}else if (field.Datatype == "htmltext" || field.Datatype == "richtext"){';
const PATCH_GUARD = 'if ((field.Htmltext || field.InputLabel).includes("<script>")) return;';
const PATCH_INSERT = `      // REMOVE SCRIPT TAGS\n      ${PATCH_GUARD}`;

function applyPatch(source) {
  if (source.includes(PATCH_GUARD)) {
    console.log('  Patch already applied — skipping.');
    return source;
  }
  const idx = source.indexOf(PATCH_ANCHOR);
  if (idx === -1) {
    throw new Error(
      'Patch anchor not found in forms2.js — the upstream file may have changed.\n'
      + `Anchor: ${PATCH_ANCHOR}`,
    );
  }
  const insertAt = idx + PATCH_ANCHOR.length;
  return `${source.slice(0, insertAt)}\n${PATCH_INSERT}${source.slice(insertAt)}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('  Building deps/forms2.min.js');
  console.log('╚═══════════════════════════════════════╝\n');

  // 1. Download
  console.log('1/4  Downloading forms2.js from Marketo CDN...');
  console.log(`     ${FORMS2_URL}`);
  const res = await fetch(FORMS2_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const source = await res.text();
  console.log(`     ${(source.length / 1024).toFixed(1)} KB received`);

  // 2. Write to deps/forms2.js
  console.log('\n2/4  Writing deps/forms2.js...');
  writeFileSync(FORMS2_SRC, source, 'utf8');

  // 3. Apply patch
  console.log('\n3/4  Applying forms2.patch...');
  console.log(`     Patch file: ${PATCH_FILE}`);
  const patched = applyPatch(source);
  writeFileSync(FORMS2_SRC, patched, 'utf8');
  console.log('     Patch applied.');

  // 4. Bundle with microbundle
  console.log('\n4/4  Bundling with microbundle...');
  mkdirSync(BUILD_TMP, { recursive: true });
  execSync(
    `npx microbundle ${FORMS2_SRC} -o ${BUILD_TMP}/forms2.js -f modern --no-sourcemap --target web`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  renameSync(`${BUILD_TMP}/forms2.modern.js`, FORMS2_MIN);
  console.log('\n✓ Done — deps/forms2.min.js updated.\n');
}

main().catch((e) => {
  console.error('\n✗ Error:', e.message);
  process.exit(1);
});
