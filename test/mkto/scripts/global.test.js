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

describe('global.js: mkto_checkTemplate', () => {
  before(async () => {
    const stubForm = document.createElement('form');
    stubForm.className = 'mktoForm';
    document.body.appendChild(stubForm);

    await loadClassicScript('/mkto/scripts/00_config/marketo_form_setup_rules.js');
    await loadClassicScript('/mkto/scripts/90_build/marketo_form_setup_process.js');
    await loadClassicScript('/mkto/scripts/20_template_manager/template_rules.js');
    await loadClassicScript('/mkto/scripts/90_build/global.js');
  });

  const basePref = () => ({
    program: { id: '' },
    form: { template: 'request_for_information' },
  });

  it('exposes mkto_checkTemplate on window', () => {
    expect(window.mkto_checkTemplate).to.be.a('function');
  });

  it('hides products when a POI is set and no field_filters exist yet, without throwing', () => {
    const pref = basePref();
    window.mcz_marketoForm_pref = { ...pref, program: { ...pref.program, poi: 'adobe_journey_optimizer' } };
    expect(() => window.mkto_checkTemplate('DataLayer')).to.not.throw();
    expect(window.mcz_marketoForm_pref.field_filters?.products).to.equal('hidden');
  });

  // Regression guard for MWPW-200958: the 07-09 flex-template guard
  // (`if (!field_filters?.products)`) silently skipped the POI-hide override
  // whenever an authored products filter was already present, so POI arriving
  // via query string or hash stopped hiding an already-visible field.
  it('overrides an already-authored products filter when POI is set via QS/hash', () => {
    const pref = basePref();
    window.mcz_marketoForm_pref = {
      ...pref,
      program: { ...pref.program, poi: 'adobe_journey_optimizer' },
      field_filters: { products: 'POI-Combined' },
      flags: { poiSetByQS: true },
    };
    window.mkto_checkTemplate('DataLayer');
    expect(window.mcz_marketoForm_pref.field_filters.products).to.equal('hidden');
  });
});
