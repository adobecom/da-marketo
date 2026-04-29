const base = new URL('.', import.meta.url).href;
import { LIBS } from '../scripts/scripts.js';

const { loadScript } = await import(`${LIBS}/utils/utils.js`);

// Prod form 2277 scripts
const SCRIPTS = [
  '80_translations/state_translate-en.js',
  '00_config/marketo_form_setup_rules.js',
  '20_template_manager/template_rules.js',
  '90_build/marketo_form_setup_process.js',
  '30_privacy/privacy_validation_rules.js',
  '30_privacy/privacy_validation_process.js',
  '40_field_management/field_preferences.js',
  '50_analytics/adobe_analytics.js',
  '40_field_management/form_dynamics.js',
  '20_template_manager/template_manager.js',
  '40_field_management/category_filters.js',
  '90_build/cleaning_validation.js',
  '80_translations/general_translations.js',
  '90_build/global.js',
  '90_build/rendering_review.js',
];

export const loadMkto = async (marketoHost, munchkinID, formID) => {
  await loadScript(new URL('../deps/forms2.min.js', import.meta.url).href);

  const { MktoForms2 } = window;
  if (!MktoForms2) throw new Error('Marketo forms not loaded');

  MktoForms2.loadForm(`https://${marketoHost}`, munchkinID, formID, () => {
    SCRIPTS.reduce(
      (chain, src) => chain.then(() => loadScript(`${base}${src}`)),
      Promise.resolve(),
    ).then(() => {
      marketoFormSetup('stage1');
    });
  });
};
