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

// date_of_incorporation/total_funding_raised (MWPW-206485): flex templates let
// the author's field_visibility win over the template default, which only
// fills in fields the author left unset (MWPW-198019).
describe('global.js: mkto_checkTemplate - authored field_visibility rendered for flex templates', () => {
  before(async () => {
    const stubForm = document.createElement('form');
    stubForm.className = 'mktoForm';
    document.body.appendChild(stubForm);

    await loadClassicScript('/mkto/scripts/00_config/marketo_form_setup_rules.js');
    await loadClassicScript('/mkto/scripts/90_build/marketo_form_setup_process.js');
    await loadClassicScript('/mkto/scripts/20_template_manager/template_rules.js');
    await loadClassicScript('/mkto/scripts/90_build/global.js');
  });

  const runWithAuthored = (authoredFieldVisibility) => {
    window.mcz_marketoForm_pref = {
      program: { id: '' },
      form: { template: 'flex_contact', field_visibility: {} },
      field_visibility: { ...authoredFieldVisibility },
    };
    window.mkto_checkTemplate('DataLayer');
    return window.mcz_marketoForm_pref.form.field_visibility;
  };

  it('renders authored "visible" for fields with no template option other than hidden', () => {
    const rendered = runWithAuthored({
      date_of_incorporation: 'visible',
      total_funding_raised: 'visible',
    });
    expect(rendered.date_of_incorporation).to.equal('visible');
    expect(rendered.total_funding_raised).to.equal('visible');
  });

  it('renders authored "required"', () => {
    const rendered = runWithAuthored({
      date_of_incorporation: 'required',
      total_funding_raised: 'required',
    });
    expect(rendered.date_of_incorporation).to.equal('required');
    expect(rendered.total_funding_raised).to.equal('required');
  });

  it('falls back to the template default ("hidden") when the author leaves the field unset', () => {
    const rendered = runWithAuthored({});
    expect(rendered.date_of_incorporation).to.equal('hidden');
    expect(rendered.total_funding_raised).to.equal('hidden');
  });
});
