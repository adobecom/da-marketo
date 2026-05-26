/* global marketoFormSetup */
import { LIBS } from './constants.js';

const base = new URL('.', import.meta.url).href;
const { loadScript, loadLink } = await import(`${LIBS}/utils/utils.js`);

// Stage form 1723 scripts
const SCRIPTS = [
  'scripts/80_translations/state_translate-en.js',
  'scripts/00_config/marketo_form_setup_rules.js',
  'scripts/20_template_manager/template_rules.js',
  'scripts/90_build/marketo_form_setup_process.js',
  'scripts/30_privacy/privacy_validation_rules.js',
  'scripts/30_privacy/privacy_validation_process.js',
  'scripts/40_field_management/field_preferences.js',
  'scripts/50_analytics/adobe_analytics.js',
  'scripts/60_enrichment/demandbase_config.js',
  'scripts/60_enrichment/demandbase_mapping.js',
  'scripts/60_enrichment/demandbase_processing.js',
  'scripts/40_field_management/form_dynamics.js',
  'scripts/20_template_manager/template_manager.js',
  'scripts/40_field_management/category_filters.js',
  'scripts/90_build/cleaning_validation.js',
  'scripts/80_translations/general_translations.js',
  'scripts/90_build/global.js',
  'scripts/98_progressive/progressive_controller.js',
  'scripts/90_build/rendering_review.js',
];

export default async function loadMkto(marketoHost, munchkinID, formID) {
  await loadScript(new URL('./deps/forms2.min.js', import.meta.url).href);

  const { MktoForms2 } = window;
  if (!MktoForms2) throw new Error('Marketo forms not loaded');

  SCRIPTS.forEach((src) => loadLink(`${base}${src}`, { rel: 'preload', as: 'script' }));

  MktoForms2.loadForm(`https://${marketoHost}`, munchkinID, formID, () => {
    SCRIPTS.reduce(
      (chain, src) => chain.then(() => loadScript(`${base}${src}`)),
      Promise.resolve(),
    ).then(() => {
      marketoFormSetup('stage1');
    });
  });
}
