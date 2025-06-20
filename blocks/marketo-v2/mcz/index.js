// Unified loader for Marketo form modules (modularized ES modules)
// Ensures correct load order and initialization

import { loadStyle } from '../../../utils/utils.js';
import setupRules from './marketo_form_setup_rules.js';
import templateRules from './template_rules.js';
import setupProcess, { marketoFormSetup } from './marketo_form_setup_process.js';
import privacyProcess from './privacy_validation_process.js';
import analytics from './adobe_analytics.js';
import setupCategoryFilters from './category_filters.js';
import translations from './general_translations.js';
import { renderingReview } from './rendering_review.js';

export default async function initMarketoFormModules() {
  loadStyle('/blocks/marketo-v2/mcz/marketo.css');

  // 1. Rules and constants
  await setupRules();
  templateRules();

  // 2. Setup process and privacy validation
  await setupProcess(renderingReview);
  await privacyProcess(marketoFormSetup);

  // 3. Field preferences and analytics
  await analytics();

  // 4. Category filters, cleaning/validation, translations, rendering review
  await setupCategoryFilters();
  await translations();

  return { marketoFormSetup };
}
