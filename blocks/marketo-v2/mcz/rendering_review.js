// Rendering Review

import { mkfC } from './marketo_form_setup_rules.js';
import { marketoFormSetup } from './marketo_form_setup_process.js';
import { fieldPref } from './field_preferences.js';
import { categoryFilters } from './category_filters.js';
import cleaningValidation from './cleaning_validation.js';
import templateManager from './template_manager.js';
import { privacyValidation } from './privacy_validation_process.js';

let translationsReady1 = false;
let intervalWaitWhenReady;

function getMktoFormID1() {
  const mktoForm = document.querySelector('form.mktoForm');
  if (mktoForm && mktoForm.id) {
    const formId = parseInt(mktoForm.id.replace('mktoForm_', ''), 10);
    return Number.isNaN(formId) ? null : formId;
  }
  return null;
}

function waitFields(form) {
  const formSelector = `#mktoForm_${form.getId()} .fnc_field_change_country`;
  const formElements = document.querySelectorAll(formSelector);
  if (formElements.length > 0) {
    const formParentId = `mktoForm_${form.getId()}`;
    const formParentElem = document.getElementById(formParentId);
    if (formParentElem.classList.contains('mktoWhenRendered')) {
      // Already rendered, no need to reinitialize
    } else {
      formParentElem.classList.add('mktoWhenRendered');

      marketoFormSetup();
      fieldPref();
      categoryFilters();
      cleaningValidation();
      templateManager();
    }
  } else {
    privacyValidation();

    if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
      mkfC.log('knownMktoVisitor is not defined');
    } else {
      setTimeout(() => {
        waitFields(form);
      }, 10);
    }
  }
}

function waitWhenReady() {
  if (!translationsReady1 && typeof MktoForms2 === 'object') {
    const formId = getMktoFormID1();
    if (
      formId
      && typeof window.MktoForms2.getForm === 'function'
      && typeof window.MktoForms2.whenReady === 'function'
    ) {
      const form = window.MktoForms2.getForm(formId);
      if (form) {
        clearInterval(intervalWaitWhenReady);
        translationsReady1 = true;

        window.MktoForms2.whenReady((marketoForm) => {
          waitFields(marketoForm);
        });
      }
    }
  }
}

export function renderingReview() {
  intervalWaitWhenReady = setInterval(() => {
    setTimeout(waitWhenReady, 10);
  }, 10);
}

export default async function init() {
  mkfC.log('Rendering Review - Loaded');
}
