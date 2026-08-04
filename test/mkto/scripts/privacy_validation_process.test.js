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

describe('privacy_validation_process.js: fetch_lang_code (MWPW-199375)', () => {
  before(async () => {
    await loadClassicScript('/mkto/scripts/00_config/marketo_form_setup_rules.js');
    await loadClassicScript('/mkto/scripts/30_privacy/privacy_validation_rules.js');
    await loadClassicScript('/mkto/scripts/30_privacy/privacy_validation_process.js');
    // Running the module body exposes window.fetch_lang_code; the trailing
    // wait_for_field_country() call is a no-op here since no .mktoForm exists.
    window.privacyValidation();
  });

  const originalLang = document.documentElement.lang;

  afterEach(() => {
    document.documentElement.lang = originalLang;
    window.mcz_marketoForm_pref = { profile: {} };
  });

  it('exposes fetch_lang_code on window', () => {
    expect(window.fetch_lang_code).to.be.a('function');
  });

  it('prefers the current page locale over a known-visitor prefLanguage', async () => {
    document.documentElement.lang = 'en';
    window.mcz_marketoForm_pref = { profile: { prefLanguage: 'fr_fr' } };

    const result = await window.fetch_lang_code();

    expect(result).to.equal('en_us');
    expect(window.mcz_marketoForm_pref.profile.prefLanguage).to.equal('en_us');
  });

  it('falls back to prefLanguage when the page has no locale signal', async () => {
    document.documentElement.lang = '';
    window.mcz_marketoForm_pref = { profile: { prefLanguage: 'fr_fr' } };

    const result = await window.fetch_lang_code();

    expect(result).to.equal('fr_fr');
  });

  it('still respects an explicit ?lang= URL param over the page locale', async () => {
    document.documentElement.lang = 'en';
    window.mcz_marketoForm_pref = { profile: { prefLanguage: 'fr_fr' } };
    const url = new URL(window.location.href);
    url.searchParams.set('lang', 'ja_jp');
    window.history.replaceState({}, '', url);

    const result = await window.fetch_lang_code();

    window.history.replaceState({}, '', window.location.pathname);
    expect(result).to.equal('ja_jp');
  });
});
