// <![CDATA[
// ##
// ## Updated 20250523T151736
// ##
// ##
// ## Processing
// ##

import { getMktoFormID, getUniqueId, checkAdobePrivacy } from './global.js';

const mkto_formsLoaded = {};
const mktoFrmParams = new URLSearchParams(window.location.search);
const mktoForm = document.querySelector('.mktoForm');
mktoForm.setAttribute('style', 'opacity:0');
mktoForm.classList.add('starting_fieldset');
let consStyl = 'font-size: 1.2em; color: green; font-weight: bold; ';
let mkfC;
let renderingReview;

export default async function init(mkfCm, renderingReviewS) {
  mkfC = mkfCm;
  renderingReview = renderingReviewS;
  mkfC.log('Form - Begin');

  const unique_id = '';
  const activeCookie = false;

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

          if (typeof window.aaInteraction === 'function') {
            window.aaInteraction(
              'Marketo Form View',
              'formView',
              window?.mcz_marketoForm_pref?.form?.id,
              window?.mcz_marketoForm_pref?.performance?.loadTime,
            );
          }
        }
      }
    });
  });

  mktoPerformanceObserver.observe({ entryTypes: ['measure'] });

  performance.mark('MarketoFormStart');

  window.uFFld = function (form, fieldName, value, critical = false) {
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
          for (let i = 0; i < options.length; i++) {
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
        if (tV.hasOwnProperty(fieldName)) {
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
  };

  mkfC.log('Marketo Form Setup - End');
}

function checkAndAddProperties(obj, defaultObj, replace) {
  for (const prop of Object.keys(defaultObj)) {
    if (typeof obj[prop] === 'undefined') {
      obj[prop] = defaultObj[prop];
    } else if (typeof obj[prop] === 'object' && obj[prop] !== null && typeof defaultObj[prop] === 'object' && defaultObj[prop] !== null) {
      checkAndAddProperties(obj[prop], defaultObj[prop], replace);
    } else if (replace) {
      obj[prop] = defaultObj[prop];
    }
  }
}

export function marketoFormSetup(lvl) {
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

    let templateLog = '';
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
      const templateRule = templates.find((template) => template.hasOwnProperty(templateName));
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
        if (mczPrefs.form.templateVersions.hasOwnProperty(mczPrefs.form.template)) {
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
        if (mczPrefs.form.subtypeTemplate.hasOwnProperty(mczPrefs.form.template)) {
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

    function applyRuleToFields(ruleFields, fields, fieldName) {
      if (!fields) {
        return;
      }
      let matches_Y = '';
      let matches_N = '';
      Object.entries(ruleFields).forEach((entry) => {
        const key = entry[0];
        const ruleArray = entry[1];
        const ruleValue = ruleArray[0].split(':')[0];
        const thisV = ` - '${key}' is set as '${fields[key]}', Rule is '${ruleValue}'`;

        if (fields[key] !== ruleValue) {
          matches_N += `${thisV}\n`;
          fields[key] = ruleValue;
        } else {
          matches_Y += `${thisV}\n`;
        }
      });
      if (matches_Y !== '') {
        matches_Y = `\nMatches:\n${matches_Y}\n`;
      }
      if (matches_N !== '') {
        matches_N = `!!!!!! No Match:\n${matches_N}`;
      }
      aTLg(matches_Y + matches_N);
    }
    if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
      mkfC.log('Known Visitor - marketoFormSetup');
      if (typeof privacyValidation === 'function') {
        privacyValidation();
      }
    } else {
      if (typeof checkTemplate === 'function') {
        checkTemplate();
      }
      if (typeof renderingReview === 'function') {
        renderingReview();
      }
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
          mcz_marketoForm_pref_test = JSON.parse(localStorage.getItem('mkto_test_dl'));
          mkfC.log('current data layer', window.mcz_marketoForm_pref);
          mkfC.log('test data layer', mcz_marketoForm_pref_test);
          checkAndAddProperties(window.mcz_marketoForm_pref, mcz_marketoForm_pref_test, true);
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

  function isTestRecord() {
    let testRecord = 'not_test';
    const here = window.location.href.toLowerCase();

    const email_fld = document.querySelector('.mktoForm[id] [name="Email"]');
    if (email_fld) {
      if (email_fld.value.includes('@adobetest.com')) {
        testRecord = 'test_submit';
        if (email_fld.value.includes('privacytest') || email_fld.value.includes('nosub')) {
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

  function mkto_buildForm() {
    const formId = getMktoFormID();
    // check the size of the cookie for this session
    if (document.cookie.length > 4096) {
      mkfC.warn(`Cookie size > 4k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
    } else if (document.cookie.length > 8192) {
      mkfC.error(`Cookie size > 8k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
    }

    if (typeof formId === 'undefined' || formId === null) {
      return;
    }
    if (!mkto_formsLoaded[formId]) {
      mkto_formsLoaded[formId] = true;
    } else {
      mkfC.log(`Form [${formId}] already loaded`);
      return;
    }

    const group_label = 'Form Setup';
    mkfC.group(group_label);

    function print_niceDL(json) {
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
      function isKeyValuePairObject(obj) {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            return false;
          }
        }
        return true;
      }
      function formatKeyValuePair(node) {
        const maxKeyLength = Math.max(...Object.keys(node).map((key) => key.length));
        const formattedPairs = [];
        for (const key in node) {
          const adjustedKey = key + ' '.repeat(maxKeyLength - key.length);
          const combined = `${adjustedKey} : \t${node[key]}`;
          formattedPairs.push(combined);
        }
        return formattedPairs;
      }
      function logNode(node, nodeName, depth = 0) {
        if (typeof node !== 'object' || node === null) {
          return;
        }
        nodeName = friendlyNames[nodeName] ? friendlyNames[nodeName] : nodeName;
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
        for (const key of simpleKeys) {
          const value = node[key];
          const adjustedKey = key + ' '.repeat(maxKeyLength - key.length);
          mkfC.log(`${adjustedKey} : ${value}`);
        }
        for (const key in node) {
          const value = node[key];
          if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            logNode(value, key, depth + 1); // Increase the depth as we go deeper
          }
        }

        mkfC.groupEnd(group_label);
      }
      function logJson(json) {
        logNode(json);
      }
      logJson(json);
    }
    print_niceDL(mcz_marketoForm_pref);

    isTestRecord();

    MktoForms2.getForm(formId).onValidate((valid) => {
      const formId = getMktoFormID();
      const form = MktoForms2.getForm(formId);
      let fData = form.getValues();
      const uniqueId = getUniqueId(fData);
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

      for (let i = 0; i < requiredFields.length; i++) {
        const fieldName = requiredFields[i].getAttribute('name');
        if (fieldName) {
          if (fData.hasOwnProperty(fieldName)) {
            requiredFieldsData[fieldName] = fData[fieldName];
          }
        }
      }
      for (const key in fData) {
        if (fData.hasOwnProperty(key)) {
          const review = `${fData[key]}`;
          if (review.indexOf('{{') > -1) {
            form.setValues({ [key]: '' });
          }
          if (review !== review.trim()) {
            form.setValues({ [key]: review.trim() });
          }
          if (requiredFieldsData.hasOwnProperty(key)) {
            if (review === '') {
              requiredFieldsFilled = false;
              mkfC.log(`Required Field Missing: ${key}`);
            }
          }
        }
      }
      const countryField = document.querySelector(`#mktoForm_${formId} [name="Country"]`);
      if (countryField) {
        if (countryField.value === '') {
          const options = countryField.querySelectorAll('option');
          if (options && options.length > 0) {
            countryField.value = options[0].value;
          }
        }
      }

      const mktoInvalid_nonreq = document.querySelectorAll(
        `#mktoForm_${formId} .mktoInvalid:not(.mktoRequired)`,
      );
      for (let i = 0; i < mktoInvalid_nonreq.length; i++) {
        mktoInvalid_nonreq[i].classList.remove('mktoInvalid');
      }

      if (requiredFieldsFilled) {
        valid = true;
      } else {
        valid = false;
      }

      if (fData.hasOwnProperty('Email')) {
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

      function mktoFrmsGetValueByName(name) {
        if (!name || typeof name !== 'string') {
          return '';
        }
        const consentCheck = typeof checkAdobePrivacy === 'function' && checkAdobePrivacy();
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
              counter++;
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
        const cgen_sparams = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.params;
        const cgen_cookie_params = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.cookie;

        let mktoTreatmentId = window?.mcz_marketoForm_pref?.profile?.cgen;
        if (mktoTreatmentId === null || mktoTreatmentId === undefined || mktoTreatmentId === '') {
          mktoTreatmentId = '';
        }

        const TID = mktoFrmsGetValueByName('TID');
        const cgen_param = {};
        for (let i = 0; i < cgen_sparams.length; i++) {
          cgen_param[cgen_sparams[i]] = '';
        }
        const cgen_cookie = {};
        for (let i = 0; i < cgen_cookie_params.length; i++) {
          cgen_cookie[cgen_cookie_params[i]] = '';
        }

        if (TID.indexOf('-') > -1) {
          const split_cgen = mktoTreatmentId.split('-');
          if (split_cgen.length > 2) {
            cgen_cookie.trackingid = split_cgen[0];
            cgen_cookie.sdid = split_cgen[1];
            cgen_cookie.promoid = split_cgen[2];
          }
        }
        for (let i = 0; i < cgen_sparams.length; i++) {
          const paramValue = mktoFrmsGetValueByName(cgen_sparams[i]);
          if (paramValue !== '' && paramValue !== null && paramValue !== undefined) {
            cgen_param[cgen_sparams[i]] = paramValue;
          }
        }
        const cgen_keys = Object.keys(cgen_param);
        const cgen_active = [];
        for (let i = 0; i < cgen_keys.length; i++) {
          const keyName = cgen_keys[i];
          const paranval = cgen_param[cgen_keys[i]];
          if (paranval !== '' && paranval !== null && paranval !== undefined) {
            cgen_active.push(paranval);
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
        if (cgen_active.length > 0) {
          form.addHiddenFields({ sessionCGEN: cgen_active.join('-') });
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
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          let value;
          if (window.mcz_marketoForm_pref?.program?.campaignids?.hasOwnProperty(key)) {
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
            let valid = true;
            if (attrMapping[key].starts_with) {
              valid = false;
              for (let j = 0; j < attrMapping[key].starts_with.length; j++) {
                if (value.indexOf(attrMapping[key].starts_with[j]) === 0) {
                  valid = true;
                  break;
                }
              }
              if (!valid) {
                mkfC.log(
                  `Invalid ${attrMapping[key].field
                  } value: ${value
                  } - does not start with ${attrMapping[key].starts_with.join(', ')}`,
                );
              }
            }
            if (attrMapping[key].min_length && value.length > 0 && valid === true) {
              if (value.length < attrMapping[key].min_length) {
                valid = false;
                mkfC.log(
                  `Invalid ${attrMapping[key].field} value: ${value} - too short`,
                );
              }
              if (attrMapping[key].max_length) {
                if (value.length > attrMapping[key].max_length) {
                  valid = false;
                  mkfC.log(
                    `Invalid ${attrMapping[key].field} value: ${value} - too long`,
                  );
                }
              }
            }
            if (valid) {
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
      const mktoformSubtype = mcz_marketoForm_pref?.form?.subtype;
      const mktoFormsTemplate = mcz_marketoForm_pref?.form?.template;
      if (
        mcz_marketoForm_pref?.form?.mktoInstantInquiry !== undefined
        && typeof mcz_marketoForm_pref?.form?.mktoInstantInquiry === 'object'
      ) {
        const chk_ia = mcz_marketoForm_pref?.form?.mktoInstantInquiry;
        if (chk_ia !== null) {
          if (chk_ia[mktoformSubtype] === true) {
            mktoInstantInquiry = true;
          }
        }
      }

      if (mcz_marketoForm_pref?.profile?.known_visitor === true) {
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
      mcz_marketoForm_pref.profile.mktoInstantInquiry = mktoInstantInquiry;

      uFFld(form, 'mktoformType', mcz_marketoForm_pref?.form?.type, true);
      uFFld(form, 'mktoformSubtype', mktoformSubtype, true);
      uFFld(form, 'languagePref', mcz_marketoForm_pref?.profile?.segLangCode, true);
      uFFld(form, 'mktoConsentURL', mcz_marketoForm_pref?.program?.url, true);
      uFFld(form, 'mktoFormsPrimaryProductInterest', mcz_marketoForm_pref?.program?.poi, true);

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
        unique_id,
        submissionID: unique_id,
        MktoSessionSubmissionID: unique_id,
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
            if (typeof _satellite.getVisitorId().getCustomerIDs().adobeid === 'object') {
              if (typeof _satellite.getVisitorId().getCustomerIDs().adobeid.id === 'string') {
                s_guid = _satellite.getVisitorId().getCustomerIDs().adobeid.id;
                if (s_guid !== '') {
                  if (window.mcz_marketoForm_pref?.profile !== undefined) {
                    window.mcz_marketoForm_pref.profile.guid = s_guid;
                  }

                  form.addHiddenFields({ sessionGUID: s_guid });
                }
              }
            }
          }
        } catch (err) { }
        if (document.cookie.indexOf('MCMID%7C') > 0 && document.cookie.indexOf('MCAAMLH-') > 0) {
          const mcmid = /MCMID%7C([^%|;]+)/.exec(document.cookie);
          const mcaamlh = /MCAAMLH-[^%|;]+%7C([0-9]+)/.exec(document.cookie);
          if (mcmid && mcaamlh && mcmid.length > 1 && mcaamlh.length > 1) {
            s_ecid = `${mcaamlh[1]}:${mcmid[1]}`;
            if (s_ecid.length > 10) {
              if (window.mcz_marketoForm_pref?.profile !== undefined) {
                window.mcz_marketoForm_pref.profile.ecid = s_ecid;
              }
              form.addHiddenFields({ sessionECID: s_ecid });
              if (s_ecid.indexOf(':') > -1) {
                const temp_mcid = s_ecid.split(':')[1];
                if (temp_mcid.length > 5) {
                  form.addHiddenFields({ mktoMcid: temp_mcid });
                }
              }
            }
          }
        }
        if (document.cookie.indexOf('TID=') > 0) {
          s_cgen = /TID=([^%|;]+)/.exec(document.cookie)[1];
          if (s_cgen.length > 5) {
            if (window.mcz_marketoForm_pref?.profile !== undefined) {
              window.mcz_marketoForm_pref.profile.cgen = s_cgen;
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
            for (const key in fieldMap) {
              if (fieldMap.hasOwnProperty(key)) {
                if (fieldDBdata.hasOwnProperty(key)) {
                  fieldMapData[fieldMap[key]] = fieldDBdata[key];
                }
              }
            }
            const fieldMapData_onForm = {};
            for (const key in fieldMapData) {
              if (fieldMapData.hasOwnProperty(key)) {
                if (document.querySelector(`[name="${key}"]`)) {
                  fieldMapData_onForm[key] = fieldMapData[key];
                }
              }
            }

            const fieldMapData_non = {};
            mcz_marketoForm_pref.demandbaseInfo = mcz_marketoForm_pref.demandbaseInfo || {};
            for (const key in fieldDBdata) {
              if (fieldDBdata.hasOwnProperty(key)) {
                mcz_marketoForm_pref.demandbaseInfo[key] = fieldDBdata[key];
                if (!fieldMap.hasOwnProperty(key)) {
                  fieldMapData_non[key] = fieldDBdata[key];
                }
              }
            }

            var group_label = 'Demandbase';
            mkfC.group(group_label);
            mkfC.info(`Data Source: ${dataSource}`);
            mkfC.info(`Detected Audience: ${detectedAudience}`);
            mkfC.info(`Detected Audience Segment: ${detectedAudienceSegment}`);
            mkfC.table('Mapped Fields');
            mkfC.table(fieldMapData);
            mkfC.table('Mapped Fields on this Form');
            mkfC.table(fieldMapData_onForm);
            mkfC.table('Non-Mapped Fields');
            mkfC.table(fieldMapData_non);
            mkfC.groupEnd(group_label);
          }
        }
      }
      fData = form.getValues();
      var group_label = 'Marketo Submit Validation';
      let group_append = '';
      if (testRecord) {
        group_append = ' - Test Record';
      }
      mkfC.group(group_label);
      mkfC.log(`%cForm Valid:${valid}`, consStyl);
      const ne = new Date();
      mkfC.log(`%cForm Data: @${ne.toLocaleString()}`, consStyl);

      const poi_warn = fData.mktoFormsPrimaryProductInterest;
      if (poi_warn === '') {
        mkfC.log('%cPOI is empty - Critical Field', consStyl);
      } else {
        mkfC.log(`%cPOI: ${poi_warn}`, consStyl);
      }

      const mktoProductionCampaignId_warn = fData.mktoProductionCampaignId;
      if (mktoProductionCampaignId_warn === '') {
        mkfC.log('%cProd Campaign ID is empty - Critical Field', consStyl);
      } else {
        mkfC.log(`%cProd Campaign ID: ${mktoProductionCampaignId_warn}`, consStyl);
      }

      mkfC.table(`Required Fields${group_append}`);
      mkfC.table(requiredFieldsData);
      mkfC.table(`All Fields${group_append}`);
      mkfC.table(fData);

      mkfC.groupEnd(group_label);

      const errorDiv = document.querySelector('div[data-mkto_vis_src="msg-error"]');
      if (!valid) {
        form.submittable(valid);
        const mktoSubmitButton = document.querySelectorAll(`#mktoForm_${formId} button`);
        if (mktoSubmitButton) {
          for (let i = 0; i < mktoSubmitButton.length; i++) {
            mktoSubmitButton[i].removeAttribute('disabled');
            if (mktoSubmitButton[i].getAttribute('data-mkto-btn-text')) {
              mktoSubmitButton[i].textContent = mktoSubmitButton[i].getAttribute('data-mkto-btn-text');
            }
          }
        }

        if (typeof aaInteraction === 'function') {
          aaInteraction('Marketo Form Error', 'formError', formId, null);
        }
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

    window.mktoDoSubmit = function (formId) {
      const validForm = MktoForms2.getForm(formId).validate();
      const submittable = MktoForms2.getForm(formId).submittable();
      if (submittable) {
        const canSubmit = true;
        if (canSubmit && validForm) {
          const testRecord = isTestRecord();
          if (testRecord === 'test_no_submit') {
            mkfC.log('%c' + 'Test Record Detected - Emulating Marketo Submission', consStyl);

            mcz_marketoForm_pref.form.success.confirm = true;
            if (aaInteractionsActive === true && aaInteraction !== undefined) {
              let delay = 5000;
              aaInteraction('Marketo Form Submission', 'formSubmission', formId, null);
              if (mcz_marketoForm_pref?.form?.success?.delay) {
                delay = parseInt(mcz_marketoForm_pref.form.success.delay);
                if (isNaN(delay)) {
                  delay = 0;
                }
                if (delay < 0) {
                  delay = 0;
                }
                if (delay > 10000) {
                  delay = 10000;
                }
                mcz_marketoForm_pref.form.success.delay = delay;
              } else {
                mcz_marketoForm_pref.form.success.delay = 5000;
              }
              clearTimeout(window.mktoFormConfirm);

              window.mktoFormConfirm = setTimeout(() => {
                if (typeof MktoForms_onSuccess === 'function') {
                  MktoForms_onSuccess();
                } else {
                  mkfC.error('MktoForms_onSuccess is not defined');
                }
              }, delay);
            } else {
              MktoForms_onSuccess();
              mkfC.log('aaInteractionsActive is false');
            }
          } else {
            const mktoSubmitButton = document.querySelector(
              `#mktoForm_${formId} button[type='submit']`,
            );

            if (mktoSubmitButton) {
              mktoSubmitButton.click();
            } else {
              MktoForms2.getForm(formId).submit();
            }
          }
        }
      }
    };

    window.doBTNUpdate = function (formId) {
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
          let subtypeRule = mcz_marketoForm_pref?.form?.subtype;
          const subtypeRules = mcz_marketoForm_pref?.form?.subtypeRules;
          const subtype = mcz_marketoForm_pref?.form?.subtype;
          const language = mcz_marketoForm_pref?.profile?.prefLanguage;
          if (subtype) {
            if (subtypeRules && subtypeRules !== null) {
              subtypeRule = subtypeRules[subtype];
              if (subtypeRule) {
                let translatedSubmit = translateFormElems[subtypeRule];
                if (translatedSubmit) {
                  translatedSubmit = translatedSubmit[language]
                    || translatedSubmit[language.substring(0, 2)]
                    || null;
                  if (translatedSubmit === null) {
                    translatedSubmit = translatedSubmit[subtypeRule];
                    for (const key in translatedSubmit) {
                      if (key.substring(0, 2) === language.substring(0, 2)) {
                        translatedSubmit = translatedSubmit[key];
                        break;
                      }
                    }
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
            const formId = event.target.getAttribute('mkto-form-src');
            if (formId) {
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

              mktoDoSubmit(formId);
            }
          });

          translateButtons('submit');
          translateButtons('pleasewait');
          translateButtons('next');
          translateButtons('back');
          translateButtons('step00of99');
        } else {
          setTimeout(() => {
            window.doBTNUpdate(formId);
          }, 25);
        }
      }
    };

    function translateButtons(translationKey) {
      let append = '';
      const language = mcz_marketoForm_pref?.profile?.prefLanguage;
      let translatedText = translateFormElems?.[translationKey]?.en_us || null;
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
        translatedText = translateFormElems[translationKey][language]
          || translateFormElems[translationKey][language.substring(0, 2)]
          || null;
        if (translatedText === null) {
          for (const key in translateFormElems[translationKey]) {
            if (key.substring(0, 2) === language.substring(0, 2)) {
              translatedText = translateFormElems[translationKey][key];
              break;
            }
          }
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
            const alt_translationKey = button.getAttribute('data-translationKey') || null;
            if (button.getAttribute('data-translationKey') !== null) {
              if (alt_translationKey !== translationKey) {
                translateButtons(alt_translationKey);
              }
            }
          });
      }
    }

    setTimeout(() => {
      window.doBTNUpdate(formId);
    }, 25);

    MktoForms2.getForm(formId).onSuccess((values, followUpUrl) => {
      mcz_marketoForm_pref.form.success.confirm = true;
      if (aaInteractionsActive === true && aaInteraction !== undefined) {
        aaInteraction('Marketo Form Submission', 'formSubmission', formId, null);
        let delay = 5000;
        if (mcz_marketoForm_pref?.form?.success?.delay) {
          delay = parseInt(mcz_marketoForm_pref.form.success.delay);
          if (isNaN(delay)) {
            delay = 0;
          }
          if (delay < 0) {
            delay = 0;
          }
          if (delay > 10000) {
            delay = 10000;
          }
          mcz_marketoForm_pref.form.success.delay = delay;
        } else {
          mcz_marketoForm_pref.form.success.delay = 5000;
        }
        if (window.mktoFormConfirm !== undefined) {
          clearTimeout(window.mktoFormConfirm);
        }
        window.mktoFormConfirm = setTimeout(() => {
          if (typeof MktoForms_onSuccess === 'function') {
            MktoForms_onSuccess();
          } else {
            mkfC.error('MktoForms_onSuccess is not defined');
          }
        }, delay);
      } else {
        mkfC.log('aaInteractionsActive is false');
        if (typeof MktoForms_onSuccess === 'function') {
          MktoForms_onSuccess();
        } else {
          mkfC.error('MktoForms_onSuccess is not defined');
        }
      }
      return false;
    });

    mkfC.groupEnd(group_label);
  }
  window.MktoForms_onSuccess = function () {
    if (window.mktoFormConfirm !== undefined) {
      clearTimeout(window.mktoFormConfirm);
    }
    const group_label = 'Marketo Submit Success';
    mkfC.group(group_label);
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
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    }

    let ty_content = `${mcz_marketoForm_pref?.form?.success?.content}`;
    ty_content = ty_content.trim();

    if (mcz_marketoForm_pref?.form?.success?.type === undefined) {
      mcz_marketoForm_pref.form.success.type = 'redirect';
      logSuccess('Form Success Type not defined, defaulting to redirect');
    }

    if (ty_content !== '' && ty_content !== 'null' && ty_content !== 'undefined') {
      if (MktoFormsValidUrl(ty_content) === true) {
        logSuccess('TY URL');
        if (ty_content.indexOf('http') === -1) {
          logSuccess('TY relative URL');
          if (ty_content.indexOf('/') === 0) {
            ty_content = ty_content.substring(1);
          }
          ty_content = `${window.location.origin}/${ty_url}`;
        }
        logSuccess(`TY is a valid URL: ${ty_content}`);
      } else {
        logSuccess('URL=X >> message.');
        mcz_marketoForm_pref.form.success.type = 'message';
      }
    } else {
      logSuccess('TY=X for lang');

      if (translateFormElems?.thankyou) {
        const language = mcz_marketoForm_pref?.profile?.prefLanguage;
        const tyFallback = 'Thank you.';
        let translatedTY = Object.entries(translateFormElems.thankyou).find(([key]) => key.toLowerCase().startsWith('en'))?.[1] || 'Thank you for your submission.';

        if (language) {
          const langCode = language.substring(0, 2).toLowerCase();
          translatedTY = translateFormElems.thankyou[language]
            || translateFormElems.thankyou[langCode]
            || Object.entries(translateFormElems.thankyou).find(([key]) => key.toLowerCase().startsWith(langCode))?.[1]
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
        ty_content = translatedTY;
      }
    }

    const ne = new Date();
    mkfC.log(`%cForm Data: @${ne.toLocaleString()}`, consStyl);
    logSuccess(`Date: ${ne.toLocaleString()}`);
    logSuccess(`Unique ID: ${window?.mcz_marketoForm_pref?.profile?.unique_id}`);

    mkfC.groupEnd(group_label);

    if (mcz_marketoForm_pref?.form?.success?.type === 'redirect') {
      if (ty_content !== '' && ty_content !== null && ty_content !== undefined) {
        try {
          if (ty_content.indexOf('submissionid') === -1) {
            const unique_id = window?.mcz_marketoForm_pref?.profile?.unique_id;
            if (unique_id) {
              const url = new URL(ty_content);
              url.searchParams.set('submissionid', unique_id);
              ty_content = url.toString();
            }
          }
        } catch (e) {
          mkfC.log('Failed to add submissionid', e);
        }

        window.location.href = ty_content;
      }
    } else {
      if (ty_content === '' || ty_content === 'null' || ty_content === 'undefined') {
        ty_content = 'Thank you for your submission.';
      }

      const form = document.getElementById(`mktoForm_${mcz_marketoForm_pref?.form?.id}`);
      const formWrapper = document.createElement('div');
      formWrapper.classList.add('mktoForm-wrap');

      const formMessageContent = document.createElement('p');
      formMessageContent.classList.add('ty-message');
      formMessageContent.innerHTML = ty_content;
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
  };

  mkto_buildForm();
}
