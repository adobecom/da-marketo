import { LIBS } from '../../constants.js';
import { consumeReminder } from './consent-reminder.js';

const { createTag, loadStyle } = await import(`${LIBS}/utils/utils.js`);

export default function init() {
  const main = document.querySelector('main');
  if (!main || document.querySelector('.marketo-consent-banner') || !consumeReminder()) return;

  const banner = createTag('aside', {
    class: 'marketo-consent-banner',
    lang: 'de',
    role: 'status',
  });
  const message = createTag('p');
  message.textContent = 'Bitte pr\u00fcfen Sie Ihr E-Mail-Postfach und best\u00e4tigen Sie Ihre Anmeldung \u00fcber den Link in unserer E-Mail.';
  const close = createTag('button', {
    class: 'marketo-consent-banner-close',
    type: 'button',
    'aria-label': 'Hinweis schlie\u00dfen',
  });
  close.textContent = '\u00d7';
  close.addEventListener('click', () => banner.remove());
  banner.append(message, close);
  main.prepend(banner);

  loadStyle(new URL('./marketo-consent-banner.css', import.meta.url).href, (status) => {
    if (status !== 'error') return;
    banner.remove();
    window.lana?.log('Could not load Marketo consent banner styles', { tags: 'marketo', severity: 'w' });
  });
  window.addEventListener('pagehide', () => banner.remove(), { once: true });
}
