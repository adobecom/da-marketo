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
import { addAutocompleteAttribute } from './cleaning_validation.js';

export default function init() {
  loadStyle('/blocks/marketo-v2/mcz/marketo.css');
  setupRules();
  templateRules();
  setupProcess(renderingReview);
  privacyProcess(marketoFormSetup);
  analytics();
  addAutocompleteAttribute();
  setupCategoryFilters();
  translations();
  marketoFormSetup('stage1');
}
