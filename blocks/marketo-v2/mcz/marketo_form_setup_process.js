/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
// Processing

import { mkfC } from './marketo_form_setup_rules.js';
import { getMktoFormID, checkAdobePrivacy } from './global.js';
import { aaInteraction } from './adobe_analytics.js';
import { privacyValidation } from './privacy_validation_process.js';

const mktoFormsLoaded = {};
const mktoFrmParams = new URLSearchParams(window.location.search);
const mktoForm = document.querySelector('.mktoForm');
mktoForm.setAttribute('style', 'opacity:0');
mktoForm.classList.add('starting_fieldset');
let consStyl = 'font-size: 1.2em; color: green; font-weight: bold; ';
let renderingReview;
let uniqueId = '';
let templateLog = '';
const activeCookie = false;
let mktoFormConfirm;

export default async function init(renderingReviewS) {
  renderingReview = renderingReviewS;
  mkfC.log('Form - Begin');

  const mktoPerformanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      const loadTimeRounded = Math.round(entry.duration);
      const currentTimeBucket = Math.round(loadTimeRounded / 500) * 500;
      if (entry.name === 'MarketoFormVisible' && entry.entryType === 'measure') {
        if (
          window.mcz_marketoForm_pref?.performance?.loadTime === null
          || window.mcz_marketoForm_pref?.performance?.loadTime === undefined
        ) {
          window.mcz_marketoForm_pref.performance = {
            loadTime: loadTimeRounded,
            loadTimeBucket: currentTimeBucket,
            currentTime: loadTimeRounded,
            currentTimeBucket,
          };

          if (document.getElementById('mktoFormsCompany')) {
            document.getElementById('mktoFormsCompany').id = 'mktoFormsCompany_ignore';
          }

          mkfC.log(
            `%cForm load time: ${window?.mcz_marketoForm_pref?.performance?.loadTime}ms, bucket: ${window?.mcz_marketoForm_pref?.performance?.loadTimeBucket}ms`,
            consStyl,
          );

          aaInteraction(
            'Marketo Form View',
            'formView',
            window?.mcz_marketoForm_pref?.form?.id,
            window?.mcz_marketoForm_pref?.performance?.loadTime,
          );
        }
      }
    });
  });

  mktoPerformanceObserver.observe({ entryTypes: ['measure'] });

  performance.mark('MarketoFormStart');

  mkfC.log('Marketo Form Setup - End');
}

export function uFFld(form, fieldName, fieldValue, critical = false) {
  let value = fieldValue;
  if (form === null || form === undefined) {
    mkfC.warn(`Form is null or undefined for:${fieldName} = ${value}`);
    return;
  }

  value = `${value}`;
  value = value.replace(/undefined|null/g, '').trim();
  value = String(value);

  if (critical && value === '') {
    mkfC.warn(`Critical field is empty: ${fieldName}`);
  }

  const formField = document.querySelector(`[name="${fieldName}"]`);
  if (formField) {
    let activeOnForm = false;
    const checklbl = document.querySelector(`label[for="${fieldName}"]`);
    if (checklbl) {
      const lbl = checklbl.innerText;
      mkfC.log(lbl);
      if (lbl.length > 0) {
        let parent = checklbl.parentElement;
        while (parent) {
          if (parent.classList.contains('mktoFormRowTop')) {
            activeOnForm = true;
            mkfC.log(`Active on Form: ${fieldName}`);
            if (parent.classList.contains('mktoHidden')) {
              mkfC.log(`Active on Form (but hidden): ${fieldName}`);
              activeOnForm = false;
            }
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
    if (activeOnForm === false) {
      if (formField.tagName === 'SELECT' && formField.querySelectorAll('option').length > 0) {
        const options = formField.querySelectorAll('option');
        let found = false;
        for (let i = 0; i < options.length; i += 1) {
          if (options[i].value === value) {
            found = true;
            break;
          }
        }
        if (!found) {
          const newOption = document.createElement('option');
          newOption.value = value;
          newOption.innerHTML = value;
          formField.appendChild(newOption);
        }
      }

      if (formField.type === 'radio' || formField.type === 'checkbox') {
        const radioCheck = document.querySelector(
          `[name="${fieldName}"][value="${value}"]`,
        );
        if (!radioCheck) {
          const nwO = document.createElement('input');
          nwO.type = formField.type;
          nwO.name = fieldName;
          nwO.value = value;
          nwO.style.display = 'none';
          formField.parentElement.appendChild(nwO);
        }
      }
      const tV = form.getValues();
      if (Object.prototype.hasOwnProperty.call(tV, fieldName)) {
        if (tV[fieldName] !== value) {
          form.setValues({ [fieldName]: value });
        }
      } else {
        form.addHiddenFields({ [fieldName]: value });
      }
      formField.value = value;
    }
  } else {
    const hiddenField = {};
    hiddenField[fieldName] = value;
    form.addHiddenFields(hiddenField);
  }
}

function checkAndAddProperties(obj, defaultObj, replace) {
  Object.keys(defaultObj).forEach((prop) => {
    if (typeof obj[prop] === 'undefined') {
      obj[prop] = defaultObj[prop];
    } else if (
      typeof obj[prop] === 'object'
      && obj[prop] !== null
      && typeof defaultObj[prop] === 'object'
      && defaultObj[prop] !== null
    ) {
      checkAndAddProperties(obj[prop], defaultObj[prop], replace);
    } else if (replace) {
      obj[prop] = defaultObj[prop];
    }
  });
}

const aTLg = (log) => {
  if (log === undefined || log === null) {
    return;
  }
  if (log === '---') {
    templateLog += '-----\n';
    return;
  }
  templateLog += `${log}\n`;
};

function applyRuleToFields(ruleFields, fields) {
  if (!fields) {
    return;
  }
  let matchesY = '';
  let matchesN = '';
  Object.entries(ruleFields).forEach((entry) => {
    const key = entry[0];
    const ruleArray = entry[1];
    const ruleValue = ruleArray[0].split(':')[0];
    const thisV = ` - '${key}' is set as '${fields[key]}', Rule is '${ruleValue}'`;

    if (fields[key] !== ruleValue) {
      matchesN += `${thisV}\n`;
      fields[key] = ruleValue;
    } else {
      matchesY += `${thisV}\n`;
    }
  });
  if (matchesY !== '') {
    matchesY = `\nMatches:\n${matchesY}\n`;
  }
  if (matchesN !== '') {
    matchesN = `!!!!!! No Match:\n${matchesN}`;
  }
  aTLg(matchesY + matchesN);
}

function checkTemplate() {
  const groupLBL = 'Marketo Form Template';
  mkfC.groupCollapsed(groupLBL);

  const mczPrefs = window.mcz_marketoForm_pref;
  if (!mczPrefs) {
    mkfC.warn('DL not defined.');
    mkfC.groupEnd(groupLBL);
    return;
  }
  if (!mczPrefs.form) {
    mkfC.warn('form not defined.');
    mkfC.groupEnd(groupLBL);
    return;
  }
  if (!mczPrefs.form.template) {
    mkfC.warn('form.template not defined.');
    mkfC.groupEnd(groupLBL);
    return;
  }
  if (mktoFrmParams.get('template')) {
    mczPrefs.form.template = mktoFrmParams.get('template');
  }

  const templateName = mczPrefs.form?.template;
  const templates = window?.templateRules;

  templateLog = `\nTemplate = '${templateName}'\n${templateLog}`;

  if (!templateName || !Array.isArray(templates)) {
    mkfC.warn('Template incorrect.');
    mkfC.groupEnd(groupLBL);
    return;
  }
  const templateRule = templates.find((template) => Object.prototype.hasOwnProperty.call(template, templateName));
  if (!templateRule) {
    mkfC.warn(`Template no rule: ${templateName}`);
    mkfC.groupEnd(groupLBL);
    return;
  }
  const rule = templateRule[templateName];
  if (templateName.indexOf('flex') > -1 && !mktoFrmParams.get('template')) {
    mkfC.log('\nRules Relaxed');
    mkfC.groupEnd(groupLBL);
  } else {
    aTLg(`\nEval '${templateName}'`);
    if (templateName.indexOf('flex') > -1 && mktoFrmParams.get('template') > -1) {
      aTLg('Test Rules Enforced');
    }

    if (rule.field_visibility) {
      aTLg('\nVis');
      applyRuleToFields(rule.field_visibility, mczPrefs.field_visibility, 'field_visibility');
    }
    if (rule.field_filters) {
      aTLg('\nFilter');
      applyRuleToFields(rule.field_filters, mczPrefs.field_filters, 'field_filters');
    }
  }

  if (mczPrefs.form.templateVersions) {
    if (Object.prototype.hasOwnProperty.call(mczPrefs.form.templateVersions, mczPrefs.form.template)) {
      const originalTemplateVersion = mczPrefs.form.template;
      mczPrefs.form.template = mczPrefs.form.templateVersions[mczPrefs.form.template];
      if (originalTemplateVersion !== mczPrefs.form.template) {
        aTLg(
          `Template: '${originalTemplateVersion}' > '${mczPrefs.form.template}'`,
        );
      }
    } else {
      aTLg(
        `No template ver: ${mczPrefs.form.template}, Using: ${mczPrefs.form.template}`,
      );
    }
  } else {
    aTLg('no subtype.');
  }

  if (mczPrefs.form.subtypeTemplate) {
    if (Object.prototype.hasOwnProperty.call(mczPrefs.form.subtypeTemplate, mczPrefs.form.template)) {
      const originalSubtype = mczPrefs.form.subtype;
      mczPrefs.form.subtype = mczPrefs.form.subtypeTemplate[mczPrefs.form.template];
      if (originalSubtype !== mczPrefs.form.subtype) {
        aTLg(`Subtype Changed: '${originalSubtype}' > '${mczPrefs.form.subtype}'`);
      }
    } else {
      aTLg(`No temp rule: ${mczPrefs.form.template}`);
      aTLg(`Using subtype: ${mczPrefs.form.subtype}`);
    }
  } else {
    aTLg('subtype in template undefined.');
  }

  let poi = mktoFrmParams.get('mktfrm_poi') || '';
  if (!poi && window.location.hash) {
    const { hash } = window.location;
    if (hash.includes('#poi')) {
      poi = hash.replace('#poi', '');
    }
  }
  if (poi.length > 2) {
    poi = poi
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+$/, '')
      .toUpperCase();

    mczPrefs.program.poi = poi;
    mczPrefs.field_filters.products = 'hidden';
    mkfC.log(`POI provided in query string: ${poi}`);
  }

  aTLg('Subtypes Verbs');
  aTLg(JSON.stringify(mczPrefs.form.subtypeRules, null, 2));
  aTLg('\nSubtypes Enforced:');
  aTLg(JSON.stringify(mczPrefs.form.subtypeTemplate, null, 2));

  aTLg('---');

  aTLg(`\nComplete Rule '${templateName}'\n`);
  aTLg(JSON.stringify(rule, null, 2));
  mkfC.log(templateLog);
  mkfC.groupEnd(groupLBL);
}

function isTestRecord() {
  let testRecord = 'not_test';
  const here = window.location.href.toLowerCase();

  const emailFld = document.querySelector('.mktoForm[id] [name="Email"]');
  if (emailFld) {
    if (emailFld.value.includes('@adobetest.com')) {
      testRecord = 'test_submit';
      if (emailFld.value.includes('privacytest') || emailFld.value.includes('nosub')) {
        testRecord = 'test_no_submit';
      }
    }
  }
  if (here.indexOf('.hlx.') > -1) {
    testRecord = 'test_submit';
  }
  if (here.indexOf('preview=1') > -1 && here.indexOf('formid=') > -1) {
    testRecord = 'test_no_submit';
  }
  if (window?.mcz_marketoForm_pref?.profile !== undefined) {
    if (testRecord === 'not_test') {
      window.mcz_marketoForm_pref.profile.testing = false;
    } else {
      window.mcz_marketoForm_pref.profile.testing = true;
    }
  }

  if (testRecord.indexOf('test_submit') > -1) {
    consStyl = 'font-size: 1.2em; color: purple; font-weight: bold; ';
  } else if (testRecord.indexOf('test_no_submit') > -1) {
    consStyl = 'font-size: 1.2em; color: red; font-weight: bold; ';
  }

  return testRecord;
}

function printNiceDL(json, groupLabel) {
  function logNode(node, name, depth = 0) {
    const friendlyNames = {
      field_visibility: 'Field Visibility Preferences',
      field_filters: 'Select Field Value Filters',
      subtypeRules: 'Form Type Submit Verbs',
      profile: 'Visitor Preferences',
      form: 'Form Configuration',
      subType: 'Form Type',
      type: 'Application',
      program: 'Marketo Program Settings',
      campaignids: 'Campaign IDs',
      success: 'Success - Thank You Reactions',
      value_setup: 'How Fields relate to each other',
      mktoInstantInquiry: 'Inquiry Creation',
      subtypeTemplate: 'Template > Form Types',
      logging: 'Tesing & Logging',
    };

    if (typeof node !== 'object' || node === null) {
      return;
    }
    const nodeName = friendlyNames[name] ? friendlyNames[name] : name;
    if (
      depth === 0
      || nodeName === 'Form Configuration'
      || nodeName === 'Campaign IDs'
      || nodeName === 'Marketo Program Settings'
      || nodeName === 'success'
    ) {
      mkfC.group(nodeName ? `${nodeName}` : 'Configuration');
    } else {
      mkfC.groupCollapsed(nodeName ? `${nodeName}` : 'Configuration');
    }
    const simpleKeys = Object.keys(node).filter(
      (key) => !(typeof node[key] === 'object' && node[key] !== null),
    );
    const maxKeyLength = Math.max(...simpleKeys.map((key) => key.length));
    simpleKeys.forEach((key) => {
      const value = node[key];
      const adjustedKey = key + ' '.repeat(maxKeyLength - key.length);
      mkfC.log(`${adjustedKey} : ${value}`);
    });
    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        logNode(value, key, depth + 1); // Increase the depth as we go deeper
      }
    });

    mkfC.groupEnd(groupLabel);
  }

  logNode(json);
}

function mktoFrmsGetValueByName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const consentCheck = checkAdobePrivacy();
  const safeGet = (obj, path) => path.reduce(
    (acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined),
    obj,
  );
  const getParam = (paramName) => {
    const campaignValue = safeGet(window, [
      'mcz_marketoForm_pref',
      'program',
      'campaignids',
      paramName,
    ]);
    if (campaignValue) {
      const trimmed = String(campaignValue).trim();
      if (trimmed && !['null', 'undefined'].includes(trimmed)) {
        return trimmed;
      }
    }
    return new URLSearchParams(window.location.search).get(paramName) || '';
  };
  const getCookie = (cookieName) => {
    const cookies = document.cookie.split('; ').reduce((acc, curr) => {
      const [key, value] = curr.split('=');
      acc[key] = value;
      return acc;
    }, {});
    return cookies[cookieName] || '';
  };
  const getFromStorage = (storage, key) => {
    try {
      return storage?.getItem(key) || '';
    } catch {
      return '';
    }
  };
  const parseJSON = (value) => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return '';
    }
    try {
      const parsed = JSON.parse(value);
      return parsed === null || parsed === undefined ? '' : parsed;
    } catch {
      return value;
    }
  };
  const getValue = () => {
    if (!consentCheck) {
      return getParam(name);
    }
    return (
      getParam(name)
      || getFromStorage(sessionStorage, name)
      || getCookie(name)
      || getFromStorage(localStorage, name)
      || ''
    );
  };
  const ensureString = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  return ensureString(parseJSON(getValue()));
}

export function MktoFormsOnSuccess() {
  if (mktoFormConfirm !== undefined) {
    clearTimeout(mktoFormConfirm);
  }
  const groupLabel = 'Marketo Submit Success';
  mkfC.group(groupLabel);
  function logSuccess(message) {
    mkfC.log(`%c${message}`, consStyl);
  }

  if (window?.mcz_marketoForm_pref?.profile?.testing === true) {
    logSuccess('Form Submitted - Test Record');
  } else {
    logSuccess('Form Submitted');
  }

  function MktoFormsValidUrl(url) {
    try {
      return Boolean(new URL(url));
    } catch {
      return false;
    }
  }

  let tyContent = `${window.mcz_marketoForm_pref?.form?.success?.content}`;
  tyContent = tyContent.trim();

  if (window.mcz_marketoForm_pref?.form?.success?.type === undefined) {
    window.mcz_marketoForm_pref.form.success.type = 'redirect';
    logSuccess('Form Success Type not defined, defaulting to redirect');
  }

  if (tyContent !== '' && tyContent !== 'null' && tyContent !== 'undefined') {
    if (MktoFormsValidUrl(tyContent) === true) {
      logSuccess('TY URL');
      if (tyContent.indexOf('http') === -1) {
        logSuccess('TY relative URL');
        if (tyContent.indexOf('/') === 0) {
          tyContent = tyContent.substring(1);
        }
        // eslint-disable-next-line camelcase, no-undef
        tyContent = `${window.location.origin}/${ty_url}`;
      }
      logSuccess(`TY is a valid URL: ${tyContent}`);
    } else {
      logSuccess('URL=X >> message.');
      window.mcz_marketoForm_pref.form.success.type = 'message';
    }
  } else {
    logSuccess('TY=X for lang');

    if (window.translateFormElems?.thankyou) {
      const language = window.mcz_marketoForm_pref?.profile?.prefLanguage;
      const tyFallback = 'Thank you.';
      let translatedTY = Object.entries(window.translateFormElems.thankyou).find(([key]) => key.toLowerCase().startsWith('en'))?.[1] || 'Thank you for your submission.';

      if (language) {
        const langCode = language.substring(0, 2).toLowerCase();
        translatedTY = window.translateFormElems.thankyou[language]
          || window.translateFormElems.thankyou[langCode]
          || Object.entries(window.translateFormElems.thankyou).find(([key]) => key.toLowerCase().startsWith(langCode))?.[1]
          || null;

        if (translatedTY === null) {
          mkfC.log(`No language: ${language}`);
        } else {
          mkfC.log(`language: ${language}`);
        }
      }

      if (translatedTY === null) {
        translatedTY = tyFallback;
        mkfC.log(`No language: ${language}`);
      }
      tyContent = translatedTY;
    }
  }

  const ne = new Date();
  mkfC.log(`%cForm Data: @${ne.toLocaleString()}`, consStyl);
  logSuccess(`Date: ${ne.toLocaleString()}`);
  logSuccess(`Unique ID: ${window?.mcz_marketoForm_pref?.profile?.unique_id}`);

  mkfC.groupEnd(groupLabel);

  if (window.mcz_marketoForm_pref?.form?.success?.type === 'redirect') {
    if (tyContent !== '' && tyContent !== null && tyContent !== undefined) {
      try {
        if (tyContent.indexOf('submissionid') === -1) {
          uniqueId = window?.mcz_marketoForm_pref?.profile?.unique_id;
          if (uniqueId) {
            const url = new URL(tyContent);
            url.searchParams.set('submissionid', uniqueId);
            tyContent = url.toString();
          }
        }
      } catch (e) {
        mkfC.log('Failed to add submissionid', e);
      }

      window.location.href = tyContent;
    }
  } else {
    if (tyContent === '' || tyContent === 'null' || tyContent === 'undefined') {
      tyContent = 'Thank you for your submission.';
    }

    const form = document.getElementById(`mktoForm_${window.mcz_marketoForm_pref?.form?.id}`);
    const formWrapper = document.createElement('div');
    formWrapper.classList.add('mktoForm-wrap');

    const formMessageContent = document.createElement('p');
    formMessageContent.classList.add('ty-message');
    formMessageContent.innerHTML = tyContent;
    formWrapper.appendChild(formMessageContent);
    form.parentNode.insertBefore(formWrapper, form);
    form.style.opacity = '0';
    form.style.visibility = 'hidden';
    form.reset();

    setTimeout(() => {
      formMessageContent.style.opacity = '1';
      formMessageContent.style.visibility = 'visible';
    }, 100);
  }
}

function translateButtons(translationKey) {
  let append = '';
  const language = window.mcz_marketoForm_pref?.profile?.prefLanguage;
  let translatedText = window.translateFormElems?.[translationKey]?.en_us || null;
  let current = '';

  if (translatedText === null) {
    mkfC.log(
      `Check General_Translations, No translated '${translationKey}' text found for language: ${language}`,
    );
    return;
  }
  current = translatedText;
  if (translatedText.indexOf('...') > 0) {
    append = '...';
  }
  if (language) {
    translatedText = window.translateFormElems[translationKey][language]
      || window.translateFormElems[translationKey][language.substring(0, 2)]
      || null;
    if (translatedText === null) {
      Object.keys(window.translateFormElems[translationKey]).forEach((key) => {
        if (key.substring(0, 2) === language.substring(0, 2) && translatedText === null) {
          translatedText = window.translateFormElems[translationKey][key];
        }
      });
    }
  }
  if (translatedText === null) {
    mkfC.log(
      `Check General_Translations, No translated '${translationKey}' text found for language: ${language}`,
    );
  } else {
    document
      .querySelectorAll('.mktoButtonRow button, .mktoButtonRow .mkto-step00of99')
      .forEach((button) => {
        if (button.textContent?.toLowerCase().trim() === current.toLowerCase().trim()) {
          button.setAttribute(`data-mkto-btn-${translationKey}`, translatedText + append);
          button.textContent = translatedText + append;
        }
        const altTranslationKey = button.getAttribute('data-translationKey') || null;
        if (button.getAttribute('data-translationKey') !== null) {
          if (altTranslationKey !== translationKey) {
            translateButtons(altTranslationKey);
          }
        }
      });
  }
}

function mktoDoSubmit(formId) {
  const validForm = window.MktoForms2.getForm(formId).validate();
  const submittable = window.MktoForms2.getForm(formId).submittable();
  if (submittable) {
    const canSubmit = true;
    if (canSubmit && validForm) {
      const testRecord = isTestRecord();
      if (testRecord === 'test_no_submit') {
        mkfC.log('%cTest Record Detected - Emulating Marketo Submission', consStyl);

        window.mcz_marketoForm_pref.form.success.confirm = true;
        if (window.aaInteractionsActive === true && aaInteraction !== undefined) {
          let delay = 5000;
          aaInteraction('Marketo Form Submission', 'formSubmission', formId, null);
          if (window.mcz_marketoForm_pref?.form?.success?.delay) {
            delay = parseInt(window.mcz_marketoForm_pref.form.success.delay, 10);
            if (Number.isNaN(delay)) {
              delay = 0;
            }
            if (delay < 0) {
              delay = 0;
            }
            if (delay > 10000) {
              delay = 10000;
            }
            window.mcz_marketoForm_pref.form.success.delay = delay;
          } else {
            window.mcz_marketoForm_pref.form.success.delay = 5000;
          }
          clearTimeout(mktoFormConfirm);

          mktoFormConfirm = setTimeout(() => {
            MktoFormsOnSuccess();
          }, delay);
        } else {
          MktoFormsOnSuccess();
          mkfC.log('aaInteractionsActive is false');
        }
      } else {
        const mktoSubmitButton = document.querySelector(
          `#mktoForm_${formId} button[type='submit']`,
        );

        if (mktoSubmitButton) {
          mktoSubmitButton.click();
        } else {
          window.MktoForms2.getForm(formId).submit();
        }
      }
    }
  }
}

function doBTNUpdate(formId) {
  const mktoButtonWrap = document.querySelector(`#mktoForm_${formId} .mktoButtonWrap`);
  if (mktoButtonWrap) {
    const primaryBTN = mktoButtonWrap.querySelector("[type='submit']");
    if (primaryBTN) {
      const mktoButtonContainer = document.createElement('div');
      mktoButtonContainer.className = 'mktoButtonContainer';
      mktoButtonWrap.parentNode.insertBefore(mktoButtonContainer, mktoButtonWrap);
      mktoButtonContainer.appendChild(mktoButtonWrap);

      const newButtonContainer = document.createElement('div');
      newButtonContainer.className = 'mkto-step-container';

      const backBTN = document.createElement('button');
      backBTN.type = 'button';
      backBTN.className = 'mkto-step-back-btn';
      backBTN.innerHTML = 'Back';

      // newButtonContainer.appendChild(backBTN);
      const newButton = document.createElement('button');
      newButton.type = 'button';
      newButton.id = 'mktoButton_new';

      if (primaryBTN?.className) {
        newButton.className = primaryBTN.className;
      }
      if (primaryBTN.style) {
        newButton.style = primaryBTN.style;
        primaryBTN.style.display = 'none';
      }
      if (primaryBTN.classList) {
        primaryBTN.classList.add('mktoHidden');
      }
      if (primaryBTN.getAttribute('data-mkto-btn-pleasewait')) {
        newButton.setAttribute(
          'data-mkto-btn-pleasewait',
          primaryBTN.getAttribute('data-mkto-btn-pleasewait'),
        );
      }
      if (primaryBTN.getAttribute('data-mkto-btn-next')) {
        newButton.setAttribute(
          'data-mkto-btn-next',
          primaryBTN.getAttribute('data-mkto-btn-next'),
        );
      }

      let primaryBTNtext = primaryBTN.textContent;
      let subtypeRule = window.mcz_marketoForm_pref?.form?.subtype;
      const subtypeRules = window.mcz_marketoForm_pref?.form?.subtypeRules;
      const subtype = window.mcz_marketoForm_pref?.form?.subtype;
      const language = window.mcz_marketoForm_pref?.profile?.prefLanguage;
      if (subtype) {
        if (subtypeRules && subtypeRules !== null) {
          subtypeRule = subtypeRules[subtype];
          if (subtypeRule) {
            let translatedSubmit = window.translateFormElems[subtypeRule];
            if (translatedSubmit) {
              translatedSubmit = translatedSubmit[language]
                || translatedSubmit[language.substring(0, 2)]
                || null;
              if (translatedSubmit === null) {
                translatedSubmit = translatedSubmit[subtypeRule];
                Object.keys(translatedSubmit).forEach((key) => {
                  if (key.substring(0, 2) === language.substring(0, 2) && translatedSubmit === null) {
                    translatedSubmit = translatedSubmit[key];
                  }
                });
              }

              if (translatedSubmit) {
                primaryBTNtext = translatedSubmit;
              } else {
                mkfC.log(
                  `Check General_Translations, No translated '${subtypeRule
                  }' text found for language: ${language}`,
                );
              }
            } else {
              mkfC.log(
                `Check General_Translations, No translated submit text found for button subtype: ${subtypeRule}`,
              );
            }
          }
        }
      }
      primaryBTN.setAttribute('mkto-form-original', formId);
      newButton.innerHTML = primaryBTNtext;
      newButton.setAttribute('data-mkto-btn-text', primaryBTNtext);
      newButton.setAttribute('data-mkto-btn-submit', primaryBTNtext);
      newButton.setAttribute('data-translationKey', subtypeRule);
      newButton.setAttribute('mkto-form-src', formId);

      const newButtonWrap = document.createElement('span');
      newButtonWrap.className = 'mktoButtonWrap mktoNative';
      newButtonWrap.appendChild(newButton);
      newButtonContainer.appendChild(newButtonWrap);

      const stepP = document.createElement('p');
      stepP.className = 'mkto-step00of99';
      stepP.innerHTML = '';
      // newButtonContainer.appendChild(stepP);

      mktoButtonContainer.insertBefore(newButtonContainer, mktoButtonWrap);

      newButton.addEventListener('click', (event) => {
        const mktoFormId = event.target.getAttribute('mkto-form-src');
        if (mktoFormId) {
          event.target.disabled = true;

          // if this has a data-mkto-btn-pleasewait set the text to it
          const pleaseWaitText = event.target.getAttribute('data-mkto-btn-pleasewait');
          if (pleaseWaitText) {
            event.target.setAttribute('data-mkto-btn-text', event.target.textContent);
            event.target.innerHTML = pleaseWaitText;
          }

          setTimeout(() => {
            event.target.disabled = false;
            const buttonText = event.target.getAttribute('data-mkto-btn-text');
            if (buttonText) {
              event.target.innerHTML = buttonText;
            }
          }, 10000);

          mktoDoSubmit(mktoFormId);
        }
      });

      translateButtons('submit');
      translateButtons('pleasewait');
      translateButtons('next');
      translateButtons('back');
      translateButtons('step00of99');
    } else {
      setTimeout(() => {
        doBTNUpdate(formId);
      }, 25);
    }
  }
}

function mktoBuildForm() {
  let formId = getMktoFormID();
  // check the size of the cookie for this session
  if (document.cookie.length > 4096) {
    mkfC.warn(`Cookie size > 4k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
  } else if (document.cookie.length > 8192) {
    mkfC.error(`Cookie size > 8k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
  }

  if (typeof formId === 'undefined' || formId === null) {
    return;
  }
  if (!mktoFormsLoaded[formId]) {
    mktoFormsLoaded[formId] = true;
  } else {
    mkfC.log(`Form [${formId}] already loaded`);
    return;
  }

  let groupLabel = 'Form Setup';
  mkfC.group(groupLabel);

  printNiceDL(window.mcz_marketoForm_pref, groupLabel);

  isTestRecord();

  window.MktoForms2.getForm(formId).onValidate((formValid) => {
    let valid = formValid;
    formId = getMktoFormID();
    const form = window.MktoForms2.getForm(formId);
    let fData = form.getValues();
    const requiredFields = document.querySelectorAll(`#mktoForm_${formId} .mktoRequired`);
    const requiredFieldsData = {};
    let requiredFieldsFilled = true;
    let testRecord = false;

    isTestRecord();
    if (window?.mcz_marketoForm_pref?.profile !== undefined) {
      if (typeof testRecord !== 'boolean') {
        testRecord = false;
      } else {
        testRecord = window.mcz_marketoForm_pref.profile.testing;
      }
    }

    for (let i = 0; i < requiredFields.length; i += 1) {
      const fieldName = requiredFields[i].getAttribute('name');
      if (fieldName) {
        if (Object.prototype.hasOwnProperty.call(fData, fieldName)) {
          requiredFieldsData[fieldName] = fData[fieldName];
        }
      }
    }
    Object.keys(fData).forEach((key) => {
      const review = `${fData[key]}`;
      if (review.indexOf('{{') > -1) {
        form.setValues({ [key]: '' });
      }
      if (review !== review.trim()) {
        form.setValues({ [key]: review.trim() });
      }
      if (Object.prototype.hasOwnProperty.call(requiredFieldsData, key)) {
        if (review === '') {
          requiredFieldsFilled = false;
          mkfC.log(`Required Field Missing: ${key}`);
        }
      }
    });
    const countryField = document.querySelector(`#mktoForm_${formId} [name="Country"]`);
    if (countryField) {
      if (countryField.value === '') {
        const options = countryField.querySelectorAll('option');
        if (options && options.length > 0) {
          countryField.value = options[0].value;
        }
      }
    }

    const mktoInvalidNonreq = document.querySelectorAll(
      `#mktoForm_${formId} .mktoInvalid:not(.mktoRequired)`,
    );
    for (let i = 0; i < mktoInvalidNonreq.length; i += 1) {
      mktoInvalidNonreq[i].classList.remove('mktoInvalid');
    }

    if (requiredFieldsFilled) {
      valid = true;
    } else {
      valid = false;
    }

    if (Object.prototype.hasOwnProperty.call(fData, 'Email')) {
      let eVld = true;
      if (fData.Email.indexOf('@') === -1) {
        eVld = false;
      }
      if (fData.Email.indexOf('.') === -1) {
        eVld = false;
      }
      const emailSplit = fData.Email.split('@');
      if (emailSplit.length === 2) {
        if (emailSplit[1].indexOf('.') === -1) {
          eVld = false;
        }
      }
      const eFld = document.querySelector(`#mktoForm_${formId} [name="Email"]`);
      if (eFld) {
        if (fData.Email !== fData.Email.trim()) {
          fData.Email = fData.Email.trim();
          form.setValues({ Email: fData.Email });
        }
        if (eFld.getAttribute('type') !== 'email') {
          eFld.setAttribute('type', 'email');
        }
        if (eVld) {
          eFld.classList.remove('mktoInvalid');
          eFld.classList.add('mktoValid');
        } else {
          eFld.classList.remove('mktoValid');
          eFld.classList.add('mktoInvalid');
        }
      }
      if (!eVld) {
        valid = false;
      }
    }

    const mktoFrmPvtURL = new URL(window.location.href);
    mktoFrmPvtURL.searchParams.forEach((value, key) => {
      if (!value || value === 'null' || value === 'undefined') {
        mktoFrmPvtURL.searchParams.delete(key);
        return;
      }
      if (value.startsWith('|')) {
        return;
      }
      mktoFrmPvtURL.searchParams.set(key, `|${value}`);
    });
    if (window?.mcz_marketoForm_pref?.program !== undefined) {
      window.mcz_marketoForm_pref.program.url = decodeURI(mktoFrmPvtURL.toString());
    }
    function addUniqueParam(paramName, paramValue) {
      if (!paramName || !paramValue) return mktoFrmPvtURL;
      const cleanName = String(paramName).trim();
      const cleanValue = String(paramValue).trim();
      if (!cleanValue || cleanValue === 'null' || cleanValue === 'undefined') {
        return mktoFrmPvtURL;
      }
      if (mktoFrmPvtURL.searchParams.has(cleanName)) {
        const existingValue = mktoFrmPvtURL.searchParams.get(cleanName);
        if (existingValue && existingValue !== cleanValue) {
          let counter = 1;
          let newParamName = `${cleanName}`;
          while (mktoFrmPvtURL.searchParams.has(newParamName) && counter < 7 && counter > 1) {
            counter += 1;
            newParamName = `${cleanName}_${counter}`;
          }
          mktoFrmPvtURL.searchParams.set(newParamName, `|${cleanValue}`);
        }
      } else {
        mktoFrmPvtURL.searchParams.set(cleanName, `|${cleanValue}`);
      }
      if (window?.mcz_marketoForm_pref?.program !== undefined) {
        window.mcz_marketoForm_pref.program.url = decodeURI(mktoFrmPvtURL.toString());
      }
      return mktoFrmPvtURL;
    }

    try {
      const attrMapping = window?.mcz_marketoForm_pref?.form?.validation?.campaignid;
      const cgenSparams = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.params;
      const cgenCookieParams = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.cookie;

      let mktoTreatmentId = window?.mcz_marketoForm_pref?.profile?.cgen;
      if (mktoTreatmentId === null || mktoTreatmentId === undefined || mktoTreatmentId === '') {
        mktoTreatmentId = '';
      }

      const TID = mktoFrmsGetValueByName('TID');
      const cgenParam = {};
      for (let i = 0; i < cgenSparams.length; i += 1) {
        cgenParam[cgenSparams[i]] = '';
      }
      const cgenCookie = {};
      for (let i = 0; i < cgenCookieParams.length; i += 1) {
        cgenCookie[cgenCookieParams[i]] = '';
      }

      if (TID.indexOf('-') > -1) {
        const splitCgen = mktoTreatmentId.split('-');
        if (splitCgen.length > 2) {
          const [trackingid, sdid, promoid] = splitCgen;
          cgenCookie.trackingid = trackingid;
          cgenCookie.sdid = sdid;
          cgenCookie.promoid = promoid;
        }
      }
      for (let i = 0; i < cgenSparams.length; i += 1) {
        const paramValue = mktoFrmsGetValueByName(cgenSparams[i]);
        if (paramValue !== '' && paramValue !== null && paramValue !== undefined) {
          cgenParam[cgenSparams[i]] = paramValue;
        }
      }
      const cgenKeys = Object.keys(cgenParam);
      const cgenActive = [];
      for (let i = 0; i < cgenKeys.length; i += 1) {
        const keyName = cgenKeys[i];
        const paranval = cgenParam[cgenKeys[i]];
        if (paranval !== '' && paranval !== null && paranval !== undefined) {
          cgenActive.push(paranval);
          if (mktoTreatmentId === '') {
            mktoTreatmentId = paranval;
          }
          addUniqueParam(keyName, paranval);
        }
      }
      if (mktoTreatmentId !== '' && mktoTreatmentId !== null && mktoTreatmentId !== undefined) {
        window.mcz_marketoForm_pref.profile.cgen = mktoTreatmentId;
        uFFld(form, 'mktoTreatmentId', mktoTreatmentId);
      }
      if (cgenActive.length > 0) {
        form.addHiddenFields({ sessionCGEN: cgenActive.join('-') });
      }
      let gclid = window?.mcz_marketoForm_pref?.program?.campaignids?.gclid;
      if (gclid === '' || gclid === null || gclid === undefined) {
        gclid = mktoFrmsGetValueByName('gclid');
      }
      if (gclid) {
        if (window?.mcz_marketoForm_pref?.program?.campaignids !== undefined) {
          window.mcz_marketoForm_pref.program.campaignids.gclid = gclid;
        }
        uFFld(form, 'mktoGoogleClickId', gclid);
      }

      const keys = Object.keys(attrMapping);
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        let value;
        if (Object.prototype.hasOwnProperty.call(window.mcz_marketoForm_pref?.program?.campaignids || {}, key)) {
          if (window.mcz_marketoForm_pref?.program?.campaignids[key] !== '') {
            value = window.mcz_marketoForm_pref?.program?.campaignids[key];
          }
        }
        if (value === '' || value === null || value === undefined) {
          const valcheck = mktoFrmsGetValueByName(attrMapping[key].queryParam);
          if (valcheck) {
            value = valcheck;
          } else if (
            attrMapping[key]?.cookie !== ''
            && attrMapping[key]?.cookie !== null
            && attrMapping[key]?.cookie !== undefined
          ) {
            const cookieVer = mktoFrmsGetValueByName(attrMapping[key].cookie);
            if (cookieVer) {
              mkfC.log(`${attrMapping[key].cookie} = ${cookieVer} Sourced from cookie`);
              value = cookieVer;
              addUniqueParam(attrMapping[key].queryParam, value);
            }
          }
        }
        if (value !== '' && value !== null && value !== undefined) {
          let isFormValid = true;
          if (attrMapping[key].starts_with) {
            isFormValid = false;
            for (let j = 0; j < attrMapping[key].starts_with.length; j += 1) {
              if (value.indexOf(attrMapping[key].starts_with[j]) === 0) {
                isFormValid = true;
                break;
              }
            }
            if (!isFormValid) {
              mkfC.log(
                `Invalid ${attrMapping[key].field
                } value: ${value
                } - does not start with ${attrMapping[key].starts_with.join(', ')}`,
              );
            }
          }
          if (attrMapping[key].min_length && value.length > 0 && isFormValid === true) {
            if (value.length < attrMapping[key].min_length) {
              isFormValid = false;
              mkfC.log(
                `Invalid ${attrMapping[key].field} value: ${value} - too short`,
              );
            }
            if (attrMapping[key].max_length) {
              if (value.length > attrMapping[key].max_length) {
                isFormValid = false;
                mkfC.log(
                  `Invalid ${attrMapping[key].field} value: ${value} - too long`,
                );
              }
            }
          }
          if (isFormValid) {
            uFFld(form, attrMapping[key].field, value, attrMapping[key].critical);
            if (attrMapping[key].status) {
              uFFld(form, attrMapping[key].status, 'Responded', attrMapping[key].critical);
            }
          } else {
            uFFld(form, attrMapping[key].field, '', attrMapping[key].critical);
          }
          addUniqueParam(attrMapping[key].queryParam, value);
        }
      }
    } catch (error) {
      mkfC.warn('Error in attribute setup process: ', error);
    }

    if (window.mcz_marketoForm_pref?.profile?.privacy_optin !== undefined) {
      if (window.mcz_marketoForm_pref?.profile?.privacy_optin === 'explicit') {
        form.addHiddenFields({
          mktoOKtoEmail: 'N',
          mktoOKtoCall: 'N',
        });
      } else {
        form.addHiddenFields({
          mktoOKtoEmail: 'Y',
          mktoOKtoCall: 'Y',
        });
      }
    }
    if (document.querySelector('[name="mktokoreaEmailOptin"]')) {
      if (document.querySelector('[name="mktokoreaEmailOptin"]').offsetParent !== null) {
        if (document.querySelector('[name="mktokoreaEmailOptin"]').checked) {
          form.addHiddenFields({ mktoOKtoEmail: 'Y' });
        } else {
          form.addHiddenFields({ mktoOKtoEmail: 'N' });
        }
      } else {
        form.addHiddenFields({ mktoOKtoEmail: 'U' });
      }
    }

    if (document.querySelector('[name="mktokoreaPhoneOptin"]')) {
      if (document.querySelector('[name="mktokoreaPhoneOptin"]').offsetParent !== null) {
        if (document.querySelector('[name="mktokoreaPhoneOptin"]').checked) {
          form.addHiddenFields({ mktoOKtoCall: 'Y' });
        } else {
          form.addHiddenFields({ mktoOKtoCall: 'N' });
        }
      } else {
        form.addHiddenFields({ mktoOKtoCall: 'U' });
      }
    }

    if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]')) {
      if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]').offsetParent !== null) {
        if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]').checked) {
          form.addHiddenFields({
            mktoOKtoEmail: 'Y',
            mktoOKtoCall: 'Y',
          });
        } else {
          form.addHiddenFields({
            mktoOKtoEmail: 'N',
            mktoOKtoCall: 'N',
          });
        }
      } else {
        form.addHiddenFields({
          mktoOKtoEmail: 'U',
          mktoOKtoCall: 'U',
        });
      }
    }

    const mktoCoPartnerPermissionValue = document.querySelector(
      '.mktoFormRow [name="mktoCoPartnerPermissionValue"]',
    );
    if (mktoCoPartnerPermissionValue) {
      if (mktoCoPartnerPermissionValue.type === 'checkbox') {
        if (mktoCoPartnerPermissionValue.checked) {
          form.setValues({ mktoCoPartnerPermissionValue: true });
        } else {
          form.setValues({ mktoCoPartnerPermissionValue: false });
        }
      } else {
        mktoCoPartnerPermissionValue.value = mktoCoPartnerPermissionValue.value
          .trim()
          .toLowerCase();
        if (mktoCoPartnerPermissionValue.value.indexOf('true') > -1) {
          form.setValues({ mktoCoPartnerPermissionValue: true });
        } else {
          form.setValues({ mktoCoPartnerPermissionValue: false });
        }
      }
    } else {
      form.setValues({
        mktoCoPartnerPermissionValue: false,
        mktoCoPartnerConsentNotice: '',
      });
    }

    const pElemts = document.querySelectorAll(
      '.adobe-privacy .mktoHtmlText.mktoVisible:not(.privacy-subscription)',
    );
    const privactText = Array.from(pElemts)
      .map((item) => item.textContent)
      .join(' ');

    let mktoInstantInquiry = true;
    const mktoformSubtype = window.mcz_marketoForm_pref?.form?.subtype;
    const mktoFormsTemplate = window.mcz_marketoForm_pref?.form?.template;
    if (
      window.mcz_marketoForm_pref?.form?.mktoInstantInquiry !== undefined
      && typeof window.mcz_marketoForm_pref?.form?.mktoInstantInquiry === 'object'
    ) {
      const chkIa = window.mcz_marketoForm_pref?.form?.mktoInstantInquiry;
      if (chkIa !== null) {
        if (chkIa[mktoformSubtype] === true) {
          mktoInstantInquiry = true;
        }
      }
    }

    if (window.mcz_marketoForm_pref?.profile?.known_visitor === true) {
      form.addHiddenFields({
        mktoOKtoMail: 'U',
        mktoOKtoEmail: 'U',
        mktoOKtoCall: 'U',
        mktoMPSPermissionsFlag: true,
        mktoOKtoShare: false,
        autosubmit: true,
        mktoInstantInquiry,
      });
    } else {
      form.addHiddenFields({
        mktoOKtoMail: 'U',
        mktoMPSPermissionsFlag: true,
        autosubmit: false,
        mktoInstantInquiry,
      });
    }
    window.mcz_marketoForm_pref.profile.mktoInstantInquiry = mktoInstantInquiry;

    uFFld(form, 'mktoformType', window.mcz_marketoForm_pref?.form?.type, true);
    uFFld(form, 'mktoformSubtype', mktoformSubtype, true);
    uFFld(form, 'languagePref', window.mcz_marketoForm_pref?.profile?.segLangCode, true);
    uFFld(form, 'mktoConsentURL', window.mcz_marketoForm_pref?.program?.url, true);
    uFFld(form, 'mktoFormsPrimaryProductInterest', window.mcz_marketoForm_pref?.program?.poi, true);

    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    form.addHiddenFields({
      mktoFormsTemplate,
      mktoLastUnsubscribeDate: datetime,
      unique_id: uniqueId,
      submissionID: uniqueId,
      MktoSessionSubmissionID: uniqueId,
    });

    let subID = window?.mcz_marketoForm_pref?.program?.subscription?.id || '';
    subID = subID.trim();
    if (subID !== undefined && subID !== null && subID !== '') {
      mkfC.log(`SubID: ${subID}.`);
      form.addHiddenFields({
        mktoOKtoMail: 'U',
        mktoOKtoEmail: 'U',
        mktoOKtoCall: 'U',
        mktoOPContentSubscriptionConsentNotice: privactText,
        mktoOPContentSubscriptionName: subID,
        mktoSessionSubscriptionID: subID,
        mktoOPContentSubscriptionPermissionValue: 'Y',
      });
    }

    if (activeCookie === true) {
      try {
        if (window?.adobeIMS?.isSignedInUser()) {
          if (typeof window._satellite.getVisitorId().getCustomerIDs().adobeid === 'object') {
            if (typeof window._satellite.getVisitorId().getCustomerIDs().adobeid.id === 'string') {
              const sGuid = window._satellite.getVisitorId().getCustomerIDs().adobeid.id;
              if (sGuid !== '') {
                if (window.mcz_marketoForm_pref?.profile !== undefined) {
                  window.mcz_marketoForm_pref.profile.guid = sGuid;
                }

                form.addHiddenFields({ sessionGUID: sGuid });
              }
            }
          }
        }
      } catch (err) {
        //
      }
      if (document.cookie.indexOf('MCMID%7C') > 0 && document.cookie.indexOf('MCAAMLH-') > 0) {
        const mcmid = /MCMID%7C([^%|;]+)/.exec(document.cookie);
        const mcaamlh = /MCAAMLH-[^%|;]+%7C([0-9]+)/.exec(document.cookie);
        if (mcmid && mcaamlh && mcmid.length > 1 && mcaamlh.length > 1) {
          const sEcid = `${mcaamlh[1]}:${mcmid[1]}`;
          if (sEcid.length > 10) {
            if (window.mcz_marketoForm_pref?.profile !== undefined) {
              window.mcz_marketoForm_pref.profile.ecid = sEcid;
            }
            form.addHiddenFields({ sessionECID: sEcid });
            if (sEcid.indexOf(':') > -1) {
              const tempMcid = sEcid.split(':')[1];
              if (tempMcid.length > 5) {
                form.addHiddenFields({ mktoMcid: tempMcid });
              }
            }
          }
        }
      }
      if (document.cookie.indexOf('TID=') > 0) {
        const sCgen = /TID=([^%|;]+)/.exec(document.cookie)[1];
        if (sCgen.length > 5) {
          if (window.mcz_marketoForm_pref?.profile !== undefined) {
            window.mcz_marketoForm_pref.profile.cgen = sCgen;
          }
        }
      }
    } else {
      mkfC.log('No Marketo Cookie found');
    }

    if (typeof window.Demandbase !== 'undefined') {
      if (typeof window?.Demandbase?.Connectors?.WebForm?.fieldMap !== 'undefined') {
        const { dataSource } = window.Demandbase.Connectors.WebForm;
        const { detectedAudience } = window.Demandbase.Connectors.WebForm;
        const { detectedAudienceSegment } = window.Demandbase.Connectors.WebForm;

        const fieldMap = window?.Demandbase?.Connectors?.WebForm?.fieldMap;
        const fieldDBdata = window?.Demandbase?.Connectors?.WebForm?.CompanyProfile;
        if (typeof fieldDBdata !== 'undefined') {
          const fieldMapData = {};
          Object.keys(fieldMap).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(fieldDBdata, key)) {
              fieldMapData[fieldMap[key]] = fieldDBdata[key];
            }
          });
          const fieldMapDataOnForm = {};
          Object.keys(fieldMapData).forEach((key) => {
            if (document.querySelector(`[name="${key}"]`)) {
              fieldMapDataOnForm[key] = fieldMapData[key];
            }
          });

          const fieldMapDataNon = {};
          window.mcz_marketoForm_pref.demandbaseInfo = window.mcz_marketoForm_pref.demandbaseInfo || {};
          Object.keys(fieldDBdata).forEach((key) => {
            window.mcz_marketoForm_pref.demandbaseInfo[key] = fieldDBdata[key];
            if (!Object.prototype.hasOwnProperty.call(fieldMap, key)) {
              fieldMapDataNon[key] = fieldDBdata[key];
            }
          });

          groupLabel = 'Demandbase';
          mkfC.group(groupLabel);
          mkfC.info(`Data Source: ${dataSource}`);
          mkfC.info(`Detected Audience: ${detectedAudience}`);
          mkfC.info(`Detected Audience Segment: ${detectedAudienceSegment}`);
          mkfC.table('Mapped Fields');
          mkfC.table(fieldMapData);
          mkfC.table('Mapped Fields on this Form');
          mkfC.table(fieldMapDataOnForm);
          mkfC.table('Non-Mapped Fields');
          mkfC.table(fieldMapDataNon);
          mkfC.groupEnd(groupLabel);
        }
      }
    }
    fData = form.getValues();
    groupLabel = 'Marketo Submit Validation';
    let groupAppend = '';
    if (testRecord) {
      groupAppend = ' - Test Record';
    }
    mkfC.group(groupLabel);
    mkfC.log(`%cForm Valid:${valid}`, consStyl);
    const ne = new Date();
    mkfC.log(`%cForm Data: @${ne.toLocaleString()}`, consStyl);

    const poiWarn = fData.mktoFormsPrimaryProductInterest;
    if (poiWarn === '') {
      mkfC.log('%cPOI is empty - Critical Field', consStyl);
    } else {
      mkfC.log(`%cPOI: ${poiWarn}`, consStyl);
    }

    const mktoProductionCampaignIdWarn = fData.mktoProductionCampaignId;
    if (mktoProductionCampaignIdWarn === '') {
      mkfC.log('%cProd Campaign ID is empty - Critical Field', consStyl);
    } else {
      mkfC.log(`%cProd Campaign ID: ${mktoProductionCampaignIdWarn}`, consStyl);
    }

    mkfC.table(`Required Fields${groupAppend}`);
    mkfC.table(requiredFieldsData);
    mkfC.table(`All Fields${groupAppend}`);
    mkfC.table(fData);

    mkfC.groupEnd(groupLabel);

    const errorDiv = document.querySelector('div[data-mkto_vis_src="msg-error"]');
    if (!valid) {
      form.submittable(valid);
      const mktoSubmitButton = document.querySelectorAll(`#mktoForm_${formId} button`);
      if (mktoSubmitButton) {
        for (let i = 0; i < mktoSubmitButton.length; i += 1) {
          mktoSubmitButton[i].removeAttribute('disabled');
          if (mktoSubmitButton[i].getAttribute('data-mkto-btn-text')) {
            mktoSubmitButton[i].textContent = mktoSubmitButton[i].getAttribute('data-mkto-btn-text');
          }
        }
      }

      aaInteraction('Marketo Form Error', 'formError', formId, null);
      if (errorDiv) {
        errorDiv.style.display = 'contents';
      }
    } else {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }

      form.submittable(valid);
    }
    return valid;
  });

  setTimeout(() => {
    doBTNUpdate(formId);
  }, 25);

  window.MktoForms2.getForm(formId).onSuccess(() => {
    window.mcz_marketoForm_pref.form.success.confirm = true;
    if (window.aaInteractionsActive === true && aaInteraction !== undefined) {
      aaInteraction('Marketo Form Submission', 'formSubmission', formId, null);
      let delay = 5000;
      if (window.mcz_marketoForm_pref?.form?.success?.delay) {
        delay = parseInt(window.mcz_marketoForm_pref.form.success.delay, 10);
        if (Number.isNaN(delay)) {
          delay = 0;
        }
        if (delay < 0) {
          delay = 0;
        }
        if (delay > 10000) {
          delay = 10000;
        }
        window.mcz_marketoForm_pref.form.success.delay = delay;
      } else {
        window.mcz_marketoForm_pref.form.success.delay = 5000;
      }
      if (mktoFormConfirm !== undefined) {
        clearTimeout(mktoFormConfirm);
      }
      mktoFormConfirm = setTimeout(() => {
        MktoFormsOnSuccess();
      }, delay);
    } else {
      mkfC.log('aaInteractionsActive is false');
      MktoFormsOnSuccess();
    }
    return false;
  });

  mkfC.groupEnd(groupLabel);
}

export function marketoFormSetup(stage) {
  let lvl = stage;
  if (lvl === undefined || lvl === null) {
    lvl = '';
  }
  mkfC.log(`Marketo Form Setup - Triggered ${lvl}`);

  if (lvl === 'stage1') {
    if (typeof window.mcz_marketoForm_pref === 'undefined') {
      mkfC.log('Marketo Form DataLayer - Not Found, using default values');
      window.mcz_marketoForm_pref = window.mcz_marketoForm_pref_example || [];
    } else {
      mkfC.log('mcz_marketoForm_pref is defined, check quality');
      checkAndAddProperties(
        window.mcz_marketoForm_pref,
        window.mcz_marketoForm_pref_example,
        false,
      );
    }

    templateLog = '';

    if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
      mkfC.log('Known Visitor - marketoFormSetup');
      privacyValidation();
    } else {
      checkTemplate();
      renderingReview();
    }

    return;
  }

  if (window.location.href.indexOf('mkto_test') > -1) {
    if (mktoFrmParams.get('mkto_test') === 'active') {
      if (localStorage.getItem('mkto_test_dl')) {
        if (localStorage.getItem('mkto_test') !== 'active') {
          localStorage.setItem('mkto_test', 'active');
        }
        mkfC.log('Test DL Found');
        try {
          const mczMarketoFormPrefTest = JSON.parse(localStorage.getItem('mkto_test_dl'));
          mkfC.log('current data layer', window.mcz_marketoForm_pref);
          mkfC.log('test data layer', mczMarketoFormPrefTest);
          checkAndAddProperties(window.mcz_marketoForm_pref, mczMarketoFormPrefTest, true);
        } catch (error) {
          mkfC.warn('ERROR: parsing error', error);
        }
      }
    } else {
      localStorage.setItem('mkto_test', 'inactive');
      const url = new URL(window.location.href);
      url.searchParams.set('mkto_test', 'inactive');
      window.history.replaceState({}, '', url.href);
    }
  } else if (localStorage.getItem('mkto_test')) {
    if (localStorage.getItem('mkto_test') === 'active') {
      mkfC.log('Redirecting to test version');
      const url = new URL(window.location.href);
      url.searchParams.set('mkto_test', 'active');
      window.location.href = url.href;
    }
  }
  mktoBuildForm();
}
