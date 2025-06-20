/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Category Filters

import { mkfC } from './marketo_form_setup_rules.js';

let fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval;

const dispatchChangeEvent = (element, value) => {
  if (value.trim() !== element.value) {
    element.value = value.trim();
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        element.dispatchEvent(event);
      }, 150 * i);
    }
  }
};

function updateCategoryFilter(selector, property) {
  const element = document.querySelector(selector);
  const value = window?.mcz_marketoForm_pref?.field_filters?.[property];
  if (value && value !== '') {
    dispatchChangeEvent(element, value);
  }
}

function refreshCategoryFilters() {
  const marketoConfigExists = document.querySelector('.marketo-config') !== null;
  if (!marketoConfigExists && fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval) {
    clearInterval(fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval);
    mkfC.log(
      'Marketo Config Interface no longer exists. Stopping field visibility check.',
    );
  }
  updateCategoryFilter('[name="mktoFormsFunctionalAreaCategory"]', 'functional_area');
  updateCategoryFilter('[name="mktoIndustryCategory"]', 'industry');
  updateCategoryFilter('[name="mktoFormsJobTitleCategory"]', 'job_role');
  updateCategoryFilter('[name="mktoprimaryProductInterestCategory"]', 'products');
}

async function fld_push_mktoFormsFunctionalAreaCategory() {
  const mktoFormsFunctionalAreaCategory = document.querySelector(
    '[name="mktoFormsFunctionalAreaCategory"]',
  );
  if (mktoFormsFunctionalAreaCategory) {
    refreshCategoryFilters();
    if (document.querySelector('.marketo-config')) {
      mkfC.log('Marketo Config Interface Found');
      if (fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval === undefined) {
        fld_wait_mktoFormsFunctionalAreaCategoryCheckInterval = setInterval(
          refreshCategoryFilters,
          1000,
        );
      }
    }
  } else if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
    mkfC.log('Known Visitor - mktoFormsFunctionalAreaCategory');
  } else {
    setTimeout(fld_push_mktoFormsFunctionalAreaCategory, 20);
  }
}

export function categoryFilters() {
  fld_push_mktoFormsFunctionalAreaCategory();
}

export default async function init() {
  mkfC.log('Category Filters - Loaded');
}
