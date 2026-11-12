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

// Minimal stand-in for the form element object returned by the Marketo SDK's
// getFormElem(). It mimics the jQuery chain setRequired relies on
// (find -> filter -> data) so the test proves setRequired routes the descriptor
// lookup through the form's own instance rather than a page-level window.jQuery.
function makeFormElemStub(formEl, descriptorMap) {
  function wrap(elements) {
    return {
      find(selector) {
        const found = [];
        elements.forEach((el) => {
          el.querySelectorAll(selector).forEach((m) => found.push(m));
        });
        return wrap(found);
      },
      filter(fn) {
        return wrap(elements.filter((el, i) => fn.call(el, i, el)));
      },
      data(key) {
        const first = elements[0];
        if (!first) return undefined;
        const store = descriptorMap.get(first);
        return store ? store[key] : undefined;
      },
    };
  }
  return wrap([formEl]);
}

describe('field_preferences.js: setRequired descriptor path (MWPW-204804)', () => {
  before(async () => {
    await loadClassicScript('/mkto/scripts/00_config/marketo_form_setup_rules.js');
    await loadClassicScript('/mkto/scripts/40_field_management/field_preferences.js');
  });

  let descriptorMap;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="mktoForm_123" class="mktoForm">
        <div class="mktoFormRow">
          <div class="mktoFieldDescriptor">
            <div class="mktoFieldWrap">
              <input name="Phone" type="tel" class="mktoValid" />
            </div>
          </div>
        </div>
      </form>`;

    const formEl = document.querySelector('#mktoForm_123');
    const descriptorEl = document.querySelector('.mktoFieldDescriptor');
    descriptorMap = new Map();
    descriptorMap.set(descriptorEl, { mktoFieldDescriptor: { required: false } });

    window.getMktoFormID = () => '123';
    window.MktoForms2 = {
      getForm: () => ({
        getFormElem: () => makeFormElemStub(formEl, descriptorMap),
      }),
    };

    // field_pref() defines window.setRequired (and starts its own polling loop,
    // which is harmless here); call it once to obtain the function under test.
    window.field_pref();
  });

  it('sets the native descriptor required=true via the form instance', () => {
    window.setRequired('Phone', true);
    const descriptorEl = document.querySelector('.mktoFieldDescriptor');
    expect(descriptorMap.get(descriptorEl).mktoFieldDescriptor.required).to.equal(true);
  });

  it('also applies the required class and aria-required attribute', () => {
    window.setRequired('Phone', true);
    const field = document.querySelector('[name="Phone"]');
    expect(field.classList.contains('mktoRequired')).to.equal(true);
    expect(field.getAttribute('aria-required')).to.equal('true');
  });

  it('clears the native descriptor required when direction is false (only if da-marketo set it)', () => {
    window.setRequired('Phone', true);
    window.setRequired('Phone', false);
    const descriptorEl = document.querySelector('.mktoFieldDescriptor');
    expect(descriptorMap.get(descriptorEl).mktoFieldDescriptor.required).to.equal(false);
  });

  // Regression guard: a field Marketo itself marks required (descriptor.required
  // already true, never flagged by da-marketo) must keep its native required
  // state when the config marks it merely "visible" -> setRequired(name, false).
  it('does not clear native required on a field da-marketo never made required', () => {
    const descriptorEl = document.querySelector('.mktoFieldDescriptor');
    descriptorMap.get(descriptorEl).mktoFieldDescriptor.required = true;
    window.setRequired('Phone', false);
    expect(descriptorMap.get(descriptorEl).mktoFieldDescriptor.required).to.equal(true);
  });
});
