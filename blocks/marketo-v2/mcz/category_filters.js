// Category Filters

import { mkfC } from './marketo_form_setup_rules.js';

let fldWaitMktoFormsFunctionalAreaCategoryCheckInterval;

const dispatchChangeEvent = (element, value) => {
  if (value.trim() !== element.value) {
    element.value = value.trim();
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
    for (let i = 0; i < 10; i += 1) {
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
  if (!marketoConfigExists && fldWaitMktoFormsFunctionalAreaCategoryCheckInterval) {
    clearInterval(fldWaitMktoFormsFunctionalAreaCategoryCheckInterval);
    mkfC.log(
      'Marketo Config Interface no longer exists. Stopping field visibility check.',
    );
  }
  updateCategoryFilter('[name="mktoFormsFunctionalAreaCategory"]', 'functional_area');
  updateCategoryFilter('[name="mktoIndustryCategory"]', 'industry');
  updateCategoryFilter('[name="mktoFormsJobTitleCategory"]', 'job_role');
  updateCategoryFilter('[name="mktoprimaryProductInterestCategory"]', 'products');
}

async function fldPushMktoFormsFunctionalAreaCategory() {
  const mktoFormsFunctionalAreaCategory = document.querySelector(
    '[name="mktoFormsFunctionalAreaCategory"]',
  );
  if (mktoFormsFunctionalAreaCategory) {
    refreshCategoryFilters();
    if (document.querySelector('.marketo-config')) {
      mkfC.log('Marketo Config Interface Found');
      if (fldWaitMktoFormsFunctionalAreaCategoryCheckInterval === undefined) {
        fldWaitMktoFormsFunctionalAreaCategoryCheckInterval = setInterval(
          refreshCategoryFilters,
          1000,
        );
      }
    }
  } else if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
    mkfC.log('Known Visitor - mktoFormsFunctionalAreaCategory');
  } else {
    setTimeout(fldPushMktoFormsFunctionalAreaCategory, 20);
  }
}

export function categoryFilters() {
  fldPushMktoFormsFunctionalAreaCategory();
}

export default async function init() {
  mkfC.log('Category Filters - Loaded');
}
