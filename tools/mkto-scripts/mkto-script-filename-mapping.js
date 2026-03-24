/**
 * Resolve logical .js filenames for inline Marketo form scripts from comments and markers.
 */

function shortHash(str) {
  let h = 5381;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = ((h * 33) + s.charCodeAt(i)) % 2147483647;
  }
  return h.toString(36).slice(0, 10);
}

const FORM_LINE_FILE_MAPPING = {
  '// ## Adobe Analytics - Form Interactions': 'adobe_analytics.js',
  '// ## Category Filters': 'category_filters.js',
  '// ## Cleaning and Validation': 'cleaning_validation.js',
  '// Demandbase Module Config': 'demandbase_config.js',
  '// Demandbase Module Value Mapping': 'demandbase_mapping.js',
  '// ## Demandbase Module Processing': 'demandbase_processing.js',
  '// ## Field Preferences': 'field_preferences.js',
  'var form_dynamics = true;': 'form_dynamics.js',
  'mkf_c.log("General Form Translations Added");': 'general_translations.js',
  '// ##  Marketo Global Form Functions': 'global.js',
  '// ## Known Visitor': 'known_visitor.js',
  '// ## Processing': 'marketo_form_setup_processing.js',
  '// ##  Marketo Form Setup': 'marketo_form_setup_rules.js',
  '// ## Privacy Validation - Rule Processing': 'privacy_validation_process.js',
  '// ## Privacy Validation - Rules': 'privacy_validation_rules.js',
  '// ## Privacy Validation': 'privacy_validation.js',
  '// ## Partner Validation': 'partner_validation.js',
  '// ## Rendering Review': 'rendering_review.js',
  '// en_us language strings English': 'state_translate-en.js',
  '// ## General translation for all forms': 'state_translate.js',
  '// ## Template Manager Module': 'template_manager.js',
  '// ## Template Rules': 'template_rules.js',
};

const FORM_LINE_FILE_MAP_KEYS_SORTED = Object.keys(FORM_LINE_FILE_MAPPING).sort(
  (a, b) => b.length - a.length,
);

/** When subFolders is true, basenames (no `…/`) map under these dirs. */
const BASENAME_TO_SUBFOLDER = {
  'marketo_form_setup_rules.js': '00_config',
  'template_manager.js': '20_template_manager',
  'template_rules.js': '20_template_manager',
  'privacy_validation_process.js': '30_privacy',
  'privacy_validation_rules.js': '30_privacy',
  'privacy_validation.js': '30_privacy',
  'partner_validation.js': '30_privacy',
  'category_filters.js': '40_field_management',
  'field_preferences.js': '40_field_management',
  'form_dynamics.js': '40_field_management',
  'adobe_analytics.js': '50_analytics',
  'demandbase_config.js': '60_enrichment',
  'demandbase_mapping.js': '60_enrichment',
  'demandbase_processing.js': '60_enrichment',
  'general_translations.js': '80_translations',
  'state_translate.js': '80_translations',
  'global.js': '90_build',
  'cleaning_validation.js': '90_build',
  'marketo_form_setup_processing.js': '90_build',
  'marketo_form_setup_process.js': '90_build',
  'rendering_review.js': '90_build',
  'known_visitor.js': '95_known_visitor',
  'progressive_config.js': '98_progressive',
  'progressive_controller.js': '98_progressive',
};

function findFilenameFromFormLineMapping(content) {
  const text = String(content);
  for (let i = 0; i < FORM_LINE_FILE_MAP_KEYS_SORTED.length; i += 1) {
    const key = FORM_LINE_FILE_MAP_KEYS_SORTED[i];
    if (text.includes(key)) return FORM_LINE_FILE_MAPPING[key];
  }
  return null;
}

function slugFromLangLabelFragment(raw) {
  const slug = raw.trim()
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slug || null;
}

function findFilenameFromLangComment(content) {
  const text = String(content);
  const langCode = text.match(/\blang\s*code\s*=\s*([a-zA-Z]{2,3})\b/);
  if (langCode) {
    return `state_translate-${langCode[1].toLowerCase()}.js`;
  }
  const localeUnderscore = text.match(/\bform\s+locale\s*=\s*([a-zA-Z]{2,3})_[a-zA-Z]{2}\b/);
  if (localeUnderscore) {
    return `state_translate-${localeUnderscore[1].toLowerCase()}.js`;
  }
  const localeBare = text.match(/\bform\s+locale\s*=\s*([a-zA-Z]{2,3})\b/);
  if (localeBare) {
    return `state_translate-${localeBare[1].toLowerCase()}.js`;
  }
  const langName = text.match(/\blang\s+name\s*=\s*([^,\n]+)/i);
  if (langName) {
    const slug = slugFromLangLabelFragment(langName[1]);
    if (slug) return `state_translate-name-${slug}.js`;
  }
  const formLanguage = text.match(/\bform\s+language\s*=\s*([^,\n]+)/i);
  if (formLanguage) {
    const slug = slugFromLangLabelFragment(formLanguage[1]);
    if (slug) return `state_translate-name-${slug}.js`;
  }
  return null;
}

function folderForBasename(basename) {
  if (BASENAME_TO_SUBFOLDER[basename]) {
    return BASENAME_TO_SUBFOLDER[basename];
  }
  if (/^state_translate(-name)?[-.]/i.test(basename)) {
    return '80_translations';
  }
  return null;
}

/**
 * Flat list (basename only) vs `NN_folder/file.js` tree when subFolders is true.
 */
function applyPathLayout(path, subFolders) {
  if (!path) return null;
  if (!subFolders) {
    return path.includes('/') ? path.split('/').pop() : path;
  }
  if (path.includes('/')) {
    return path;
  }
  const dir = folderForBasename(path);
  if (dir) {
    return `${dir}/${path}`;
  }
  return path;
}

function findRawLogicalPath(content) {
  const text = String(content);
  const primary = text.match(/\/\/\s*#+\s*(\S+\.js)/);
  let path = null;
  if (primary) {
    [, path] = primary;
  } else {
    const lines = text.split('\n');
    const maxLines = Math.min(lines.length, 150);
    for (let i = 0; i < maxLines; i += 1) {
      const line = lines[i];
      if (/^\s*\/\//.test(line)) {
        const m = line.match(/\/\/\s*(?:#+\s*)?(\S+\.js)(?:\s|$|[-–])/);
        if (m && m[1].includes('/')) {
          [, path] = m;
          break;
        }
      }
    }
    if (!path) {
      path = findFilenameFromLangComment(text) || findFilenameFromFormLineMapping(text);
    }
  }
  return path;
}

/**
 * @param {string} content - Inline script source
 * @param {string} [src] - External script URL
 * @param {number} position - Script index
 * @param {Map<string, number>} usedPaths - Dedup counts by logical path
 * @param {boolean} subFolders - Tree layout (`NN_folder/file.js`) vs flat basenames
 * @returns {{ filename: string, sourcePath?: string }}
 */
export default function resolveScriptFilename(content, src, position, usedPaths, subFolders) {
  if (src) {
    return {
      filename: `marketo-script-external-${shortHash(src)}.js`,
      sourcePath: undefined,
    };
  }
  const trimmed = String(content || '').trim();
  if (!trimmed) {
    return {
      filename: `marketo-script-empty-${position}.js`,
      sourcePath: undefined,
    };
  }

  const rawPath = findRawLogicalPath(content);
  const logicalPath = applyPathLayout(rawPath, subFolders);
  if (logicalPath) {
    const n = (usedPaths.get(logicalPath) || 0) + 1;
    usedPaths.set(logicalPath, n);
    const filename = n === 1
      ? logicalPath
      : logicalPath.replace(/\.js$/i, `-${n}.js`);
    return { filename, sourcePath: logicalPath };
  }

  return {
    filename: `marketo-script-${shortHash(trimmed)}.js`,
    sourcePath: undefined,
  };
}
