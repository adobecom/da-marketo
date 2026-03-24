const STORAGE_PREFIX = 'form_demo_known_';

/**
 * @param {string} formId
 * @returns {string[]} submitted field ids from localStorage (known user)
 */
export function getKnownUserFieldIds(formId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${formId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} formId
 * @param {string[]} fieldIds
 */
export function setKnownUserFieldIds(formId, fieldIds) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${formId}`, JSON.stringify(fieldIds));
  } catch {
    // ignore
  }
}

/**
 * Clear known user for form (for "Reset known user" button).
 * @param {string} formId
 */
export function clearKnownUser(formId) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${formId}`);
  } catch {
    // ignore
  }
}
