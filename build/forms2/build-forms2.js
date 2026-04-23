#!/usr/bin/env node
// Download Marketo forms2.js, apply build/forms2/forms2.patch, bundle to deps/forms2.min.js
// (npm run build:forms2).  Requires a `patch` binary on PATH (e.g. macOS/Linux, Git for Windows).
//
// Usage:
//   node build/forms2/build-forms2.js
//   npm run build:forms2

import { execFileSync, execSync } from 'child_process';
import { existsSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const DEPS_DIR = join(REPO_ROOT, 'deps');

const PATCH_FILE = join(SCRIPT_DIR, 'forms2.patch');
const FORMS2_FILE = join(DEPS_DIR, 'forms2.js');
const FORMS2_MIN_FILE = join(DEPS_DIR, 'forms2.min.js');
const FORMS2_ORIG = join(DEPS_DIR, 'forms2.js.orig');

const URL_FORMS2 = 'https://engage.adobe.com/js/forms2/js/forms2.js';

function runPatch() {
  try {
    execFileSync('patch', ['-p1', '-i', PATCH_FILE], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    throw new Error(
      `patch failed. ${m}  `
        + 'Regenerate build/forms2/forms2.patch if Marketo changed the CDN file.',
    );
  }
}

function moveModernBundleToMin() {
  const produced = readdirSync(DEPS_DIR).find((f) => /^forms2\.min\.modern\.(mjs|js)$/.test(f));
  if (!produced) {
    throw new Error('microbundle did not emit deps/forms2.min.modern.mjs (or .js).');
  }
  renameSync(join(DEPS_DIR, produced), FORMS2_MIN_FILE);
}

async function main() {
  console.log('Forms 2 JS\n');

  console.log(`  → GET ${URL_FORMS2}`);

  const res = await fetch(URL_FORMS2);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const source = await res.text();
  console.log(`Fetched ${Math.round(source.length / 1024)} KB\n`);

  writeFileSync(FORMS2_FILE, source, 'utf8');
  console.log('Wrote forms2.js to deps folder');
  runPatch();
  console.log('Patched forms2.js in deps');
  if (existsSync(FORMS2_ORIG)) {
    unlinkSync(FORMS2_ORIG);
  }

  execSync(
    `npx microbundle ${FORMS2_FILE} -o ${FORMS2_MIN_FILE} -f modern --no-sourcemap --target web`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  moveModernBundleToMin();
  console.log(`\nDone. Bundled forms2.min.js -> ${DEPS_DIR}`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
