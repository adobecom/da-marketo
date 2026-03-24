import { getString } from '../config/strings.js';
import { getEffectiveSteps } from '../modules/effectiveSteps.js';
import { validateVisibleRequired } from '../modules/validation.js';
import { handleSuccess } from '../modules/successHandler.js';
import { runMockEnrichment } from '../modules/mockEnrichment.js';

/**
 * Apply input, blur, next/back, submit handlers. Conditional visibility, country → privacy, company enrichment.
 * @param {HTMLElement} container - form preview container (form is inside it)
 * @param {object} api - { getState, setState, reRenderForm, emitEvent }
 */
export function applyInteractivity(container, api) {
  const form = container.querySelector('.form-demo-form');
  if (!form) return;

  const { getState, setState, reRenderForm, emitEvent } = api;
  const state = getState();
  const features = state.config?.features || {};

  function updateFieldValue(fieldId, value) {
    const st = getState();
    const fields = st.fields.map((f) => (f.id === fieldId ? { ...f, value } : f));
    setState({ fields });
    emitEvent('field_change', { fieldId, value });

    if (features.conditionalVisibility) {
      const dep = st.fields.find((f) => f.visibleWhen?.fieldId === fieldId);
      if (dep) {
        const visible = dep.visibleWhen.oneOf.includes(value);
        const fields2 = st.fields.map((f) => (f.id === dep.id ? { ...f, visible } : f));
        const effectiveSteps = getEffectiveSteps({ steps: st.config?.steps || [], fields: fields2 });
        setState({ fields: fields2, effectiveSteps });
        reRenderForm();
        return;
      }
    }

    if (features.privacyByCountry && fieldId === 'Country') {
      const privacy = form.querySelector('[data-privacy-block="true"]');
      if (privacy) {
        privacy.hidden = !value;
      }
    }
  }

  form.querySelectorAll('input, select, textarea').forEach((el) => {
    const fieldId = el.dataset?.fieldId;
    if (!fieldId) return;

    el.addEventListener('input', () => updateFieldValue(fieldId, el.value));
    el.addEventListener('change', () => updateFieldValue(fieldId, el.value));

    if ((fieldId === 'Company' || fieldId === 'CompanyName') && features.companyEnrichment) {
      el.addEventListener('blur', () => {
        runMockEnrichment(el.value, (prefill) => {
          const st = getState();
          const fields = st.fields.map((f) => (prefill[f.id] !== undefined ? { ...f, value: prefill[f.id] } : f));
          setState({ fields, prefill: { ...st.prefill, ...prefill } });
          emitEvent('company_enriched', prefill);
          reRenderForm();
        });
      });
    }
  });

  form.querySelectorAll('[data-action="next"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const st = getState();
      const nextIndex = Math.min(st.currentStepIndex + 1, (st.effectiveSteps?.length || 1) - 1);
      setState({ currentStepIndex: nextIndex });
      emitEvent('step_changed', { currentStepIndex: nextIndex });
      reRenderForm();
    });
  });

  form.querySelectorAll('[data-action="back"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const st = getState();
      const prevIndex = Math.max(st.currentStepIndex - 1, 0);
      setState({ currentStepIndex: prevIndex });
      emitEvent('step_changed', { currentStepIndex: prevIndex });
      reRenderForm();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const st = getState();
    const { errors, valid } = validateVisibleRequired(st, getString);

    emitEvent('validation_run', { valid, errors });

    if (!valid) {
      const fields = st.fields.map((f) => ({ ...f, error: errors[f.id] || null }));
      setState({ validationErrors: errors, fields });
      reRenderForm();
      return;
    }

    setState({ phase: 'submitting' });
    emitEvent('submit_start', {});

    const submittedFieldIds = st.fields.filter((f) => f.visible).map((f) => f.id);

    setTimeout(() => {
      emitEvent('submit_success', {});
      handleSuccess(
        { type: st.successType, content: st.successContent },
        container,
        submittedFieldIds,
        st.config?.formId || 'demo-2277',
        (locale, key) => getString(locale, key),
        st.locale,
      );
      emitEvent('success_handled', { type: st.successType });
    }, 200);
  });
}
