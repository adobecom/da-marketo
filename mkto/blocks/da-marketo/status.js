import { LIBS } from '../../constants.js';

const { createTag, loadStyle } = await import(`${LIBS}/utils/utils.js`);

const BLOCK_BASE = new URL('../../', import.meta.url).href;
const { hostname: BLOCK_HOSTNAME } = new URL(BLOCK_BASE);
const MARKETO_LIBS = BLOCK_HOSTNAME === 'localhost' ? 'local' : BLOCK_HOSTNAME.split('--')[0];

function getDetails(el, formID) {
  const { template, subtype } = window.mcz_marketoForm_pref.form;
  const successType = window.mcz_marketoForm_pref.form.success.type;
  const successContent = window.mcz_marketoForm_pref.form.success.content;
  const successContentElement = successContent?.startsWith?.('http')
    ? `<a href="${successContent}" target="_blank">${successContent}</a>`
    : successContent;
  let multiStep = null;

  if (el.classList.contains('multi-step')) {
    multiStep = el.classList.contains('multi-3') ? '3-step' : '2-step';
  }

  return `
    <button class="miw-close" aria-label="Close"></button>
    <p>Form ID: <span>${formID || '(not set)'}</span></p>
    <p>Template: <span>${template || '(not set)'}</span></p>
    <p>Subtype: <span>${subtype || '(not set)'}</span></p>
    <p>Multi-step: <span>${multiStep || '(not set)'}</span></p>
    <p>Success type: <span>${successType || '(not set)'}</span></p>
    <p>Success content: <span>${successContentElement || '(not set)'}</span></p>
    <p>Marketo libs: <span>${MARKETO_LIBS || '(not set)'}</span></p>
  `;
}

function createWidget(el, formID) {
  const icon = createTag('svg', { class: 'miw-icon' });
  const badge = createTag('span', { class: 'miw-badge' }, [icon, 'Marketo']);
  const details = createTag('div', { class: 'miw-details hidden' });
  const widget = createTag('div', { class: 'marketo-info-widget' }, [badge, details]);

  widget.addEventListener('click', (e) => {
    if (e.target.closest('.miw-close')) {
      e.stopPropagation();
      widget.remove();
      return;
    }
    if (e.target.closest('.miw-badge')) {
      if (details.classList.contains('hidden')) details.innerHTML = getDetails(el, formID);
      details.classList.toggle('hidden');
      widget.classList.toggle('miw-open');
    }
  });

  return widget;
}

export default function main(el, formData) {
  loadStyle(`${BLOCK_BASE}blocks/da-marketo/status.css`, () => {
    el.appendChild(createWidget(el, formData['form id']));
  });
}
