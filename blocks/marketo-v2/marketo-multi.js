/* eslint-disable camelcase */
import { LIBS } from '../../scripts/scripts.js';

const { createTag } = await import(`${LIBS}/utils/utils.js`);
const { debounce } = await import(`${LIBS}/utils/action.js`);

function updateStepDetails(formEl, step, totalSteps) {
  formEl.classList.add('hide-errors');
  formEl.classList.remove('show-warnings');
  formEl.querySelector('.step-details .step').textContent = `Step ${step} of ${totalSteps}`;
  formEl.querySelector('#mktoButton_new').textContent = step === totalSteps ? 'Submit' : 'Next';
  formEl.querySelector(`.mktoFormRowTop[data-validate="${step}"]:not(.mktoHidden) input`)?.focus();
  formEl.dataset.mktofield_step = step;
}

function showPreviousStep(formEl, totalSteps) {
  const currentStep = parseInt(formEl.dataset.mktofield_step, 10);
  const previousStep = currentStep - 1;
  const backBtn = formEl.querySelector('.back-btn');

  updateStepDetails(formEl, previousStep, totalSteps);
  if (previousStep === 1) backBtn?.remove();
}

const showNextStep = (formEl, currentStep, totalSteps) => {
  if (currentStep === totalSteps) return;
  const nextStep = currentStep + 1;
  const stepDetails = formEl.querySelector('.step-details');

  if (!stepDetails.querySelector('.back-btn')) {
    const backBtn = createTag('button', { class: 'back-btn', type: 'button' }, 'Back');
    backBtn.addEventListener('click', () => showPreviousStep(formEl, totalSteps));
    stepDetails.prepend(backBtn);
  }

  updateStepDetails(formEl, nextStep, totalSteps);
};

export const formValidate = (formEl) => {
  const currentStep = parseInt(formEl.dataset.mktofield_step, 10) || 1;

  if (formEl.querySelector(`.mktoFormRowTop[data-validate="${currentStep}"] .mktoInvalid`)) {
    return false;
  }

  const totalSteps = formEl.closest('.marketo').classList.contains('multi-3') ? 3 : 2;
  showNextStep(formEl, currentStep, totalSteps);

  return currentStep === totalSteps;
};

function onRender(formEl, totalSteps) {
  const currentStep = parseInt(formEl.dataset.mktofield_step, 10);
  const submitButton = formEl.querySelector('#mktoButton_new');
  if (submitButton) submitButton.textContent = currentStep === totalSteps ? 'Submit' : 'Next';
  formEl.querySelector('.step-details .step').textContent = `Step ${currentStep} of ${totalSteps}`;
}

const readyForm = (form, totalSteps) => {
  const formEl = form.getFormElem().get(0);
  form.onValidate(() => formValidate(formEl));

  const stepEl = createTag('p', { class: 'step' }, `Step 1 of ${totalSteps}`);
  const stepDetails = createTag('div', { class: 'step-details' }, stepEl);
  formEl.append(stepDetails);

  const debouncedOnRender = debounce(() => onRender(formEl, totalSteps), 10);
  const observer = new MutationObserver(debouncedOnRender);
  observer.observe(formEl, { childList: true, subtree: true });
  debouncedOnRender();
};

export default (el) => {
  if (!el.classList.contains('multi-step')) return;
  const formEl = el.querySelector('form');
  const totalSteps = el.classList.contains('multi-3') ? 3 : 2;
  formEl.dataset.mktofield_step = 1;
  formEl.dataset.mktofield_step_total = totalSteps;
  const { mcz_marketoForm_pref } = window;

  mcz_marketoForm_pref.form.fldStepPref = {
    1: ['Email', 'Country'],
    2: [
      'FirstName',
      'LastName',
      'Phone',
      'mktoFormsJobTitle',
      'mktoFormsFunctionalArea',
    ],
    3: [
      'Company',
      'mktoFormsCompany',
      'State',
      'PostalCode',
      'mktoFormsPrimaryProductInterest',
      'mktoRequestProductDemo',
      'mktoFormsComments',
      'mktoFormsRevenue',
      'mktoFormsEmployeeRange',
    ],
  };

  const { MktoForms2 } = window;
  MktoForms2.whenReady((form) => { readyForm(form, totalSteps); });
};
