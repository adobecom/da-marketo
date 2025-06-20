/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Rendering Review

import { mkfC } from './marketo_form_setup_rules.js';
import { marketoFormSetup } from './marketo_form_setup_process.js';
import { field_pref } from './field_preferences.js';
import { categoryFilters } from './category_filters.js';
import { cleaning_validation } from './cleaning_validation.js';
import { templateManager } from './template_manager.js';
import { privacyValidation } from './privacy_validation_process.js';

let translations_ready1 = false;
let interval_wait_whenReady;

function getMktoFormID1() {
  const mktoForm = document.querySelector('form.mktoForm');
  if (mktoForm && mktoForm.id) {
    const formId = parseInt(mktoForm.id.replace('mktoForm_', ''));
    return isNaN(formId) ? null : formId;
  }
  return null;
}

function wait_whenReady() {
  if (!translations_ready1 && typeof MktoForms2 === 'object') {
    const formId = getMktoFormID1();
    if (
      formId
      && typeof MktoForms2.getForm === 'function'
      && typeof MktoForms2.whenReady === 'function'
    ) {
      const form = MktoForms2.getForm(formId);
      if (form) {
        clearInterval(interval_wait_whenReady);
        translations_ready1 = true;

        MktoForms2.whenReady((form) => {
          function wait_fields(form) {
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
                field_pref();
                categoryFilters();
                cleaning_validation();
                templateManager();
              }
            } else {
              privacyValidation();

              if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
                mkfC.log('knownMktoVisitor is not defined');
              } else {
                setTimeout(() => {
                  wait_fields(form);
                }, 10);
              }
            }
          }
          wait_fields(form);
        });
      }
    }
  }
}

export function renderingReview() {
  interval_wait_whenReady = setInterval(() => {
    setTimeout(wait_whenReady, 10);
  }, 10);
}

export default async function init() {
  mkfC.log('Rendering Review - Loaded');
}
