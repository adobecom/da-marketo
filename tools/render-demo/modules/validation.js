/**
 * Validate visible required fields. Returns map of fieldId -> error message.
 * @param {object} formState - FormState with fields (visible, required, value)
 * @param {function} getString - (locale, key) => string for validation message
 * @returns {{ errors: Record<string, string>, valid: boolean }}
 */
export function validateVisibleRequired(formState, getString) {
  const errors = {};
  const fields = formState.fields || [];
  const locale = formState.locale || 'en';

  fields.forEach((f) => {
    if (!f.visible || !f.required) return;
    const val = (f.value ?? '').toString().trim();
    if (!val) {
      errors[f.id] = getString(locale, 'validationRequired');
    }
  });

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  };
}
