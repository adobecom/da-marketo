import { setKnownUserFieldIds } from './pp.js';

/**
 * Handle success: show message inline or redirect. Persist submitted field ids for PP.
 * @param {{ type: 'message' | 'redirect', content?: string }} success
 * @param {HTMLElement} container - form preview container
 * @param {string[]} submittedFieldIds - field ids that were submitted
 * @param {string} formId
 * @param {function} getString - (locale, key) => string
 * @param {string} locale
 */
export function handleSuccess(success, container, submittedFieldIds, formId, getString, locale) {
  if (submittedFieldIds.length) {
    setKnownUserFieldIds(formId, submittedFieldIds);
  }

  if (success.type === 'redirect' && success.content) {
    window.location.href = success.content;
    return;
  }

  const message = document.createElement('div');
  message.className = 'form-demo-success-message';
  message.textContent = success.content || getString(locale, 'successThankYou');
  container.textContent = '';
  container.appendChild(message);
}
