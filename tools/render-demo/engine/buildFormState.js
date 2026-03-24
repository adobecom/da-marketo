import { getString } from '../config/strings.js';
import { getEffectiveSteps } from '../modules/effectiveSteps.js';

/**
 * Build FormState from RenderConfig and options.
 * Resolves labelKey/placeholderKey via strings; applies PP (hidden fields); computes effective steps.
 * @param {object} config - RenderConfig
 * @param {{ knownUserFieldIds?: string[], locale?: string }} options
 * @returns {{ state: object, effectiveSteps: Array }}
 */
export function buildFormState(config, options = {}) {
  const { knownUserFieldIds = [], locale = 'en' } = options;
  const ppHiddenFieldIds = new Set(knownUserFieldIds);

  const fields = (config.fields || []).map((f) => {
    const visible = !ppHiddenFieldIds.has(f.id);
    const label = getString(locale, f.labelKey);
    const placeholder = f.required ? `${label}*` : (f.placeholderKey ? getString(locale, f.placeholderKey) : '');
    const optionsResolved = (f.options || []).map((o) => ({
      value: o.value,
      label: getString(locale, o.labelKey),
    }));
    return {
      ...f,
      label,
      placeholder,
      options: optionsResolved.length ? optionsResolved : undefined,
      visible,
      value: '',
      error: null,
    };
  });

  const fieldsById = new Map(fields.map((f) => [f.id, f]));
  const effectiveSteps = getEffectiveSteps({
    steps: config.steps || [],
    fields,
  });

  const state = {
    phase: 'ready',
    currentStepIndex: 0,
    steps: config.steps || [],
    fields,
    prefill: {},
    validationErrors: {},
    ppHiddenFieldIds,
    profile: {
      isKnown: knownUserFieldIds.length > 0,
      submittedFieldIds: [...knownUserFieldIds],
    },
    successType: config.success?.type || 'message',
    successContent: config.success?.content ?? '',
    effectiveSteps,
    config,
    locale,
  };

  return { state, effectiveSteps };
}
