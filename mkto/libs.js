/* eslint-disable import/prefer-default-export */

const branch = new URLSearchParams(window.location.search).get('marketolibs');
const BASE = branch === 'local' ? 'http://localhost:6586/mkto' : new URL('./', import.meta.url).href.replace(/\/$/, '');
const MARKETO_BLOCKS = ['da-marketo', 'da-marketo-config'];

function decorateMarketo(area = document) {
  area.querySelectorAll('.marketo').forEach((el) => el.classList.replace('marketo', 'da-marketo'));
  area.querySelectorAll('.marketo-config').forEach((el) => el.classList.replace('marketo-config', 'da-marketo-config'));
}

export function register({ getConfig, setConfig }) {
  decorateMarketo(document);
  const config = getConfig();
  setConfig({
    ...config,
    externalLibs: [...(config.externalLibs ?? []), { base: BASE, blocks: MARKETO_BLOCKS }],
    decorateArea: (area = document) => {
      decorateMarketo(area);
      config.decorateArea?.(area);
    },
  });
}
