import { expect } from '@esm-bundle/chai';

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function renderQueryControls(query) {
  const url = new URL('/landingPage/formContent', window.location.origin);
  url.searchParams.set('isPreview', '1');
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);

  window.templateRules = [{ flex_contact: {} }, { flex_event: {} }];
  window.translateFormElems = { lang: { en_us: {}, fr_fr: {} } };
  window.mcz_marketoForm_pref = {
    form: { template: 'flex_contact' },
    profile: { prefLanguage: 'en_us' },
    program: { subscription: {} },
  };
  document.body.replaceChildren();
  document.head.appendChild(document.createElement('style'));

  const originalSetTimeout = window.setTimeout;
  window.setTimeout = (callback, delay) => {
    if (delay === 1000) callback();
    return 0;
  };
  try {
    window.mktoCss_LP();
  } finally {
    window.setTimeout = originalSetTimeout;
  }

  return {
    lang: document.getElementById('form.lang').value,
    template: document.getElementById('form.template').value,
  };
}

describe('template_manager URL query parameters', () => {
  before(async () => {
    window.form_dynamics = {};
    await loadClassicScript('/mkto/scripts/20_template_manager/template_manager.js');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    document.body.replaceChildren();
  });

  it('uses supported lang and template parameter values', () => {
    const selected = renderQueryControls({ lang: 'fr_fr', template: 'flex_event' });
    expect(selected.lang).to.equal('fr_fr');
    expect(selected.template).to.equal('flex_event');
  });

  it('falls back to supported defaults for unsupported parameter values', () => {
    const selected = renderQueryControls({
      lang: '<script>alert(1)</script>',
      template: '<img src=x onerror=alert(1)>',
    });
    expect(selected.lang).to.equal('en_us');
    expect(selected.template).to.equal('flex_contact');
  });
});
