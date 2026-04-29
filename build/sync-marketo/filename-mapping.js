const MARKER_TO_FILE = {
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
  '// ## Processing': 'marketo_form_setup_process.js',
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

const MARKERS_SORTED = Object.keys(MARKER_TO_FILE).sort((a, b) => b.length - a.length);

const BASENAME_TO_FOLDER = {
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
  'marketo_form_setup_process.js': '90_build',
  'rendering_review.js': '90_build',
  'known_visitor.js': '95_known_visitor',
  'progressive_config.js': '98_progressive',
  'progressive_controller.js': '98_progressive',
};

function shortHash(str) {
  let h = 5381;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = ((h * 33) + s.charCodeAt(i)) % 2147483647;
  }
  return h.toString(36).slice(0, 10);
}

function findFromMarkers(content) {
  const text = String(content);
  const key = MARKERS_SORTED.find((k) => text.includes(k));
  return key ? MARKER_TO_FILE[key] : null;
}

function findFromFingerprints(content, formId) {
  const text = String(content);
  if (text.includes('const mkto_PrgrsCtrlr = {')) return 'progressive_controller.js';
  if (formId != null && Number.isFinite(Number(formId)) && text.includes('@namespace MCZ_LPSync')) {
    return `98_progressive/landing_pages/lp_sync_${formId}.js`;
  }
  if (text.includes('var knownMktoVisitor = true')) return 'known_visitor.js';
  return null;
}

function findFromLangComment(content) {
  const lines = String(content).split('\n').slice(0, 10);

  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (!t.startsWith('//')) continue; // eslint-disable-line no-continue

    const withEq = t.match(/\blang\s*code\s*=\s*([a-zA-Z]{2,3}(?:[_-][a-zA-Z]{2,3})?)/i);
    if (withEq) return `state_translate-${withEq[1].toLowerCase().replace(/-/g, '_')}.js`;

    const bare = t.match(/\blang\s*code\s+([a-zA-Z]{2,3})(?=\s*[,\s]|$)/i);
    if (bare) {
      const loc = t.match(/\bform\s+locale\s*=\s*([a-zA-Z]{2,3}(?:[_-][a-zA-Z]{2,3})?)/i);
      const code = loc ? loc[1] : bare[1];
      return `state_translate-${code.toLowerCase().replace(/-/g, '_')}.js`;
    }

    const locale = t.match(/\bform\s+locale\s*=\s*([a-zA-Z]{2,3}(?:[_-][a-zA-Z]{2,3})?)/i);
    if (locale) return `state_translate-${locale[1].toLowerCase().replace(/-/g, '_')}.js`;
  }

  return null;
}

function folderForBasename(basename) {
  if (BASENAME_TO_FOLDER[basename]) return BASENAME_TO_FOLDER[basename];
  if (/^state_translate(-[a-z_]+)?\.js$/i.test(basename)) return '80_translations';
  if (/^lp_sync_\d+\.js$/i.test(basename)) return '98_progressive/landing_pages';
  return null;
}

function findRawPath(content, formId) {
  const text = String(content);
  const m = text.match(/\/\/\s*#+\s*(\S+\.js)/);
  if (m) return m[1];
  return findFromLangComment(text) || findFromMarkers(text) || findFromFingerprints(text, formId);
}

function applyLayout(rawPath) {
  if (!rawPath) return null;
  if (rawPath.includes('/')) return rawPath;
  const dir = folderForBasename(rawPath);
  return dir ? `${dir}/${rawPath}` : rawPath;
}

export default function resolveScriptFilename(
  content,
  position,
  usedPaths,
  formId = null,
) {
  const trimmed = String(content || '').trim();
  if (!trimmed) return { filename: `marketo-script-empty-${position}.js` };

  const rawPath = findRawPath(content, formId);
  const logicalPath = applyLayout(rawPath);

  if (logicalPath) {
    const n = (usedPaths.get(logicalPath) || 0) + 1;
    usedPaths.set(logicalPath, n);
    const filename = n === 1 ? logicalPath : logicalPath.replace(/\.js$/i, `-${n}.js`);
    return { filename, sourcePath: logicalPath };
  }

  return { filename: `marketo-script-${shortHash(trimmed)}.js` };
}
