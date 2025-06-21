/* eslint-disable max-len */
// Cleaning and Validation
import { mkfC } from './marketo_form_setup_rules.js';
import { getMktoFormID } from './global.js';
import { uFFld } from './marketo_form_setup_process.js';
import { setRequired } from './field_preferences.js';
import { aaInteraction } from './adobe_analytics.js';

let renderingReady = false;
const translateState = {};

let firstrun = true;

const lblRendering = { temp: 'temp' };
let normalizeMktoStylesRun = 0;
const checkFormMsgsRateLimit = 500;
let checkFormMsgsLastCall = 0;
let checkFormMsgsNow = new Date().getTime();
let checkFormMsgsPending = false;
let nStylesOn = false;
let isRequestedAgain = false;
let chkFrmInt;
let RuleLegendTry = 0;
const handleFieldRuleLegendMax = 30;

function handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset) {
  mktoFormRow.classList.add('mktoHidden');
  mktoFormRow.classList.add('mktoFieldRuleLegend');
  mktoFormRowLegend.classList.add('mktoRuleLegend');

  const mktoHtmlTexts = mktoFieldset.querySelectorAll('.mktoHtmlText:not(.mktoHidden)');

  mktoHtmlTexts.forEach((textElem, index) => {
    let mktohandleFieldRuleLegend = mktoFormRowLegend.querySelector(
      '.mktohandleFieldRuleLegend',
    );

    if (index !== 0) {
      return;
    }

    if (!mktohandleFieldRuleLegend) {
      mktohandleFieldRuleLegend = document.createElement('span');
      mktohandleFieldRuleLegend.classList.add('mktohandleFieldRuleLegend');
      mktoFormRowLegend.appendChild(mktohandleFieldRuleLegend);
    } else {
      return;
    }

    const reference = textElem.innerText.toLowerCase().split('field_rule')[1].trim();

    const [fieldname, fieldValues] = mktoFormRowLegend.innerText
      .trim()
      .split('=')
      .map((str) => str.trim());
    if (!fieldname || !fieldValues) return;

    const mktoSelect = mktoForm.querySelector(`select[name='${fieldname}']`);
    const mktoSelectOption = mktoForm.querySelector(`select[name='${fieldname}'] option`);
    if (!mktoSelect || !mktoSelectOption) {
      RuleLegendTry += 1;
      if (RuleLegendTry < handleFieldRuleLegendMax) {
        setTimeout(() => {
          handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset);
        }, 25);
        return;
      }
      mkfC.log(
        `handleFieldRuleLegend >> fieldname not found after ${RuleLegendTry
        } attempts.`,
      );
      return;
    }

    const valueset = fieldValues.toLowerCase();

    if (typeof setRequired !== 'function') {
      return;
    }

    let mktoFormRowTop = mktoForm.querySelector(
      `.mktoFormRowTop[data-handleFieldRuleLegend='${fieldname}']`,
    );
    if (mktoFormRowTop === null) {
      mktoFormRowTop = mktoSelect.closest(
        '.mktoFormRowTop:not(.mktohandleFieldRuleLegend)',
      );
    }
    if (mktoFormRowTop === null) {
      return;
    }

    mktoFormRowTop.setAttribute('data-handleFieldRuleLegend', fieldname);
    mktohandleFieldRuleLegend.setAttribute('data-handleFieldRuleLegend', fieldname);

    if (valueset === 'none') {
      setRequired(fieldname, false);

      if (mktoFormRowTop) {
        const mktoFieldDescriptor = mktoFormRowTop.querySelectorAll('.mktoFieldDescriptor');
        if (mktoFieldDescriptor) {
          mktoFieldDescriptor.forEach((descriptor) => {
            descriptor.classList.add('mktoFieldDescriptor__hidden');
            descriptor.classList.remove('mktoFieldDescriptor');
          });
        }
        mktoFormRowTop.classList.add('mktoHidden', 'mktohandleFieldRuleLegend');
      }
      return;
    }

    const startingOption = [];
    let newOptions = [];
    let otherOption = [];
    if (
      mktoFormRowTop
            && mktoFormRowTop.classList.contains('mktohandleFieldRuleLegend')
    ) {
      setRequired(fieldname, true);

      const mktoFieldDescriptor = mktoFormRowTop.querySelectorAll(
        '.mktoFieldDescriptor__hidden',
      );
      if (mktoFieldDescriptor) {
        mktoFieldDescriptor.forEach((descriptor) => {
          descriptor.classList.add('mktoFieldDescriptor');
          descriptor.classList.remove('mktoFieldDescriptor__hidden');
        });
      }

      mktoFormRowTop.classList.remove('mktoHidden', 'mktohandleFieldRuleLegend');
    }

    if (mktoFormRowTop) {
      setTimeout(() => {
        const mktoFieldplaceHolder = mktoFormRowTop.querySelectorAll(
          'select.mktoUpdated, input.mktoUpdated, textarea.mktoUpdated',
        );
        if (mktoFieldplaceHolder) {
          mktoFieldplaceHolder.forEach((holder) => {
            holder.classList.remove('mktoUpdated');
          });
        }
      }, 100);
    }

    if (valueset === 'all') {
      // lets clean the select
      const emptyOption = mktoSelect.querySelector("option[value='']");
      if (emptyOption) {
        mktoSelect.removeChild(emptyOption);
        mktoSelect.prepend(emptyOption);
      }
      otherOption = mktoSelect.querySelector(
        "option[value='other'], option[value='Other'], option[value='OTHER']",
      );
      if (otherOption) {
        mktoSelect.removeChild(otherOption);
        mktoSelect.appendChild(otherOption);
      }
      return;
    }

    let mktoSelectClone = document.querySelector(`select[name='${fieldname}_clone']`);
    if (!mktoSelectClone) {
      mktoSelectClone = mktoSelect.cloneNode(true);
      mktoSelectClone.style = 'display:none;position:absolute;top:-1000px;left:-1000px;';
      for (let i = mktoSelectClone.attributes.length - 1; i >= 0; i -= 1) {
        const attribute = mktoSelectClone.attributes[i];
        if (
          attribute.name !== 'name'
                && attribute.name !== 'id'
                && attribute.name !== 'style'
        ) {
          mktoSelectClone.removeAttribute(attribute.name);
        }
      }
      mktoSelectClone.id = `${mktoSelect.getAttribute('name')}_clone`;
      mktoSelectClone.name = `${mktoSelect.getAttribute('name')}_clone`;
      mktoForm.parentNode.insertBefore(mktoSelectClone, mktoForm.nextSibling);
    }

    const valuesetArray = valueset.split('|');
    const valuesetArray1 = [];
    const valuesetArray2 = [];
    valuesetArray.forEach((value) => {
      if (value.includes(':')) {
        const valueArray = value.split(':');
        if (valueArray.length > 1) {
          if (valueArray[0] === '1') {
            valuesetArray1.push(valueArray[1].trim().toLowerCase());
          }
          if (valueArray[0] === '2') {
            valuesetArray2.push(valueArray[1].trim().toLowerCase());
          }
        }
      } else {
        valuesetArray1.push(value.trim().toLowerCase());
      }
    });

    function addOption(option) {
      if (option) {
        const optionValue = option.value;
        if (
          optionValue.trim().toLowerCase() === ''
                || optionValue === null
                || optionValue === '_'
        ) {
          startingOption.push(option);
        } else if (optionValue.trim().toLowerCase() === 'other') {
          otherOption.push(option);
        } else {
          newOptions.push(option);
        }
      }
    }

    const seenOptions = [];
    const observedOptions = [];
    const backValue = mktoSelect.selectedIndex > -1
      ? mktoSelect.options[mktoSelect.selectedIndex].value
      : '';

    mktoSelectClone.querySelectorAll('option').forEach((option) => {
      const optionValue = option.value.toLowerCase().trim();
      const optionValueText = option.innerText.toLowerCase().trim();
      const combinedValue = `${optionValue}:${optionValueText}`;

      if (optionValue === '' || optionValue === null || optionValue === '_') {
        addOption(option.cloneNode(true));
      } else if (
        reference === 'keep'
              && valuesetArray1.includes(optionValue)
              && !seenOptions.includes(optionValue)
      ) {
        if (!observedOptions.includes(combinedValue)) {
          addOption(option.cloneNode(true));
          observedOptions.push(combinedValue);
        }
      } else if (
        reference === 'keep'
              && valuesetArray2.includes(optionValue)
              && seenOptions.includes(optionValue)
      ) {
        if (!observedOptions.includes(combinedValue)) {
          addOption(option.cloneNode(true));
          observedOptions.push(combinedValue);
        }
      } else if (reference === 'hide' && valuesetArray.includes(optionValue)) {
        // do nothing
      } else {
        // do nothing
      }

      seenOptions.push(optionValue);
    });

    newOptions.sort((a, b) => {
      const aText = a.innerText.toLowerCase();
      const bText = b.innerText.toLowerCase();

      if (aText < bText) {
        return -1;
      }
      if (aText > bText) {
        return 1;
      }
      return 0;
    });
    newOptions = startingOption.concat(newOptions);
    newOptions = newOptions.concat(otherOption);

    if (newOptions.length) {
      newOptions.forEach((option) => {
        const optionValue = option.value.toLowerCase();
        const mktoSelectOptionByValue = mktoSelect.querySelector(
          `option[value='${optionValue}']`,
        );
        if (mktoSelectOptionByValue) {
          option.innerText = mktoSelectOptionByValue.innerText;
        }
      });
      mktoSelect.innerHTML = '';
      newOptions.forEach((option) => {
        mktoSelect.add(option);
      });

      const mktoSelectOptionByValue = mktoSelect.querySelector(`option[value='${backValue}']`);
      if (mktoSelectOptionByValue) {
        mktoSelect.selectedIndex = mktoSelectOptionByValue.index;
      } else {
        mktoSelect.selectedIndex = 0;
      }
      const emptyOption = mktoSelect.querySelector("option[value='']");
      if (emptyOption) {
        mktoSelect.removeChild(emptyOption);
        mktoSelect.prepend(emptyOption);
      }
      otherOption = mktoSelect.querySelector(
        "option[value='other'], option[value='Other'], option[value='OTHER']",
      );
      if (otherOption) {
        mktoSelect.removeChild(otherOption);
        mktoSelect.appendChild(otherOption);
      }
    } else {
      setRequired(fieldname, false);
      if (mktoFormRowTop) {
        const mktoFieldDescriptor = mktoFormRowTop.querySelectorAll('.mktoFieldDescriptor');
        if (mktoFieldDescriptor) {
          mktoFieldDescriptor.forEach((descriptor) => {
            descriptor.classList.add('mktoFieldDescriptor__hidden');
            descriptor.classList.remove('mktoFieldDescriptor');
          });
        }
        mktoFormRowTop.classList.add('mktoHidden', 'mktohandleFieldRuleLegend');
      }
    }

    // textElem.innerHTML = "passed: " + reference.trim();
  });
}

function handleFieldsetLabelLegend(mktoFormRowLegend, mktoFormRow, mktoFieldset) {
  const mktoHtmlTexts = mktoFieldset.querySelectorAll('.mktoHtmlText');
  let rulefound = false;
  mktoHtmlTexts.forEach((textElem) => {
    if (textElem.innerText.trim().length > 0 && !rulefound) {
      rulefound = true;
      let reference = textElem.innerText.toLowerCase().split('fieldset_label')[1];
      // mkfC.log(reference);
      let legendClassName = reference.split('rule:')[0];
      legendClassName = legendClassName.replace(/[^a-z0-9-]/gi, '');
      legendClassName = legendClassName.substring(0, 20);
      mktoFormRow.setAttribute('data-mkto_vis_src', legendClassName);
      mktoFormRow.classList.add('htmlRow');
      let mktoFormRowLegendHtml = mktoFormRowLegend?.innerHTML || '';
      const regex = /__([a-zA-Z0-9]+)__/g;
      mktoFormRowLegendHtml = mktoFormRowLegendHtml.replace(
        regex,
        (match, fieldName) => {
          let tentativeValue = '';
          const fieldElement = document.querySelector(
            `.mktoFormRow [name="${fieldName}"]`,
          );

          if (fieldElement) {
            tentativeValue = fieldElement.value || '';
          }
          if (tentativeValue.trim().length === 0) {
            const fieldMappingToDL = window?.mcz_marketoForm_pref?.value_setup?.field_mapping_dl || {};
            if (Object.prototype.hasOwnProperty.call(fieldMappingToDL, fieldName)) {
              const tentativeValueLocation = fieldMappingToDL[fieldName].trim();
              if (tentativeValueLocation.length > 0) {
                const tentativeValueLocationArray = tentativeValueLocation.split('.');
                let tentativeValueLocationObj = window?.mcz_marketoForm_pref;
                for (let idx = 0; idx < tentativeValueLocationArray.length; idx += 1) {
                  const key = tentativeValueLocationArray[idx];
                  if (
                    tentativeValueLocationObj
                          && Object.prototype.hasOwnProperty.call(tentativeValueLocationObj, key)
                  ) {
                    tentativeValueLocationObj = tentativeValueLocationObj[key];
                  }
                }
                if (tentativeValueLocationObj) {
                  tentativeValue = tentativeValueLocationObj;
                }
              }
            }
          }
          tentativeValue = tentativeValue.trim();
          if (tentativeValue === '') {
            mkfC.log('Partner not found.');
          }
          tentativeValue = tentativeValue.replace(/\s\s+/g, ' ');
          return tentativeValue;
        },
      );
      textElem.innerHTML = mktoFormRowLegendHtml;
      if (reference.split('rule:').length > 1) {
        [, reference] = reference.split('rule:');
        // mktoFormRowLegend.innerText = reference;
      }
    } else {
      textElem.classList.add('mktoHidden');
    }
  });
}

function handleHiddenLegend(mktoFormRowLegend, mktoFormRow) {
  mktoFormRowLegend.classList.add('mktoCleanedlegend');
  mktoFormRow.classList.add('mktoCleaned', 'mktoHidden');
  mktoFormRow.classList.add('mktoHiddenLegend');
  let legendClassName = mktoFormRowLegend.innerText.split('-');
  if (legendClassName.length > 1) {
    [, legendClassName] = legendClassName;
    legendClassName = legendClassName.toLowerCase().replace(/[^a-z0-9-]/gi, '');
    legendClassName = legendClassName.substring(0, 20);
    mktoFormRow.setAttribute('data-mkto_vis_src', legendClassName);
  }
}

function handleSetupLegend(mktoFormRowLegend, mktoFormRow) {
  mktoFormRowLegend.classList.add('mktoCleanedlegend');
  mktoFormRow.classList.add('mktoCleaned', 'mktoHidden');
  mktoFormRow.classList.add('mktoSetupLegend');

  let legendClassName = mktoFormRowLegend.innerText.split('-');
  if (legendClassName.length > 1) {
    [, legendClassName] = legendClassName;
    legendClassName = legendClassName.toLowerCase().replace(/[^a-z0-9-]/gi, '');
    legendClassName = legendClassName.substring(0, 20);
    mktoFormRow.setAttribute('data-mkto_vis_src', legendClassName);
  }

  const mktoLogicalFields = mktoFormRow.querySelectorAll('.mktoLogicalField');
  mktoLogicalFields.forEach((logicalField) => {
    logicalField.parentNode.removeChild(logicalField);
  });
}

function handleOtherLegends(mktoFormRowLegend, mktoFormRow) {
  let otherClass = mktoFormRowLegend.innerText.toLowerCase().trim().replace(' ', '-');
  otherClass = otherClass.replace(/[^a-z0-9-]/gi, '');
  if (otherClass.length > 0) {
    otherClass = otherClass.substring(0, 20);
    mktoFormRowLegend.classList.add(otherClass);
    mktoFormRow.classList.add('mktoCleaned');
    mktoFormRow.classList.add(otherClass);
    mktoFormRow.setAttribute('data-mkto_vis_src', otherClass);
  }
}

function checkFormMsgsThrottle() {
  checkFormMsgsNow = new Date().getTime();
  if (checkFormMsgsNow - checkFormMsgsLastCall > checkFormMsgsRateLimit) {
    checkFormMsgsLastCall = checkFormMsgsNow;
    // eslint-disable-next-line no-use-before-define
    checkFormMsgs();
  } else {
    checkFormMsgsPending = true;
  }
}

function clickCallValidation() {
  setTimeout(() => {
    checkFormMsgsThrottle();
  }, 600);
}

function checkFormMsgs() {
  let mktoRequiredFieldsInvalid = document.querySelectorAll(
    '.mktoRequired.mktoValid:not(.warningMessage)',
  );
  for (let i = 0; i < mktoRequiredFieldsInvalid.length; i += 1) {
    const field = mktoRequiredFieldsInvalid[i];
    if (field?.value.length === 0) {
      field.classList.remove('mktoValid');
      field.classList.add('mktoInvalid');
    }
  }

  mktoRequiredFieldsInvalid = document.querySelectorAll(
    '.mktoRequiredVis.mktoInvalid:not(.warningMessage)',
  );
  const mktoRequiredFieldsValid = document.querySelectorAll(
    '.mktoRequiredVis.mktoValid:not(.successMessage)',
  );
  const mktoRequiredFieldsInvalidWithSuccessMessage = document.querySelectorAll(
    '.mktoRequiredVis.mktoInvalid.successMessage',
  );
  const mktoRequiredFieldsValidWithWarningMessage = document.querySelectorAll(
    '.mktoRequiredVis.mktoValid.warningMessage',
  );
  if (mktoRequiredFieldsInvalid instanceof Array) {
    for (let i = 0; i < mktoRequiredFieldsInvalid.length; i += 1) {
      const field = mktoRequiredFieldsInvalid[i];
      if (field) {
        field.classList.remove('successMessage');
        field.classList.add('warningMessage');
      }
    }
  }
  if (mktoRequiredFieldsValid instanceof Array) {
    for (let i = 0; i < mktoRequiredFieldsValid.length; i += 1) {
      const field = mktoRequiredFieldsValid[i];
      if (field) {
        field.classList.remove('warningMessage');
        field.classList.add('successMessage');
      }
    }
  }
  if (mktoRequiredFieldsInvalidWithSuccessMessage instanceof Array) {
    for (let i = 0; i < mktoRequiredFieldsInvalidWithSuccessMessage.length; i += 1) {
      const field = mktoRequiredFieldsInvalidWithSuccessMessage[i];
      if (field) {
        field.classList.remove('successMessage');
        field.classList.add('warningMessage');
      }
    }
  }
  if (mktoRequiredFieldsValidWithWarningMessage instanceof Array) {
    for (let i = 0; i < mktoRequiredFieldsValidWithWarningMessage.length; i += 1) {
      const field = mktoRequiredFieldsValidWithWarningMessage[i];
      if (field) {
        field.classList.remove('warningMessage');
        field.classList.add('successMessage');
      }
    }
  }
  const mktoRequiredFields = document.querySelectorAll(
    '.mktoRequiredVis:not([data-checkFormMsgs_throttle])',
  );

  const mktoButtons = document.querySelectorAll('.mktoButton:not([data-checkFormMsgs_throttle])');
  if (mktoButtons) {
    for (let i = 0; i < mktoButtons.length; i += 1) {
      const button = mktoButtons[i];
      if (button) {
        button.setAttribute('data-checkFormMsgs_throttle', true);
        button.addEventListener('mouseout', checkFormMsgsThrottle);
        button.addEventListener('click', clickCallValidation);
      }
    }
  }

  mktoRequiredFields.forEach((element) => {
    if (element && !element.hasAttribute('data-checkFormMsgs_throttle')) {
      element.setAttribute('data-checkFormMsgs_throttle', true);
      element.addEventListener('blur', checkFormMsgsThrottle);
      element.addEventListener('change', checkFormMsgsThrottle);
      element.addEventListener('mouseout', checkFormMsgsThrottle);
      element.addEventListener('keyup', checkFormMsgsThrottle);
    }
  });
  if (checkFormMsgsPending) {
    checkFormMsgsPending = false;
    checkFormMsgs();
  }
}

export const addAutocompleteAttribute = () => {
  const mktoForm = document.querySelector('.mktoForm[id]');
  // Turning off autocomplete on form. Whitelist selected inputs individually.
  mktoForm.setAttribute('autocomplete', 'off');

  const fieldNameMapToAutocomplete = window?.mcz_marketoForm_pref?.value_setup?.field_mapping_ac || {};
  const templateName = window?.mcz_marketoForm_pref?.form?.template;
  const templateRule = (window?.templateRules || []).find((template) => template[templateName]) || {};
  const autoCompleteFields = templateRule[templateName]?.auto_complete || [];

  return (mktoFormElement) => {
    const fieldName = mktoFormElement.name;
    const autocompleteToken = fieldNameMapToAutocomplete[fieldName] || null;
    if (autocompleteToken && autoCompleteFields.includes(fieldName)) {
      mktoFormElement.setAttribute('autocomplete', autocompleteToken);
    }
  };
};

function mktOptionals(mktoForm) {
  if (!mktoForm) {
    return;
  }
  const reviewOptoinal = mktoForm.querySelectorAll(
    '.mktoFormRow:not(.mktoHidden) fieldset.mktoFormCol .mktoFormRow[data-mktofield]',
  );
  if (reviewOptoinal.length > 0) {
    for (let i = 0; i < reviewOptoinal.length; i += 1) {
      const reviewOptoinalElem = reviewOptoinal[i];
      const reviewOptoinalElemName = reviewOptoinalElem.getAttribute('data-mktofield');
      const reviewOptoinalElemField = reviewOptoinalElem.querySelector(
        `[name="${reviewOptoinalElemName}"]`,
      );
      if (reviewOptoinalElemField === null) {
        reviewOptoinalElem.parentNode.classList.remove('mktoVisible');
      } else {
        reviewOptoinalElem.parentNode.classList.add('mktoVisible');
      }
    }
  }
}

function handleFirstFocus() {
  const mktoForm = document.querySelector('.mktoWhenRendered.mktoForm[id]');
  if (!mktoForm.classList.contains('focusActive')) {
    mktoForm.classList.add('focusActive');
    if (window?.mcz_marketoForm_pref?.profile !== undefined) {
      const nameoffield = this.getAttribute('name');
      if (nameoffield) {
        window.mcz_marketoForm_pref.profile.first_field = nameoffield;
      }
    }
    aaInteraction('Marketo Form Interaction', 'formInteraction', null, null);
  }
}

function focusFlds(mktoForm) {
  const formFocusFields = mktoForm.querySelectorAll(
    '.mktoFormRowTop:not(.mktoHidden) .mktoField',
  );
  if (formFocusFields.length > 1) {
    mktoForm.classList.add('focusReady');
    formFocusFields.forEach((field) => {
      field.addEventListener('focus', handleFirstFocus, true);
    });
  }
}

function makeHidden(targetField, hideField = true) {
  let fieldname = targetField;
  let shouldHide = hideField;
  const fieldMap = {};
  if (window?.mcz_marketoForm_pref?.value_setup?.field_mapping) {
    Object.keys(window?.mcz_marketoForm_pref?.value_setup?.field_mapping || {}).forEach((key) => {
      fieldMap[key.toLowerCase()] = window?.mcz_marketoForm_pref?.value_setup?.field_mapping[key];
    });
  }

  const setting = `${window?.mcz_marketoForm_pref?.field_visibility?.[fieldname]}`;
  if (setting === 'hidden' && shouldHide === false) {
    mkfC.log('Field is set to be hidden in mcz_marketoForm_pref, cannot be shown');
    shouldHide = true;
  }

  let shouldbeRequired = false;
  if (setting === 'required') {
    shouldbeRequired = true;
  } else {
    shouldbeRequired = false;
  }

  if (fieldMap[fieldname]) {
    fieldname = fieldMap[fieldname];
  }

  const field = document.querySelector(`[name="${fieldname}"]`);
  if (field) {
    let parentRow = field.parentNode;
    let veryTop = null;
    let localRow = null;

    while (parentRow !== null) {
      if (parentRow && parentRow.classList && parentRow.classList.contains('mktoFormRow')) {
        veryTop = parentRow;
        if (localRow === null) {
          localRow = parentRow;
        }
      }
      parentRow = parentRow.parentNode;
    }

    if (shouldHide) {
      if (veryTop) {
        veryTop.classList.add('mktoHidden');
      }
      localRow.classList.add('mktoHidden');
      setRequired(fieldname, false);
    } else {
      if (veryTop) {
        veryTop.classList.remove('mktoHidden');
      }
      localRow.classList.remove('mktoHidden');
      if (shouldbeRequired) {
        setRequired(fieldname, true);
      } else {
        setRequired(fieldname, false);
      }
    }
  }
}

function translateDDlbls(dropdownName, translateValues) {
  const dropdownField = document.querySelector(`select[name="${dropdownName}"]:not(.translated)`);

  if (dropdownField) {
    let optionsArray = Array.from(dropdownField.options);
    const optionsWithValues = optionsArray.filter((option) => option.value !== '');

    if (optionsWithValues.length === 0) {
      mkfC.log(`No options with values found for ${dropdownName} hiding field`);
      makeHidden(dropdownName, true);
      dropdownField.classList.add('translated');
      return;
    }
    makeHidden(dropdownName, false);

    if (
      translateValues === null
      || translateValues === undefined
      || Object.keys(translateValues).length === 0
    ) {
      dropdownField.classList.add('translated');
      return;
    }

    dropdownField.classList.add('translated');

    if (Object.prototype.hasOwnProperty.call(window.translateFormElems, dropdownName.toLowerCase())) {
      let language = window.mcz_marketoForm_pref?.profile?.prefLanguage;
      if (language && language.length > 0) {
        language = language.toLowerCase();
        language = language.replace('-', '_');
      } else {
        language = 'en_us';
      }
      if (language) {
        let translatedElem = window.translateFormElems[dropdownName.toLowerCase()][language];
        if (translatedElem) {
          const label = document.querySelector(`label[for="${dropdownName}"]`);
          if (label) {
            let originalElemTxt = label.innerText;
            originalElemTxt = originalElemTxt.trim();
            translatedElem = translatedElem.replace(':', '').trim();
            label.innerHTML = translatedElem;

            if (originalElemTxt.indexOf('*') > -1) {
              originalElemTxt = originalElemTxt.replace(/\*/g, '');
              translatedElem += '*';
            }
            const options = dropdownField.querySelectorAll('option');
            for (let i = 0; i < options.length; i += 1) {
              const option = options[i];
              if (
                option.text.toLowerCase().replace(/\*/g, '').trim()
                === translatedElem.toLowerCase().replace(/\*/g, '').trim()
              ) {
                option.setAttribute('data-original-label', option.text);
                option.text = translatedElem;
              }
            }
          }
        }
      }
    }

    const unsortedOptions = [];
    const selectedValue = dropdownField.value;
    let selectLbloption;

    optionsArray = optionsArray.filter((option) => {
      if (Object.prototype.hasOwnProperty.call(translateValues, option.value)) {
        if (!option.getAttribute('data-original-label')) {
          option.setAttribute('data-original-label', option.text);
        }
        option.text = translateValues[option.value];
        return true;
      } if (option.value === '' || option.value === '_' || option?.value === null) {
        selectLbloption = option;
        return false;
      }
      unsortedOptions.push(option);
      return false;
    });

    if (!selectLbloption) {
      selectLbloption = document.createElement('option');
      selectLbloption.value = '';
      const label = document.querySelector(`label[for="${dropdownName}"]`);

      if (label) {
        selectLbloption.text = label.innerText;
      } else {
        selectLbloption.text = 'Select';
      }
      dropdownField.add(selectLbloption);
    }

    optionsArray = optionsArray.concat(unsortedOptions);

    optionsArray.sort((a, b) => {
      const aText = a.text.toLowerCase();
      const bText = b.text.toLowerCase();
      if (aText < bText) {
        return -1;
      }
      if (aText > bText) {
        return 1;
      }
      return 0;
    });

    if (selectLbloption) {
      optionsArray.unshift(selectLbloption);
    }

    dropdownField.innerHTML = '';

    optionsArray.forEach((option) => {
      dropdownField.add(option);
    });

    dropdownField.value = selectedValue;
  }
}

function updateLabels() {
  const options = document.querySelectorAll(".mktoFormRow option[value='_']");
  for (let i = 0; i < options.length; i += 1) {
    options[i].value = '';
  }
  const links = document.querySelectorAll('.mktoFormRow a:not(.targetchecked)');
  links.forEach((link) => {
    const target = link.getAttribute('target');
    const href = link.getAttribute('href');
    if (target !== '_blank' && href && href.trim() !== '#') {
      link.setAttribute('target', '_blank');
      link.classList.add('targetchecked');
    }
  });

  let language = window.mcz_marketoForm_pref?.profile?.prefLanguage;
  let subtype = window.mcz_marketoForm_pref?.form?.subtype;
  if (window.translateFormElems) {
    if (!language) {
      language = 'en_us';
    }
    if (subtype && language) {
      if (window.mcz_marketoForm_pref?.subtypeRules?.[subtype]) {
        subtype = window.mcz_marketoForm_pref?.subtypeRules?.[subtype];
      }
      if (!window.translateFormElems?.[subtype]) {
        subtype = 'submit';
      }
      const mktoButtons = document.querySelectorAll('.mktoButton:not(.mktoUpdatedBTN)');
      mktoButtons.forEach((mktoButton) => {
        let buttonContent = `${mktoButton.innerHTML}`;
        buttonContent = buttonContent.toLowerCase();
        if (buttonContent.indexOf('undef') === -1) {
          if (buttonContent.indexOf('..') > -1) {
            let translateBTNText = window.translateFormElems?.pleasewait?.[language]
              || window.translateFormElems?.pleasewait?.[language.substring(0, 2)]
              || null;
            if (translateBTNText) {
              if (!translateBTNText.endsWith('...')) {
                translateBTNText += '...';
              }
              if (translateBTNText !== mktoButton.innerHTML) {
                mktoButton.innerHTML = translateBTNText;
              }
            }
          } else if (window.translateFormElems?.[subtype]?.[language]) {
            const translateBTNText = window.translateFormElems[subtype][language]
              || window.translateFormElems[subtype][language.substring(0, 2)]
              || window.translateFormElems[subtype].en_us;
            if (translateBTNText !== mktoButton.innerHTML) {
              mktoButton.innerHTML = translateBTNText;
            }
          }
        }
        mktoButton.classList.add('mktoUpdatedBTN');
      });
    }
  }

  const selectElements = document.querySelectorAll('.mktoFormRow select:not(.mktoUpdated)');
  for (let s = 0; s < selectElements.length; s += 1) {
    if (selectElements[s].options.length > 1) {
      const selectElement = selectElements[s];
      selectElement.classList.add('mktoUpdated');
      if (!selectElement.value) {
        let foundBlank = false;
        for (let i = 0; i < selectElement.options.length; i += 1) {
          const option = selectElement.options[i];
          if (option.value === '') {
            const sourceId = selectElement.getAttribute('id');
            if (sourceId) {
              const sourceLabel = document.querySelector(`label[for="${sourceId}"]`);
              if (sourceLabel && sourceLabel.innerText) {
                const isRequired = selectElement.classList.contains('mktoRequired');
                option.text = isRequired ? `${sourceLabel.innerText}*` : sourceLabel.innerText;
              }
              selectElement.selectedIndex = 0;
            }
            foundBlank = true;
            break;
          }
        }
        if (!foundBlank) {
          const sourceId = selectElement.getAttribute('id');
          if (sourceId) {
            const blankOption = document.createElement('option');
            blankOption.value = '';
            blankOption.text = '';
            const sourceLabel = document.querySelector(`label[for="${sourceId}"]`);
            if (sourceLabel && sourceLabel.innerText) {
              const isRequired = selectElement.classList.contains('mktoRequired');
              blankOption.text = isRequired
                ? `${sourceLabel.innerText}*`
                : sourceLabel.innerText;
            }
            selectElement.insertBefore(blankOption, selectElement.firstChild);
            selectElement.selectedIndex = 0;
          }
        }
      }
    }
  }

  const formRows = document.querySelectorAll('.mktoFormRow label:not(.labelUpdated)[id*="_0"]');
  for (let i = 0; i < formRows.length; i += 1) {
    const row = formRows[i];
    const sourceId = row.getAttribute('for');
    if (sourceId) {
      const sourceElem = document.querySelector(`[id="${sourceId}"]`);
      if (sourceElem) {
        const sourceName = sourceElem.getAttribute('name');
        if (sourceName) {
          const sourceLabelId = `Lbl${sourceName}`;
          const sourceLabelText = document.querySelector(`label[id="${sourceLabelId}"]`);
          if (sourceLabelText) {
            const currentText = sourceLabelText.id;
            if (currentText && currentText.length > 0) {
              if (lblRendering && lblRendering[currentText]) {
                row.innerHTML = lblRendering[currentText];
              } else {
                lblRendering[currentText] = sourceLabelText.innerHTML;
                row.innerHTML = sourceLabelText.innerHTML;
              }
              sourceLabelText.classList.add('labelUpdatedSRC');
              row.classList.add('labelUpdated');
            }
          }
        }
      }
    } else {
      row.classList.add('labelUpdated');
    }
  }

  const updatedLabels = document.querySelectorAll('.labelUpdatedSRC');
  for (let i = 0; i < updatedLabels.length; i += 1) {
    updatedLabels[i].innerHTML = '';
    updatedLabels[i].classList.add('labelUpdated');
    updatedLabels[i].classList.remove('labelUpdatedSRC');
  }

  if (window.mcz_marketoForm_pref.profile.privacy_links) {
    Object.keys(window.mcz_marketoForm_pref.profile.privacy_links).forEach((key) => {
      const privacyLinks = document.querySelectorAll(`.mktoFormRow a[href*="{${key}}"]`);
      privacyLinks.forEach((link) => {
        link.href = window.mcz_marketoForm_pref.profile.privacy_links[key];
      });
    });
  }
  const labels = document.querySelectorAll('.labelUpdated');
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    if (label.innerHTML.indexOf('{country}') !== -1) {
      label.innerHTML = label.innerHTML.replace(
        /\{country\}/g,
        window.mcz_marketoForm_pref.profile.privacy_country,
      );
    }
  }
}

function addPOIListeners() {
  const mktoFormsPrimaryProductInterest = document.querySelector(
    '[name="mktoFormsPrimaryProductInterest"]:not(.changeListenerAdded)',
  );
  if (mktoFormsPrimaryProductInterest) {
    mktoFormsPrimaryProductInterest.addEventListener('change', () => {
      const poiValue = mktoFormsPrimaryProductInterest.value;
      const mczMarketoFormPref = window.mcz_marketoForm_pref || {};
      mczMarketoFormPref.program = mczMarketoFormPref.program || {};
      mczMarketoFormPref.program.poi = poiValue;
      window.mcz_marketoForm_pref = mczMarketoFormPref;
    });
    mktoFormsPrimaryProductInterest.classList.add('changeListenerAdded');
  }
}

function updatePlaceholders() {
  const formFields = document.querySelectorAll(
    '.mktoFormRow  .mktoVisible input:not([type="hidden"]):not([placeholder]), .mktoFormRow .mktoVisible textarea:not([placeholder])',
  );
  for (let i = 0, len = formFields.length; i < len; i += 1) {
    const label = document.querySelectorAll(`label[for="${formFields[i].name}"]`)[0];
    if (label) {
      let labelText = label.innerText;
      if (labelText.length > 0) {
        labelText = labelText.replace(':', '').trim();
        labelText = labelText.replace(/\*/g, '').trim();
        label.innerHTML = labelText;

        if (formFields[i].classList.contains('mktoRequired')) {
          labelText += '*';
        }
        formFields[i].placeholder = labelText;
      }
    }
  }

  const selectFields = document.querySelectorAll(
    '.mktoFormRow  .mktoVisible select:not(.placeholder)',
  );
  for (let i = 0, len = selectFields.length; i < len; i += 1) {
    const label = document.querySelectorAll(`label[for="${selectFields[i].name}"]`)[0];
    if (label) {
      let labelText = label.innerText;
      if (labelText.length > 0) {
        labelText = labelText.replace(':', '').trim();
        labelText = labelText.replace(/\*/g, '').trim();
        label.innerHTML = labelText;
        if (selectFields[i].classList.contains('mktoRequired')) {
          labelText += '*';
        }

        const options = selectFields[i].querySelectorAll('option');
        let foundBlank = false;
        for (let j = 0; j < options.length; j += 1) {
          if (options[j].value === '') {
            foundBlank = true;
            options[j].text = labelText;
            break;
          }
        }
        if (!foundBlank) {
          const blankOption = document.createElement('option');
          blankOption.value = '';
          blankOption.text = labelText;
          selectFields[i].insertBefore(blankOption, selectFields[i].firstChild);
        }

        selectFields[i].classList.add('placeholder');
      }
    }
  }

  const mktoFormCols = document.querySelectorAll('.mktoFormCol');
  for (let i = 0; i < mktoFormCols.length; i += 1) {
    const mktoFormCol = mktoFormCols[i];
    const mktoFormColParent = mktoFormCol.parentNode;
    if (mktoFormColParent && mktoFormColParent.hasAttribute('data-mkto_vis_src')) {
      const mktoPlaceholderTxt = mktoFormCol.querySelector("[class*='HtmlText']");
      if (!mktoPlaceholderTxt) {
        const mktoField = mktoFormCol.querySelector('.mktoField');
        if (!mktoField) {
          mktoFormCol.classList.remove('mktoVisible');
        } else {
          mktoFormCol.classList.add('mktoVisible');
        }
      }
    }
  }
}

function normalizeMktoStyles() {
  normalizeMktoStylesRun += 1;

  const mktoForm = document.querySelector('.mktoForm[id]');

  const mktoFormElements = mktoForm.querySelectorAll('[style]:not(.mktoCleaned)');
  if (mktoFormElements.length > 0) {
    for (let i = 0; i < mktoFormElements.length; i += 1) {
      const mktoFormElement = mktoFormElements[i];
      if (mktoFormElement.hasAttribute('style')) {
        mktoFormElement.classList.add('mktoVisible');
        mktoFormElement.removeAttribute('style');

        addAutocompleteAttribute(mktoFormElement);
      }
      mktoFormElement.classList.remove('mktoHasWidth');
    }
  }

  const mktoAsterix = mktoForm.querySelectorAll('.mktoAsterix');
  if (mktoAsterix.length > 0) {
    for (let i = 0; i < mktoAsterix.length; i += 1) {
      const mktoAsterixElement = mktoAsterix[i];
      mktoAsterixElement.parentNode.removeChild(mktoAsterixElement);
    }
  }

  const mktoFields = mktoForm.querySelectorAll('.mktoField[name]:not(.mktofield_anchor)');
  if (mktoFields.length > 0) {
    for (let i = 0; i < mktoFields.length; i += 1) {
      const mktoField = mktoFields[i];
      if (
        document.querySelector(
          `.mktoFormRow[data-mktofield="${mktoField.getAttribute('name')}"]`,
        ) === null
      ) {
        let mktoFieldParent = mktoField.parentNode;
        while (mktoFieldParent !== null) {
          if (
            mktoFieldParent.classList
            && mktoFieldParent.classList.contains('mktoFormRow')
            && !mktoFieldParent.hasAttribute('data-mktofield')
          ) {
            mktoField.classList.add('mktofield_anchor');
            mktoFieldParent.setAttribute('data-mktofield', mktoField.getAttribute('name'));
            break;
          }
          mktoFieldParent = mktoFieldParent.parentNode;
        }
      }
    }
  }

  const privacyRows = mktoForm.querySelectorAll('.mktoFormRowTop:not(.adobe-privacy)');
  for (let i = 0; i < privacyRows.length; i += 1) {
    const privacyRow = privacyRows[i];
    if (privacyRow.querySelector('[class*="adobe-privacy"]')) {
      privacyRow.classList.add('adobe-privacy');
    }
  }

  mktOptionals(mktoForm);

  const mktoFormRowTops = mktoForm.querySelectorAll('.mktoFormRow:not(.mktoFormRowTop)');
  if (mktoFormRowTops.length > 0) {
    for (let i = 0; i < mktoFormRowTops.length; i += 1) {
      const mktoFormRowTop = mktoFormRowTops[i];
      if (mktoFormRowTop.parentNode.classList.contains('mktoForm')) {
        mktoFormRowTop.classList.add('mktoFormRowTop');
      }
    }
  }

  const mktoFormRows = document.querySelectorAll('.mktoFormRow:not([data-mktofield])');
  if (mktoFormRows.length > 0) {
    for (let i = 0; i < mktoFormRows.length; i += 1) {
      const mktoFormRow = mktoFormRows[i];
      const mktoFormRowChild = mktoFormRow.querySelector('.mktoFormRow:not(.mktoFormRowTop)');
      if (mktoFormRow.parentNode.classList.contains('mktoForm')) {
        mktoFormRow.classList.add('mktoFormRowTop');
        const mktoPlaceholderHtmlText = mktoFormRow.querySelector(
          "[class*='mktoPlaceholderHtmlText']",
        );
        if (mktoPlaceholderHtmlText) {
          mktoFormRow.classList.add('mktoHtmlText');
        }
      }
      if (mktoFormRowChild === null) {
        if (!mktoFormRow.hasAttribute('data-mktofield')) {
          const mktoField = mktoFormRow.querySelector('.mktoField');
          if (mktoField && mktoField.length === 1) {
            mktoFormRow.setAttribute('data-mktofield', mktoField.getAttribute('name'));
            const mktoFieldDescriptor = mktoFormRow.querySelector('.mktoFieldDescriptor');
            if (mktoFieldDescriptor) {
              mktoFieldDescriptor.setAttribute(
                'data-mktofield',
                mktoField.getAttribute('name'),
              );
              const mktoFieldDescriptorLabel = mktoFieldDescriptor.querySelector(
                `label[for='${mktoField.getAttribute('name')}']`,
              );
              if (mktoFieldDescriptorLabel) {
                const lblText = mktoFieldDescriptorLabel.innerText
                  .replace(/\*/g, '')
                  .replace(':', '')
                  .toLowerCase();
                let primaryRow = mktoFormRow;
                let mktoFormRowParent = mktoFormRow.parentNode;
                while (mktoFormRowParent !== null) {
                  if (
                    mktoFormRowParent.classList
                    && mktoFormRowParent.classList.contains('mktoFormRow')
                    && !mktoFormRowParent.hasAttribute('data-mktofield')
                  ) {
                    primaryRow = mktoFormRowParent;
                  }
                  mktoFormRowParent = mktoFormRowParent.parentNode;
                }
                primaryRow.setAttribute('data-mktofield', mktoField.getAttribute('name'));
                primaryRow.setAttribute('data-mktolbl', lblText);
              }
              mktoFieldDescriptor.classList.add('mktoVisible');
            }
          }
        }

        const mktoFormRowScript = mktoFormRow.querySelector('script:not(.mktoCleanedScript)');
        if (mktoFormRowScript !== null) {
          mktoFormRow.classList.add('mktoHidden');
          mktoFormRow.classList.add('mktoCleanedScript');
        }
      }

      const mktoFormRowLegends = mktoFormRow.querySelectorAll('legend:not(.mktoCleanedlegend)');
      if (mktoFormRowLegends.length) {
        mktoFormRowLegends.forEach((mktoFormRowLegend) => {
          const mktoFieldset = mktoFormRowLegend.closest('fieldset');
          const mktoHtmlText = mktoFieldset.querySelector('.mktoHtmlText');
          const innerTextLower = mktoFormRowLegend.innerText.toLowerCase();

          if (mktoHtmlText && mktoHtmlText.innerText.toLowerCase().includes('privacy')) {
            mktoFormRow.classList.add('adobe-privacy');
          }

          if (mktoHtmlText && mktoHtmlText.innerText.toLowerCase().includes('field_rule')) {
            handleFieldRuleLegend(mktoFormRowLegend, mktoFormRow, mktoForm, mktoFieldset);
          } else if (
            mktoHtmlText
            && mktoHtmlText.innerText.toLowerCase().includes('fieldset_label')
          ) {
            handleFieldsetLabelLegend(mktoFormRowLegend, mktoFormRow, mktoFieldset);
          } else if (innerTextLower.includes('hidden')) {
            handleHiddenLegend(mktoFormRowLegend, mktoFormRow);
          } else if (innerTextLower.includes('setup')) {
            handleSetupLegend(mktoFormRowLegend, mktoFormRow);
          } else {
            handleOtherLegends(mktoFormRowLegend, mktoFormRow);
          }

          mktoFormRowLegend.classList.add('mktoLegend');
        });
      }
    }
  }

  translateDDlbls('State', translateState);
  updateLabels();
  addPOIListeners();
  updatePlaceholders();

  if (mktoForm.classList.contains('validationActive')) {
    checkFormMsgsThrottle();
  }

  if (!mktoForm.classList.contains('mktoVisible') && firstrun === false) {
    //
    // Focus Logic for first interactions
    //

    const mktoFormColVis = mktoForm.querySelectorAll(
      '.mktoCleaned[data-mkto_vis_src] fieldset.mktoFormCol.mktoVisible',
    );
    for (let i = 0; i < mktoFormColVis.length; i += 1) {
      const mktoPlaceholderHtmlText = mktoFormColVis[i].querySelector(
        "[class*='mktoPlaceholderHtmlText']",
      );
      if (mktoPlaceholderHtmlText) {
        // wait for the form to be visible
      } else {
        mktoFormColVis[i].classList.remove('mktoVisible');
      }
    }

    if (!mktoForm.classList.contains('focusReady')) {
      focusFlds(mktoForm);
    }

    if (window?.mcz_marketoForm_pref?.field_filters?.products === 'hidden') {
      const formId = getMktoFormID();
      const form = window.MktoForms2.getForm(formId);
      uFFld(
        form,
        'mktoFormsPrimaryProductInterest',
        window?.mcz_marketoForm_pref?.program?.poi,
        true,
      );
    }

    performance.mark('MarketoFormEnd');
    performance.measure('MarketoFormVisible', 'MarketoFormStart', 'MarketoFormEnd');

    mktoForm.removeAttribute('style');
    mktoForm.classList.add('mktoForm--fade-in');

    mktoForm.classList.add('mktoVisible');
  }

  // end normalizeMktoStyles
}

function normalizeStyles(observer, mktoForm, config) {
  if (nStylesOn) {
    isRequestedAgain = true;
    return;
  }

  if (document.querySelector('#mktoFormsCompany')) {
    document.getElementById('mktoFormsCompany').id = 'mkto_FormsCompany';
  }

  nStylesOn = true;
  observer.disconnect();
  try {
    normalizeMktoStyles();
  } catch (error) {
    mkfC.log('normalizeMktoStyles > ', error);
  }

  observer.observe(mktoForm, config);
  nStylesOn = false;

  if (isRequestedAgain) {
    isRequestedAgain = false;
    normalizeStyles(observer, mktoForm, config);
  }
  if (firstrun && normalizeMktoStylesRun > 1) {
    firstrun = false;
    normalizeStyles(observer, mktoForm, config);
  }
}

function cleaningValidationMain() {
  const mktoForm = document.querySelector('.mktoWhenRendered.mktoForm[id]');
  if (mktoForm) {
    if (chkFrmInt) {
      clearInterval(chkFrmInt);
    }
    renderingReady = true;

    if (document.querySelector('#mktoFormsCompany')) {
      document.getElementById('mktoFormsCompany').id = 'mkto_FormsCompany';
    }

    if (mktoForm && !mktoForm.classList.contains('observMKTO')) {
      mktoForm.classList.add('observMKTO');

      if (document.querySelector('#mktoFormsCompany')) {
        document.getElementById('mktoFormsCompany').id = 'mkto_FormsCompany';
      }

      const config = {
        attributes: true,
        childList: true,
        characterData: false,
        subtree: true,
      };

      const observer = new MutationObserver((mutations) => {
        if (mutations && mutations.length > 0) {
          normalizeStyles(observer, mktoForm, config);
        }
      });

      observer.observe(mktoForm, config);
      normalizeStyles(observer, mktoForm, config);
    }
  }
}

function isElementVisible(el) {
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility !== 'visible') return false;
    if (style.opacity < 0.1) return false;
    if (style.overflow !== 'visible') {
      if (
        el.offsetWidth
        + el.offsetHeight
        + el.getBoundingClientRect().height
        + el.getBoundingClientRect().width
        === 0
      ) {
        return false;
      }
    }
    let parentElement = el.parentNode;
    while (parentElement !== null && parentElement.nodeType === 1) {
      const parentStyle = window.getComputedStyle(parentElement);
      if (parentStyle.display === 'none') return false;
      if (parentStyle.visibility !== 'visible') return false;
      if (parentStyle.opacity < 0.1) return false;
      if (parentStyle.overflow !== 'visible') {
        if (
          parentElement.offsetWidth
          + parentElement.offsetHeight
          + parentElement.getBoundingClientRect().height
          + parentElement.getBoundingClientRect().width
          === 0
        ) {
          return false;
        }
      }
      parentElement = parentElement.parentNode;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function cleaningValidation() {
  mkfC.log('Cleaning & Validation - Loaded');
  // ##
  // ## validation messages
  // ##

  const mktoButtonRow = document.querySelector('.mktoButtonRow:not(.mktoButtonRow--observed)');
  if (mktoButtonRow) {
    mktoButtonRow.classList.add('mktoButtonRow--observed');

    mktoButtonRow.addEventListener('click', () => {
      if (!mktoButtonRow.hasAttribute('data-buttonObserver')) {
        mktoButtonRow.setAttribute('data-buttonObserver', true);
        const validateForms = document.querySelectorAll('[id*="mktoForm_"]:not(.validationActive)');
        if (validateForms) {
          for (let i = 0; i < validateForms.length; i += 1) {
            const validateForm = validateForms[i];
            validateForm.classList.add('validationActive');
          }
        }
      }
      const requiredFields = document.querySelectorAll('.mktoRequired:not(.mktoRequiredVis)');
      if (requiredFields) {
        for (let i = 0; i < requiredFields.length; i += 1) {
          const field = requiredFields[i];
          if (isElementVisible(field)) {
            field.classList.add('mktoRequiredVis');
          }
        }
        if (requiredFields.length > 0) {
          setTimeout(checkFormMsgsThrottle, 10);
        }
      }
    });
  }

  // ###########################################

  cleaningValidationMain();
  if (!renderingReady) {
    chkFrmInt = setInterval(cleaningValidationMain, 10);
  }
}
