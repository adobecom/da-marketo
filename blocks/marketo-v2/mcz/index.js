/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Unified loader for Marketo form modules (modularized ES modules)
// Ensures correct load order and initialization

import { loadStyle } from '../../../utils/utils.js';
import setupRules, { mkfC, defaultMarketoFormPref } from './marketo_form_setup_rules.js';
import templateRules, { AUTO_COMPLETE_FIELDS, TEMPLATE_RULES } from './template_rules.js';
import setupProcess, { marketoFormSetup } from './marketo_form_setup_process.js';
import privacyProcess from './privacy_validation_process.js';
import fieldPrefs from './field_preferences.js';
import analytics from './adobe_analytics.js';
import templateManager from './template_manager.js';
import setupCategoryFilters from './category_filters.js';
import cleaningValidation from './cleaning_validation.js';
import translations from './general_translations.js';
import { renderingReview } from './rendering_review.js';

export default async function initMarketoFormModules() {
  loadStyle('/blocks/marketo-v2/mcz/marketo.css');

  // 1. Rules and constants
  await setupRules();
  templateRules(mkfC);

  // 2. Setup process and privacy validation
  await setupProcess(mkfC, renderingReview);
  await privacyProcess(mkfC, marketoFormSetup);

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
