/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
// Unified loader for Marketo form modules (modularized ES modules)
// Ensures correct load order and initialization

import { loadStyle } from '../../../utils/utils.js';

export default async function initMarketoFormModules() {
  loadStyle('/blocks/marketo-v2/mcz/marketo.css');
  const { default: global } = await import('./global.js');
  const { default: setupRules, mkfC, defaultMarketoFormPref } = await import('./marketo_form_setup_rules.js');
  const { default: templateRules, AUTO_COMPLETE_FIELDS, TEMPLATE_RULES } = await import('./template_rules.js');
  const { default: setupProcess, marketoFormSetup } = await import('./marketo_form_setup_process.js');
  const { default: privacyProcess } = await import('./privacy_validation_process.js');
  const { default: fieldPrefs } = await import('./field_preferences.js');
  const { default: analytics } = await import('./adobe_analytics.js');
  const { isSafariBrowser, initFormDynamics } = await import('./form_dynamics.js');
  const { default: templateManager } = await import('./template_manager.js');
  const { default: setupCategoryFilters } = await import('./category_filters.js');
  const { default: cleaningValidation } = await import('./cleaning_validation.js');
  const { default: translations } = await import('./general_translations.js');
  const { renderingReview } = await import('./rendering_review.js');

  // 1. Rules and constants
  setupRules();
  templateRules(mkfC);

  // 2. Setup process and privacy validation
  await setupProcess(mkfC, renderingReview);
  await privacyProcess(mkfC);

  // 3. Field preferences and analytics
  await fieldPrefs(mkfC);
  await analytics(mkfC);

  // 4. Form dynamics and template manager
  await templateManager(mkfC);

  // 5. Category filters, cleaning/validation, translations, rendering review
  await setupCategoryFilters(mkfC);
  await cleaningValidation(mkfC);
  await translations(mkfC);

  return { marketoFormSetup };
}
