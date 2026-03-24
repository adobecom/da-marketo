import { getString } from '../config/strings.js';

/**
 * Render form DOM from FormState. One pass: form, fieldsets, inputs, labels, privacy block, next/back, submit.
 * Adds class form-demo-form-visible to the form so CSS can hide the skeleton.
 * @param {object} formState - FormState from buildFormState
 * @param {HTMLElement} container
 */
export function renderForm(formState, container) {
  const s = (key) => getString(formState.locale || 'en', key);
  const wrapper = document.createElement('div');
  wrapper.className = 'form-demo-form-wrapper';

  const formHeadingKey = formState.config?.formHeadingKey;
  if (formHeadingKey) {
    const headingText = s(formHeadingKey);
    if (headingText) {
      const heading = document.createElement('p');
      heading.className = 'form-demo-form-heading';
      heading.textContent = headingText;
      wrapper.appendChild(heading);
    }
  }

  const { fields = [], effectiveSteps = [], successType, successContent, config } = formState;
  const features = config?.features || {};
  const multiStep = features.multiStep && effectiveSteps.length > 1;
  const currentStepIndex = formState.currentStepIndex ?? 0;

  const fieldsInStep = multiStep
    ? fields.filter((f) => (effectiveSteps[currentStepIndex]?.fieldIds || []).includes(f.id) && f.visible)
    : fields.filter((f) => f.visible);

  const hasErrors = fieldsInStep.some((f) => f.error);

  const form = document.createElement('form');
  form.className = 'form-demo-form form-demo-form-visible' + (hasErrors ? ' form-demo-form-show-errors' : '');
  form.setAttribute('novalidate', '');

  if (hasErrors) {
    const generalError = document.createElement('div');
    generalError.className = 'form-demo-general-error';
    generalError.setAttribute('role', 'alert');
    generalError.textContent = `${s('validationRequired')} `;
    const icon = document.createElement('span');
    icon.className = 'form-demo-general-error-icon';
    icon.setAttribute('aria-hidden', 'true');
    generalError.appendChild(icon);
    form.appendChild(generalError);
  }

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'form-demo-fieldset';

  fieldsInStep.forEach((field) => {
    const wrap = document.createElement('div');
    wrap.className = 'form-demo-field';
    if (!field.visible) wrap.classList.add('form-demo-field-hidden');

    const label = document.createElement('label');
    label.className = 'form-demo-label';
    label.htmlFor = `form-demo-${field.id}`;
    label.textContent = field.label;
    if (field.required) label.classList.add('form-demo-label-required');

    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.id = `form-demo-${field.id}`;
      input.name = field.name;
      input.className = 'form-demo-input form-demo-select';
      (field.options || []).forEach((opt, idx) => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = (opt.value === '' && field.placeholder && idx === 0) ? field.placeholder : opt.label;
        input.appendChild(option);
      });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = `form-demo-${field.id}`;
      input.name = field.name;
      input.className = 'form-demo-input form-demo-textarea';
      input.placeholder = field.placeholder || '';
    } else {
      input = document.createElement('input');
      input.id = `form-demo-${field.id}`;
      input.name = field.name;
      input.type = field.type || 'text';
      input.className = 'form-demo-input';
      input.placeholder = field.placeholder || '';
    }
    input.dataset.fieldId = field.id;
    if (field.required) input.setAttribute('required', '');
    if (field.value) input.value = field.value;
    if (field.error) input.classList.add('form-demo-input-invalid');

    wrap.appendChild(label);
    wrap.appendChild(input);
    if (field.error) {
      const err = document.createElement('span');
      err.className = 'form-demo-field-error';
      err.textContent = field.error;
      wrap.appendChild(err);
    }
    fieldset.appendChild(wrap);
  });

  form.appendChild(fieldset);

  if (features.privacyByCountry) {
    const privacy = document.createElement('div');
    privacy.className = 'form-demo-privacy';
    privacy.hidden = true;
    privacy.dataset.privacyBlock = 'true';
    privacy.textContent = 'Privacy and consent text (shown after country selection).';
    form.appendChild(privacy);
  }

  const actions = document.createElement('div');
  actions.className = 'form-demo-step-nav';

  if (multiStep && currentStepIndex > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'form-demo-button-back';
    back.textContent = s('buttonBack');
    back.dataset.action = 'back';
    actions.appendChild(back);
  }

  if (multiStep && currentStepIndex < effectiveSteps.length - 1) {
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'form-demo-button-next';
    next.textContent = s('buttonNext');
    next.dataset.action = 'next';
    actions.appendChild(next);
  } else {
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'form-demo-submit';
    submit.textContent = s('buttonSubmit');
    actions.appendChild(submit);
  }

  form.appendChild(actions);

  if (multiStep) {
    const stepIndicator = document.createElement('div');
    stepIndicator.className = 'form-demo-step-indicator';
    stepIndicator.textContent = `Step ${currentStepIndex + 1} of ${effectiveSteps.length}`;
    form.appendChild(stepIndicator);
  }

  wrapper.appendChild(form);
  container.appendChild(wrapper);
  return wrapper;
}
