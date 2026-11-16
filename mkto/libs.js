/* eslint-disable import/prefer-default-export */

const branch = new URLSearchParams(window.location.search).get('marketolibs');
const BASE = branch === 'local' ? 'http://localhost:6586/mkto' : new URL('./', import.meta.url).href.replace(/\/$/, '');
const MARKETO_BLOCKS = ['da-marketo', 'da-marketo-config'];

function loadConsentReminder() {
  const load = () => import(`${BASE}/features/marketo-consent-banner/marketo-consent-banner.js`)
    .then(({ default: init }) => init())
    .catch(() => {
      window.lana?.log('Could not load Marketo consent banner', { tags: 'marketo', severity: 'w' });
    });
  try {
    if (!sessionStorage.getItem('milo:marketo-consent-reminder')) return;
    if (window.milo?.deferredPromise) {
      window.milo.deferredPromise.then(load).catch(() => {
        window.lana?.log('Could not initialize Marketo consent banner', { tags: 'marketo', severity: 'w' });
      });
    } else {
      document.addEventListener('milo:deferred', load, { once: true });
    }
  } catch {
    window.lana?.log('Could not read Marketo consent reminder', { tags: 'marketo', severity: 'w' });
  }
}

function decorateMarketo(area = document) {
  area.querySelectorAll('.marketo').forEach((el) => el.classList.replace('marketo', 'da-marketo'));
  area.querySelectorAll('.marketo-config').forEach((el) => el.classList.replace('marketo-config', 'da-marketo-config'));
}

export function register({ getConfig }) {
  decorateMarketo(document);
  const config = getConfig();
  const previousDecorateArea = config.decorateArea;

  config.externalLibs = [
    ...(config.externalLibs ?? []),
    { base: BASE, blocks: MARKETO_BLOCKS },
  ];
  config.decorateArea = (area = document) => {
    decorateMarketo(area);
    previousDecorateArea?.(area);
  };
  loadConsentReminder();
}
