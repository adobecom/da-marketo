import { LIBS } from '../../scripts/libs.js';
import { createTag } from '../../utils/utils.js';

const { loadStyle, getMetadata } = await import(`${LIBS}/utils/utils.js`);

const BLOCK_BASE = new URL('../../', import.meta.url).href;

function createWidget(el, formID) {
  const { template } = window.mcz_marketoForm_pref.form;
  const successType = window.mcz_marketoForm_pref.form.success.type;
  const successContent = window.mcz_marketoForm_pref.form.success.content;
  let multiStep = null;
  if (el.classList.contains('multi-step')) {
    multiStep = el.classList.contains('multi-3') ? '3-step' : '2-step';
  }
  const searchParams = new URLSearchParams(window.location.search);
  const marketoLibs = searchParams.get('marketolibs') || getMetadata('marketo-libs');
  const widget = createTag('div', { class: 'marketo-info-widget' });
  widget.innerHTML = `
    <span class="miw-badge"><span class="miw-icon"></span>Marketo</span>
    <div class="miw-details hidden">
      <button class="miw-close" aria-label="Close"></button>
      <p>Form ID: <span>${formID || '(not set)'}</span></p>
      <p>Template: <span>${template || '(not set)'}</span></p>
      <p>Multi-step: <span>${multiStep || '(not set)'}</span></p>
      <p>Success type: <span>${successType || '(not set)'}</span></p>
      <p>Success content: <span>${successContent || '(not set)'}</span></p>
      <p>marketolibs: <span>${marketoLibs || '(not set)'}</span></p>
    </div>
  `;

  widget.querySelector('.miw-badge').addEventListener('click', () => {
    widget.querySelector('.miw-details').classList.toggle('hidden');
    widget.classList.toggle('miw-open');
  });

  widget.querySelector('.miw-close').addEventListener('click', (e) => {
    e.stopPropagation();
    widget.remove();
  });

  return widget;
}

export default function main(el, formData) {
  loadStyle(`${BLOCK_BASE}blocks/da-marketo/status.css`);

  const formID = formData['form id'];
  const refresh = () => el.querySelector('.marketo-info-widget')?.replaceWith(createWidget(el, formID));

  new MutationObserver(refresh).observe(el, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('mktoSubmit', refresh);

  el.appendChild(createWidget(el, formID));
}
