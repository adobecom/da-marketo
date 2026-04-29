/* eslint-disable import/prefer-default-export */

const BASE = new URL('../', import.meta.url).href.replace(/\/$/, '');
const MARKETO_BLOCKS = ['da-marketo'];

function decorateMarketo(area = document) {
  area.querySelectorAll('.marketo').forEach((el) => el.classList.replace('marketo', 'da-marketo'));
}

export function register({ getConfig, setConfig }) {
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
