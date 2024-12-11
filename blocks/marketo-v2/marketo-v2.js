/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
 * Marketo Form
 */

import { LIBS } from '../../scripts/scripts.js';

const {
  parseEncodedConfig,
  loadScript,
  loadLink,
  localizeLink,
  createTag,
  createIntersectionObserver,
  SLD,
} = await import(`${LIBS}/utils/utils.js`);

const ROOT_MARGIN = 50;
const FORM_ID = 'form id';
const BASE_URL = 'marketo host';
const MUNCHKIN_ID = 'marketo munckin';
const SUCCESS_TYPE = 'form.success.type';
const SUCCESS_CONTENT = 'form.success.content';
const SUCCESS_SECTION = 'form.success.section';
const FORM_MAP = {
  'success-type': SUCCESS_TYPE,
  'destination-type': SUCCESS_TYPE,
  'success-content': SUCCESS_CONTENT,
  'destination-url': SUCCESS_CONTENT,
  'success-section': SUCCESS_SECTION,
  'co-partner-names': 'program.copartnernames',
  'sfdc-campaign-id': 'program.campaignids.sfdc',
};
const VALIDATION_MAP = {
  Email: 'validate-1',
  Country: 'validate-1',
  name: 'validate-2',
  phone: 'validate-2',
  mktoFormsJobTitle: 'validate-2',
  mktoFormsFunctionalArea: 'validate-2',
  company: 'validate-3',
  state: 'validate-3',
  postcode: 'validate-3',
  mktoFormsPrimaryProductInterest: 'validate-3',
};
export const FORM_PARAM = 'form';

export const formValidate = (formEl, success) => {
  if (!success) {
    formEl.classList.remove('hide-errors');
    formEl.classList.add('show-warnings');
  }

  const marketo = formEl.closest('.marketo');
  const totalSteps = marketo.classList.contains('multi-3') ? 3 : 2;
  let currentStep = 1;

  if (marketo.classList.contains('step-2')) {
    currentStep = 2;
  } else if (marketo.classList.contains('step-3')) {
    currentStep = 3;
  }
  const submitButton = formEl.querySelector('#mktoButton_new');
  if (formEl.querySelector(`.mktoFormRowTop[data-validate="validate-${currentStep}"] .mktoInvalid`)) {
    return;
  }
  formEl.classList.add('hide-errors');
  if (!marketo.querySelector('.step-details .back-btn')) {
    const backBtn = createTag('button', { class: 'back-btn', type: 'button' }, 'Back');
    backBtn.addEventListener('click', () => {
      submitButton.textContent = 'Next';
      if (marketo.classList.contains('step-3')) {
        marketo.classList.remove('step-3');
        marketo.classList.add('step-2');
        marketo.querySelector('.step-details .step').textContent = 'Step 2 of 3';
      } else if (marketo.classList.contains('step-2')) {
        marketo.classList.remove('step-2');
        marketo.classList.add('step-1');
        backBtn.remove();
        marketo.querySelector('.step-details .step').textContent = `Step 1 of ${totalSteps}`;
      }
    });
    marketo.querySelector('.step-details')?.prepend(backBtn);
  }
  // Multi-step form next
  if (marketo.classList.contains('step-1')) {
    marketo.classList.remove('step-1');
    marketo.classList.add('step-2');
    formEl.classList.add('hide-errors');
    formEl.classList.remove('show-warnings');
    marketo.querySelector('.step-details .step').textContent = `Step 2 of ${totalSteps}`;
    if (marketo.classList.contains('multi-2')) {
      setTimeout(() => {
        submitButton.textContent = 'Submit';
      }, 200);
    }
    return;
  }
  if (marketo.classList.contains('step-2') && marketo.classList.contains('multi-3')) {
    marketo.classList.remove('step-2');
    marketo.classList.add('step-3');
    formEl.classList.add('hide-errors');
    formEl.classList.remove('show-warnings');
    marketo.querySelector('.step-details .step').textContent = 'Step 3 of 3';
    setTimeout(() => {
      submitButton.textContent = 'Submit';
    }, 200);
  }
};

export const decorateURL = (destination, baseURL = window.location) => {
  if (!(destination.startsWith('http') || destination.startsWith('/'))) return null;

  try {
    let destinationUrl = new URL(destination, baseURL.origin);
    const { hostname, pathname, search, hash } = destinationUrl;

    if (!hostname) {
      throw new Error('URL does not have a valid host');
    }

    if (destinationUrl.hostname.includes(`.${SLD}.`)) {
      destinationUrl = new URL(`${pathname}${search}${hash}`, baseURL.origin);
    }

    if (baseURL.pathname.endsWith('.html') && !pathname.endsWith('.html') && !pathname.endsWith('/')) {
      destinationUrl.pathname = `${pathname}.html`;
    }

    const localized = localizeLink(destinationUrl.href, null, true);
    destinationUrl.pathname = new URL(localized, baseURL.origin).pathname;

    return destinationUrl.href;
  } catch (e) {
    /* c8 ignore next 4 */
    window.lana?.log(`Error with Marketo destination URL: ${destination} ${e.message}`, { tags: 'error,marketo' });
  }

  return null;
};

const setPreference = (key = '', value = '') => {
  if (!value || !key.includes('.')) return;
  const keyParts = key.split('.');
  const lastKey = keyParts.pop();
  const formDataObject = keyParts.reduce((obj, part) => {
    obj[part] = obj[part] || {};
    return obj[part];
  }, window.mcz_marketoForm_pref);
  formDataObject[lastKey] = value;
};

export const setPreferences = (formData) => {
  window.mcz_marketoForm_pref = window.mcz_marketoForm_pref || {};
  Object.entries(formData).forEach(([key, value]) => setPreference(key, value));
};

const showSuccessSection = (formData, scroll = true) => {
  const show = (el) => {
    el.classList.remove('hide-block');
    if (scroll) el.scrollIntoView({ behavior: 'smooth' });
  };
  const successClass = formData[SUCCESS_SECTION]?.toLowerCase().replaceAll(' ', '-');
  if (!successClass) {
    window.lana?.log('Error showing Marketo success section', { tags: 'warn,marketo' });
    return;
  }
  const section = document.querySelector(`.section.${successClass}`);
  if (section) {
    show(section);
    return;
  }
  // For Marquee use case
  const maxIntervals = 6;
  let count = 0;
  const interval = setInterval(() => {
    const el = document.querySelector(`.section.${successClass}`);
    if (el) {
      clearInterval(interval);
      show(el);
    }
    count += 1;
    if (count > maxIntervals) {
      clearInterval(interval);
      window.lana?.log('Error showing Marketo success section', { tags: 'warn,marketo' });
    }
  }, 500);
};

export const formSuccess = (formEl, formData) => {
  const el = formEl.closest('.marketo-v2');
  const parentModal = formEl?.closest('.dialog-modal');
  const mktoSubmit = new Event('mktoSubmit');

  el.classList.add('success');
  window.dispatchEvent(mktoSubmit);
  window.mktoSubmitted = true;

  /* c8 ignore next 5 */
  if (parentModal) {
    const closeButton = parentModal.querySelector('.dialog-close');
    closeButton.click();
    return false;
  }

  if (formData?.[SUCCESS_TYPE] !== 'section') return true;
  showSuccessSection(formData);
  setPreference(SUCCESS_TYPE, 'message');
  return false;
};

const readyForm = (form, formData) => {
  const formEl = form.getFormElem().get(0);
  const el = formEl.closest('.marketo-v2');
  const isDesktop = matchMedia('(min-width: 900px)');
  el.classList.remove('loading');

  formEl.addEventListener('focus', ({ target }) => {
    /* c8 ignore next 9 */
    const hasError = formEl.classList.contains('show-warnings');
    const firstInvalidField = formEl.querySelector('.mktoRequired[aria-invalid=true]');
    if (!['text', 'email', 'tel', 'textarea'].includes(target.type)
      || (isDesktop.matches && !(hasError && target === firstInvalidField))) return;

    const pageTop = document.querySelector('header')?.offsetHeight ?? 0;
    const targetPosition = target?.getBoundingClientRect().top ?? 0;
    const offsetPosition = targetPosition + window.pageYOffset - pageTop - window.innerHeight / 2;
    window.scrollTo(0, offsetPosition);
  }, true);
  form.onValidate((success) => formValidate(formEl, success));
  form.onSuccess(() => formSuccess(formEl, formData));
};

export const onRender = (form) => {
  const formEl = form.getFormElem().get(0);
  const marketo = formEl.closest('.marketo');
  if (!formEl.classList.contains('mktoVisible')) return;
  if (!marketo.classList.contains('multi-step')) return;

  const submitButton = formEl.querySelector('#mktoButton_new');
  if (submitButton) submitButton.textContent = 'Next';

  formEl.querySelectorAll('.mktoFormRowTop').forEach((row) => {
    const rowClass = row.getAttribute('data-mktofield') || row.getAttribute('data-mkto_vis_src');
    if (!rowClass) return;
    if (VALIDATION_MAP[rowClass]) {
      row.setAttribute('data-validate', VALIDATION_MAP[rowClass]);
    }
  });
};

export const loadMarketo = (el, formData) => {
  const baseURL = formData[BASE_URL];
  const munchkinID = formData[MUNCHKIN_ID];
  const formID = formData[FORM_ID];

  loadScript('/deps/forms2.js')
    .then(() => {
      const { MktoForms2 } = window;
      if (!MktoForms2) throw new Error('Marketo forms not loaded');

      MktoForms2.loadForm(`//${baseURL}`, munchkinID, formID);
      MktoForms2.whenReady((form) => { readyForm(form, formData); });
      MktoForms2.whenRendered((form) => { onRender(form); });
    })
    .catch(() => {
      /* c8 ignore next 2 */
      el.style.display = 'none';
      window.lana?.log(`Error loading Marketo form for ${munchkinID}_${formID}`, { tags: 'error,marketo' });
    });
};

export default function init(el) {
  el.classList.add('marketo');
  const children = Array.from(el.querySelectorAll(':scope > div'));
  const encodedConfigDiv = children.shift();
  const link = encodedConfigDiv.querySelector('a');

  if (!link?.href) {
    el.style.display = 'none';
    return;
  }

  const encodedConfig = link.href.split('#')[1];
  const formData = parseEncodedConfig(encodedConfig);

  children.forEach((element) => {
    const key = element.children[0]?.textContent.trim().toLowerCase().replaceAll(' ', '-');
    const value = element.children[1]?.href ?? element.children[1]?.textContent;
    if (!key || !value) return;
    if (key in FORM_MAP) {
      formData[FORM_MAP[key]] = value;
    } else {
      formData[key] = value;
    }
  });

  const formID = formData[FORM_ID];
  const baseURL = formData[BASE_URL];
  const munchkinID = formData[MUNCHKIN_ID];

  if (!formID || !baseURL || !munchkinID) {
    el.style.display = 'none';
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const ungated = searchParams.get(FORM_PARAM) === 'off';

  if (formData[SUCCESS_TYPE] === 'section' && ungated) {
    el.classList.add('hide-block');
    showSuccessSection(formData, false);
    return;
  }

  formData[SUCCESS_TYPE] = formData[SUCCESS_TYPE] || 'redirect';

  if (formData[SUCCESS_TYPE] === 'redirect') {
    const destinationUrl = decorateURL(formData[SUCCESS_CONTENT]);

    if (destinationUrl) formData[SUCCESS_CONTENT] = destinationUrl;
  }

  setPreferences(formData);

  const fragment = new DocumentFragment();
  const formWrapper = createTag('section', { class: 'marketo-form-wrapper' });

  if (formData.title) {
    const title = createTag('h3', { class: 'marketo-title' }, formData.title);
    formWrapper.append(title);
  }

  if (formData.description) {
    const description = createTag('p', { class: 'marketo-description' }, formData.description);
    formWrapper.append(description);
  }

  const marketoForm = createTag('form', { ID: `mktoForm_${formID}`, class: 'hide-errors', style: 'opacity:0;visibility:hidden;' });
  const span1 = createTag('span', { id: 'mktoForms2BaseStyle', style: 'display:none;' });
  const span2 = createTag('span', { id: 'mktoForms2ThemeStyle', style: 'display:none;' });
  formWrapper.append(span1, span2, marketoForm);

  fragment.append(formWrapper);
  el.replaceChildren(fragment);
  el.classList.add('loading');
  if (el.classList.contains('multi-2') || el.classList.contains('multi-3')) {
    el.classList.add('multi-step');
    el.classList.add('step-1');
    const totalSteps = el.classList.contains('multi-3') ? 3 : 2;
    const stepEl = createTag('p', { class: 'step' }, `Step 1 of ${totalSteps}`);
    const stepWrapper = createTag('div', { class: 'step-details' }, stepEl);
    formWrapper.append(stepWrapper);
  }

  loadLink(`https://${baseURL}`, { rel: 'dns-prefetch' });

  createIntersectionObserver({
    el,
    callback: (target) => {
      loadMarketo(target, formData);
    },
    options: { rootMargin: `${ROOT_MARGIN}px` },
  });
}
