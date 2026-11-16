import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { register } from '../../../mkto/libs.js';
import { updateConsentReminder } from '../../../mkto/features/marketo-consent-banner/consent-reminder.js';
import initBanner from '../../../mkto/features/marketo-consent-banner/marketo-consent-banner.js';
import { formSuccess, formSubmit, loadMarketo } from '../../../mkto/blocks/da-marketo/da-marketo.js';
import waitForElement from '../../helpers/waitfor.js';

const KEY = 'milo:marketo-consent-reminder';
const eligible = { Country: 'DE', mktoKoreaPrivacyThirdParty: 'yes' };
const selector = '.marketo-consent-banner';
const styles = 'link[href$="/marketo-consent-banner.css"]';
const formData = { 'form.success.type': 'redirect' };

describe('Marketo consent reminder', () => {
  let original;
  const destination = () => `${window.location.origin}/thank-you`;
  const pending = (overrides = {}) => ({
    version: 1,
    destination: `${window.location.origin}${window.location.pathname}`,
    createdAt: Date.now(),
    ...overrides,
  });
  const store = (value = pending()) => sessionStorage.setItem(KEY, JSON.stringify(value));

  beforeEach(() => {
    original = {
      href: window.location.href,
      lang: document.documentElement.lang,
      milo: window.milo,
      forms: window.MktoForms2,
      prefs: window.mcz_marketoForm_pref,
      validUrl: window.MktoFormsValidUrl,
      lana: window.lana,
      submitted: window.mktoSubmitted,
    };
    window.lana = { log: sinon.spy() };
    window.mcz_marketoForm_pref = { form: { success: { type: 'redirect', content: destination() } } };
    window.MktoFormsValidUrl = (url) => {
      try {
        return !!new URL(url);
      } catch {
        return false;
      }
    };
    document.body.innerHTML = '<main><p id="content">Thank you</p></main>';
    sessionStorage.removeItem(KEY);
  });

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
    sinon.restore();
    window.history.replaceState({}, '', original.href);
    document.documentElement.lang = original.lang;
    window.milo = original.milo;
    window.MktoForms2 = original.forms;
    window.mcz_marketoForm_pref = original.prefs;
    window.MktoFormsValidUrl = original.validUrl;
    window.lana = original.lana;
    window.mktoSubmitted = original.submitted;
    sessionStorage.removeItem(KEY);
    document.querySelectorAll(styles).forEach((link) => link.remove());
    document.body.innerHTML = '';
  });

  describe('Forms2 handoff', () => {
    let clock;
    let block;
    let form;

    beforeEach(() => {
      clock = sinon.useFakeTimers({ now: Date.now() });
      block = document.createElement('div');
      block.className = 'marketo';
      form = document.createElement('form');
      block.append(form);
      document.querySelector('main').append(block);
    });

    afterEach(() => clock.restore());

    it('forwards the owning form snapshot and queues state before mktoSubmit', async () => {
      let success;
      const unrelatedSuccess = sinon.spy();
      const makeForm = (element, onSuccess) => ({
        getFormElem: () => ({ get: () => element }),
        onValidate: () => {},
        onSubmit: () => {},
        onSuccess,
      });
      window.MktoForms2 = {
        whenReady: (callback) => {
          callback(makeForm(document.createElement('form'), unrelatedSuccess));
          callback(makeForm(form, (callbackSuccess) => { success = callbackSuccess; }));
        },
      };
      await loadMarketo(block, formData);
      expect(unrelatedSuccess.called).to.be.false;
      expect(sessionStorage.getItem(KEY)).to.be.null;
      let stateAtEvent;
      const onSubmit = () => { stateAtEvent = JSON.parse(sessionStorage.getItem(KEY)); };
      window.addEventListener('mktoSubmit', onSubmit, { once: true });

      expect(success({ ...eligible, Email: 'not-stored@example.com' }, 'https://other.example/unused')).to.be.true;

      expect(stateAtEvent).to.deep.equal({
        version: 1,
        destination: destination(),
        createdAt: Date.now(),
      });
    });

    it('uses the runtime destination rather than stale block config or Forms2 follow-up', () => {
      const configured = `${destination()}?keep=1#thanks`;
      window.mcz_marketoForm_pref.form.success.content = configured;
      expect(formSuccess(form, { ...formData, 'form.success.content': '/old' }, eligible)).to.be.true;
      expect(JSON.parse(sessionStorage.getItem(KEY)).destination).to.equal(destination());
      expect(window.mcz_marketoForm_pref.form.success.content).to.equal(configured);
      expect(window.location.href).to.equal(original.href);
    });

    ['msg', 'message'].forEach((type) => {
      it(`queues for a ${type} runtime type when the controller will redirect to valid content`, () => {
        window.mcz_marketoForm_pref.form.success = { type, content: ` ${destination()} ` };
        expect(formSuccess(form, formData, eligible)).to.be.true;
        expect(JSON.parse(sessionStorage.getItem(KEY)).destination).to.equal(destination());
        expect(window.location.href).to.equal(original.href);
      });
    });

    it('does not queue for Adobe Connect even when content is a valid URL', () => {
      window.mcz_marketoForm_pref.form.success.type = 'adobe_connect';
      formSuccess(form, formData, eligible);
      expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    [
      { Country: 'US', mktoKoreaPrivacyThirdParty: 'yes' },
      { Country: 'DE', mktoKoreaPrivacyThirdParty: 'no' },
      { Country: 'DE', mktoKoreaPrivacyThirdParty: 'false' },
      { Country: 'DE', mktoKoreaPrivacyThirdParty: true },
      { Country: 'DE' },
      undefined,
    ].forEach((values) => {
      it(`clears old intent for ineligible success: ${JSON.stringify(values)}`, () => {
        store();
        formSuccess(form, formData, values);
        expect(sessionStorage.getItem(KEY)).to.be.null;
      });
    });

    it('clears old intent when another submission starts', () => {
      store();
      formSubmit(form);
      expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    it('does not queue for a runtime message or a missing configured destination', () => {
      window.mcz_marketoForm_pref.form.success = { type: 'message', content: 'Thanks' };
      formSuccess(form, formData, eligible);
      expect(sessionStorage.getItem(KEY)).to.be.null;
      window.mcz_marketoForm_pref.form.success = { type: 'redirect', content: '' };
      formSuccess(form, formData, eligible);
      expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    it('does not queue for section or IMS outcomes', () => {
      ['section', 'ims'].forEach((type) => {
        store();
        formSuccess(form, { 'form.success.type': type }, eligible);
        expect(sessionStorage.getItem(KEY)).to.be.null;
      });
    });

    it('preserves modal close behavior without queuing a reminder', () => {
      const modal = document.createElement('div');
      modal.className = 'dialog-modal';
      const close = document.createElement('button');
      close.className = 'dialog-close';
      const clicked = sinon.spy();
      close.addEventListener('click', clicked);
      block.replaceWith(modal);
      modal.append(close, block);
      expect(formSuccess(form, formData, eligible)).to.be.false;
      expect(clicked.calledOnce).to.be.true;
      expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    it('preserves success and mktoSubmit when storage is blocked', () => {
      sinon.stub(Storage.prototype, 'setItem').throws(new Error('blocked'));
      const submitted = sinon.spy();
      window.addEventListener('mktoSubmit', submitted, { once: true });
      expect(formSuccess(form, formData, eligible)).to.be.true;
      expect(submitted.calledOnce).to.be.true;
      expect(block.classList.contains('success')).to.be.true;
      expect(window.lana.log.calledWith('Could not update Marketo consent reminder')).to.be.true;
    });
  });

  describe('destination and state validation', () => {
    it('rejects cross-origin, same-path and non-URL outcomes', () => {
      [
        'https://other.example/thank-you',
        window.location.href,
        'Thank you for submitting',
      ].forEach((url) => {
        store();
        updateConsentReminder(eligible, url);
        expect(sessionStorage.getItem(KEY)).to.be.null;
      });
      expect(window.lana.log.called).to.be.true;
    });

    it('retains a valid reminder on intermediate pages', () => {
      store(pending({ destination: destination() }));
      initBanner();
      expect(document.querySelector(selector)).to.be.null;
      expect(sessionStorage.getItem(KEY)).to.not.be.null;
      expect(document.querySelector(styles)).to.be.null;
    });

    it('discards malformed, expired, future-dated and unsupported state without changing content', () => {
      [
        '{',
        'null',
        JSON.stringify(pending({ createdAt: Date.now() - 600001 })),
        JSON.stringify(pending({ createdAt: Date.now() + 10000 })),
        JSON.stringify(pending({ version: 2 })),
        JSON.stringify(pending({ destination: 42 })),
      ].forEach((raw) => {
        sessionStorage.setItem(KEY, raw);
        initBanner();
        expect(sessionStorage.getItem(KEY)).to.be.null;
        expect(document.querySelector(selector)).to.be.null;
        expect(document.querySelector('#content').textContent).to.equal('Thank you');
        expect(document.querySelector(styles)).to.be.null;
      });
    });

    it('leaves content intact and logs blocked reads', () => {
      sinon.stub(Storage.prototype, 'getItem').throws(new Error('blocked'));
      initBanner();
      expect(document.querySelector(selector)).to.be.null;
      expect(document.querySelector('#content')).to.exist;
      expect(window.lana.log.calledWith('Could not read Marketo consent reminder')).to.be.true;
    });
  });

  describe('receiver', () => {
    it('renders the German reminder on an English page once, with an accessible dismissal', () => {
      document.documentElement.lang = 'en';
      store();
      initBanner();
      const banner = document.querySelector(selector);
      expect(banner.lang).to.equal('de');
      expect(banner.getAttribute('role')).to.equal('status');
      expect(banner.querySelector('p').textContent).to.equal(
        'Bitte pr\u00fcfen Sie Ihr E-Mail-Postfach und best\u00e4tigen Sie Ihre Anmeldung \u00fcber den Link in unserer E-Mail.',
      );
      expect(document.querySelector('main').firstElementChild).to.equal(banner);
      expect(sessionStorage.getItem(KEY)).to.be.null;
      initBanner();
      expect(document.querySelectorAll(selector)).to.have.length(1);
      expect(banner.querySelector('button').getAttribute('aria-label')).to.equal('Hinweis schlie\u00dfen');
      banner.querySelector('button').click();
      initBanner();
      expect(document.querySelector(selector)).to.be.null;
    });

    it('removes the reminder before BFCache restoration', () => {
      store();
      initBanner();
      window.dispatchEvent(new Event('pagehide'));
      expect(document.querySelector(selector)).to.be.null;
      initBanner();
      expect(document.querySelector(selector)).to.be.null;
    });

    it('removes the reminder and logs a stylesheet failure', () => {
      store();
      initBanner();
      document.querySelector(styles).dispatchEvent(new Event('error'));
      expect(document.querySelector(selector)).to.be.null;
      expect(document.querySelector('#content')).to.exist;
      expect(window.lana.log.calledWith('Could not load Marketo consent banner styles')).to.be.true;
    });

    it('loads after Milo main deferred readiness even on a page without a form', async () => {
      let resolveDeferred;
      window.milo = { deferredPromise: new Promise((resolve) => { resolveDeferred = resolve; }) };
      store();
      register({ getConfig: () => ({}) });
      expect(document.querySelector(selector)).to.be.null;
      resolveDeferred();
      const banner = await waitForElement(selector);
      expect(banner).to.exist;
      expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    it('does not render without pending state and tolerates blocked loader storage', async () => {
      window.milo = { deferredPromise: Promise.resolve() };
      register({ getConfig: () => ({}) });
      await Promise.resolve();
      expect(document.querySelector(selector)).to.be.null;
      expect(document.querySelector(styles)).to.be.null;
      sinon.stub(Storage.prototype, 'getItem').throws(new Error('blocked'));
      expect(() => register({ getConfig: () => ({}) })).to.not.throw();
      expect(window.lana.log.calledWith('Could not read Marketo consent reminder')).to.be.true;
    });
  });
});
