/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Field Preferences
import { mkfC } from './marketo_form_setup_rules.js';

let lastFieldVisibility = '';
let fieldVisibilityCheckInterval;
const setRequired_set = {};
const setRequired_attempts = 30;
const fieldMap = {};
const field_dependance = {};

export function setRequired(fieldName, direction) {
  if (fieldName === '' || fieldName === null || fieldName === undefined) {
    // mkfC.log("setRequired - fieldName is empty");
    return;
  }

  let field_active = false;
  let mktoFormRowInput = document.querySelector(`[name="${fieldName}"]`);
  if (mktoFormRowInput && mktoFormRowInput !== null) {
    field_active = true;
  } else if (fieldMap[fieldName]) {
    fieldName = fieldMap[fieldName];
    mktoFormRowInput = document.querySelector(`[name="${fieldName}"]`);

    if (mktoFormRowInput && mktoFormRowInput !== null) {
      field_active = true;
    }
  }

  if (setRequired_set[fieldName] === undefined) {
    setRequired_set[fieldName] = 0;
  }

  if (field_active) {
    setRequired_set[fieldName] = 0;
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (direction === true) {
      field.classList.remove('mktoValid');
      field.classList.add('mktoRequired');
      field.classList.add('mkto_toggle');
      field.setAttribute('aria-required', 'true');
      field.setAttribute('required', 'true');
      if (field.placeholder && field.placeholder.indexOf('*') === -1) {
        field.placeholder += '*';
      } else {
        const options = field.querySelectorAll("option[value='']");
        if (options && options.length > 0) {
          if (options[0].innerHTML.indexOf('*') === -1) {
            options[0].innerHTML = `${options[0].innerHTML} *`;
          }
        }
      }

      const row = field.closest('.mktoFormRow');
      if (row) {
        row.classList.add('mktoRequiredField');
      }
      const parent = field.closest('.mktoFieldWrap');
      if (parent) {
        parent.classList.add('mktoRequiredField');
      }
    } else {
      field.removeAttribute('required');
      field.classList.add('mktoValid');
      field.classList.remove('mktoRequired');
      field.classList.remove('mktoInvalid');
      field.classList.add('mkto_toggle');
      field.setAttribute('aria-invalid', 'false');
      field.setAttribute('aria-required', 'false');
      if (field.placeholder && field.placeholder.indexOf('*') !== -1) {
        field.placeholder = field.placeholder.replace('*', '');
      } else {
        const options = field.querySelectorAll("option[value='']");
        if (options && options.length > 0) {
          if (options[0].innerHTML.indexOf('*') > -1) {
            options[0].innerHTML = options[0].innerHTML.replace('*', '').trim();
          }
        }
      }
      const row = field.closest('.mktoFormRow');
      if (row) {
        row.classList.remove('mktoRequiredField');
      }
      const parent = field.closest('.mktoFieldWrap');
      if (parent) {
        parent.classList.remove('mktoRequiredField');
      }
    }

    setTimeout(() => {
      const row = field.closest('.mktoFormRow');
      if (row) {
        const mktoInstruction = row.querySelector('.mktoInstruction');
        if (mktoInstruction) {
          mktoInstruction.remove();
          if (field_dependance[fieldName.toLowerCase()]) {
            const fieldDependanceName = field_dependance[fieldName.toLowerCase()];
            const fieldDependanceElement = document.querySelector(
              `.mktoFormRow [name="${fieldDependanceName}"]`,
            );
            if (fieldDependanceElement) {
              if (!fieldDependanceElement.classList.contains('mktoDependant')) {
                fieldDependanceElement.classList.add('mktoDependant');
                fieldDependanceElement.addEventListener('change', () => {
                  updateFieldPreferences();
                });
              }

              const fieldDependanceParent = fieldDependanceElement.closest(
                '.mktoFormRow:not(.mktoHidden)',
              );
              if (fieldDependanceParent) {
                const event = new Event('change', { bubbles: true });
                fieldDependanceElement.dispatchEvent(event);
                for (let i = 0; i < 10; i += 1) {
                  setTimeout(() => {
                    fieldDependanceElement.dispatchEvent(event);
                  }, 100 * i);
                }
              }
            }
          }
        }
      }
    }, 20);
  } else {
    setRequired_set[fieldName] += 1;
    if (setRequired_set[fieldName] < setRequired_attempts) {
      setTimeout(() => {
        setRequired(fieldName, direction);
      }, 30);
    } else {
      // mkfC.log(`setRequired - [${fieldName}] found after ${setRequired_set[fieldName]} attempts.`)
    }
  }
}

function updateFieldPreferences() {
  const mktoFieldPreferences = document.querySelector(
    '.mktoFormRow [name="__mktoFieldPreferences"]',
  );
  const fieldNames = [];
  for (const key in window?.mcz_marketoForm_pref?.field_visibility) {
    if (Object.prototype.hasOwnProperty.call(window?.mcz_marketoForm_pref?.field_visibility, key)) {
      fieldNames.push(key);
    }
  }
  let newFieldPreferences = '';
  if (fieldNames.length > 0) {
    for (let i = 0; i < fieldNames.length; i += 1) {
      const checkDL = window?.mcz_marketoForm_pref?.field_visibility;
      if (checkDL && window?.mcz_marketoForm_pref?.field_visibility?.[fieldNames[i]]) {
        let setting = window?.mcz_marketoForm_pref?.field_visibility?.[fieldNames[i]];
        setting = setting.toLowerCase();
        if (setting === 'visible' || setting === 'show' || setting === 'all') {
          newFieldPreferences += `${fieldNames[i]}#`;
          setRequired(fieldNames[i], false);
        } else if (setting === 'required') {
          newFieldPreferences += `${fieldNames[i]}-required#`;
          setRequired(fieldNames[i], true);
        }
      }
    }
    mktoFieldPreferences.value = newFieldPreferences;
    const event = new Event('change', { bubbles: true });
    mktoFieldPreferences.dispatchEvent(event);
    for (let i = 0; i < 10; i += 1) {
      setTimeout(() => {
        mktoFieldPreferences.dispatchEvent(event);
      }, 100 * i);
    }
  } else {
    setTimeout(updateFieldPreferences, 25);
  }
}

function checkDataLayer() {
  const marketoConfigExists = document.querySelector('.marketo-config') !== null;
  if (!marketoConfigExists && fieldVisibilityCheckInterval) {
    clearInterval(fieldVisibilityCheckInterval);
    mkfC.log('Marketo Config Interface no longer exists. Stopping field visibility check.');
    return;
  }
  const fieldVisibility = window?.mcz_marketoForm_pref?.field_visibility;
  if (fieldVisibility) {
    const currentFieldVisibility = JSON.stringify(fieldVisibility);
    if (currentFieldVisibility !== lastFieldVisibility) {
      lastFieldVisibility = currentFieldVisibility;
      updateFieldPreferences();
    }
  }
}

async function fieldPrefs_wait_fieldPreferences() {
  let formObservMKTO = false;
  const sessionAttributesQS_fld = document.querySelector('[name="sessionAttributesQS"]');
  if (document.querySelectorAll('.observMKTO').length > 0) {
    if (sessionAttributesQS_fld !== null) {
      formObservMKTO = true;
    }
  }
  if (formObservMKTO) {
    sessionAttributesQS_fld.name = '__mktoFieldPreferences';
    sessionAttributesQS_fld.id = '__mktoFieldPreferences';
    setTimeout(updateFieldPreferences, 25);

    if (document.querySelector('.marketo-config')) {
      mkfC.log('Marketo Config Interface Found');
      fieldVisibilityCheckInterval = setInterval(checkDataLayer, 500);
    }
  } else if (window?.mcz_marketoForm_pref?.profile?.known_visitor) {
    // mkfC.log("Known Visitor - fieldPrefs_wait_fieldPreferences");
  } else {
    setTimeout(fieldPrefs_wait_fieldPreferences, 20);
  }
}

export function field_pref() {
  mkfC.log('Field Preferences - Triggered');
  if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
    for (const key in window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
      if (Object.prototype.hasOwnProperty.call(window?.mcz_marketoForm_pref?.value_setup?.field_mapping, key)) {
        fieldMap[key.toLowerCase()] = window?.mcz_marketoForm_pref?.value_setup?.field_mapping[key];
      }
    }
  }
  if (window?.mcz_marketoForm_pref?.value_setup?.field_dependance) {
    for (const key in window?.mcz_marketoForm_pref?.value_setup?.field_dependance) {
      if (Object.prototype.hasOwnProperty.call(window?.mcz_marketoForm_pref?.value_setup?.field_dependance, key)) {
        field_dependance[key.toLowerCase()] = window?.mcz_marketoForm_pref?.value_setup?.field_dependance[key];
      }
    }
  }
  //
  //
  //

  fieldPrefs_wait_fieldPreferences();
}

export default async function init() {
  mkfC.log('Field Preferences - Begin');

  mkfC.log('Field Preferences - End');
}
