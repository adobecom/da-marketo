/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
// Privacy Validation - Rule Processing

import { mkfC } from './marketo_form_setup_rules.js';
import { getMktoFormID, checkAdobePrivacy } from './global.js';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  adobeRegionalSite,
  langCode_to_privacylangCode,
  B2B_RFI_COUNTRIES,
  PRIVACY_CODE_DEFAULT,
  PRIVACY_CODE_RULES,
} from './privacy_validation_rules.js';

let PRIVACY_CODE_RULES_clean = [];
let privacy_tests = [];
const privacy_test_results = [];
let mcz_marketoForm_pref_backup;
let has_langbeenSet = false;
let lastCountry = '';
let formObservmktoFormsLocale = false;

function getRandomCountries(numCountries) {
  const countrySelects = document.querySelector('[name="Country"]');
  if (!countrySelects) {
    return [];
  }
  if (!numCountries || numCountries < 1) {
    numCountries = 3;
  }
  if (numCountries >= countrySelects.options.length) {
    return Array.from(countrySelects.options).map((opt) => opt.value);
  }
  const allCountries = Array.from(countrySelects.options).map((opt) => opt.value);
  const availableCountries = allCountries.filter(
    (country) => !B2B_RFI_COUNTRIES.includes(country),
  );
  const randomCountries = [];

  while (randomCountries.length < 5 && availableCountries.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    randomCountries.push(availableCountries[randomIndex]);
    availableCountries.splice(randomIndex, 1);
  }
  return randomCountries;
}

function generateTests(rules) {
  const subtypeRules = window?.mcz_marketoForm_pref?.form?.subtypeRules ?? {};
  const fieldRules = window?.mcz_marketoForm_pref?.field_visibility ?? {};
  if (fieldRules === null) {
    mkfC.log('No Field Rules');
    return [];
  }

  const fieldNames = Object.keys(fieldRules);
  const tests = [];
  function addTest(test) {
    const d = new Date();
    const datetime = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    test.datetime = datetime;
    const testEmail = `privacytest-${datetime.replace(/-/g, '').replace(/ /g, '').replace(/:/g, '')
      }-$$$`
      + '@adobetest.com';
    test.email = testEmail;
    tests.push(test);
  }
  //
  //
  for (const rule of rules) {
    const country_check = rule.countries.length === 0 || rule.countries[0] === ''
      ? getRandomCountries()
      : rule.countries;
    for (const country of country_check) {
      const purposes = rule.purpose.length === 0 || rule.purpose[0] === ''
        ? Object.keys(subtypeRules)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        : rule.purpose;
      let phonetest = false;
      let test;
      for (const purpose of purposes) {
        let countryLabel = country.toUpperCase();
        const countrySelects = document.querySelector(
          `[name="Country"] option[value="${country.toUpperCase()}"]`,
        );
        if (countrySelects) {
          countryLabel = countrySelects.innerText;
        }
        test = {
          rule_no: rule.rule_no,
          country: country.toUpperCase(),
          country_lbl: countryLabel,
          purpose,
          privacycode: rule.privacycode,
          optin_style: rule.optin_style,
          methods: rule.methods,
          partner_name: '',
          partner_visible: rule.partner,
          phone_visible: rule.phone,
        };
        for (let f = 0; f < fieldNames.length; f++) {
          let setting = 'hidden';
          const random_vis = Math.floor(Math.random() * 2);
          if (random_vis > 0) {
            setting = 'visible';
            if (rule.phone && fieldNames[f] === 'phone') {
              phonetest = true;
            }
          }
          test[`field_${fieldNames[f]}`] = setting;
        }
        if (rule.partner) {
          test.partner_name = `Partner Name ${Math.floor(Math.random() * 1000)}`;
          addTest(test);
        } else {
          addTest(test);
        }
      }
      // add extra hidden no partner name test
      if (rule.partner) {
        test.partner_name = '';
        addTest(test);
      }
      // add extra hidden phone test
      if (rule.phone && phonetest === false) {
        test.field_phone = 'hidden';
        addTest(test);
        phonetest = true;
      }
    }
  }
  for (let i = 0; i < tests.length; i++) {
    tests[i].id = `T${(i + 1).toString().padStart(4, '0')}`;
    tests[i].email = tests[i].email.replace('$$$', tests[i].id);
    tests[i].privacycode = tests[i].privacycode.replace(/[-;]+$/g, '');
  }
  return tests;
}

function runTestID(test) {
  const formId = getMktoFormID();
  const form = MktoForms2.getForm(formId);
  const formData = form.getValues();
  const requiredFields = document.querySelectorAll(`#mktoForm_${formId} .mktoRequired`);

  const fieldMap = {
    fn: 'FirstName',
    ln: 'LastName',
    company: 'mktoFormsCompany',
    phone: 'Phone',
    comments: 'mktoQuestionComments',
    demo: 'mktoRequestProductDemo',
    state: 'State',
    postcode: 'PostalCode',
    company_size: 'mktoDemandbaseEmployeeRange',
    website: 'mktodemandbaseWebsite',
    email: 'Email',
    country: 'Country',
    poi: 'mktoFormsPrimaryProductInterest',
    functionalArea: 'mktoFormsFunctionalArea',
  };
  const exampleData = {
    fn: 'John',
    ln: 'Adobe',
    company: 'Adobe',
    phone: '1234567890',
    comments: 'This is a test comment',
    demo: 'true',
    state: '',
    postcode: '12345',
    company_size: '1-10',
    website: 'www.adobe.com',
    email: '',
    country: 'US',
    poi: 'LAST',
    functionalArea: 'LAST',
  };

  for (const key in fieldMap) {
    if (fieldMap.hasOwnProperty(key)) {
      const formField = fieldMap[key];
      let value;
      if (test.hasOwnProperty(key) && test[key] !== '') {
        value = test[key];
      } else {
        value = exampleData.hasOwnProperty(key) ? exampleData[key] : '';
      }
      const field = document.querySelector(`[name="${formField}"]`);
      if (field) {
        if (field.tagName === 'SELECT') {
          if (value === 'LAST') {
            value = field.options[field.options.length - 1].value;
          } else {
            const option = field.querySelector(`option[value="${value}"]`);
            if (option) {
              value = option.value;
            } else {
              value = field.options[field.options.length - 1].value;
            }
          }
        } else {
          field.value = value;
        }
        sleep(250);
        field.dispatchEvent(new Event('change'));
      }
    }
  }
  for (let i = 0; i < requiredFields.length; i++) {
    if (requiredFields[i].value === '') {
      if (requiredFields[i].tagName === 'SELECT') {
        requiredFields[i].value = requiredFields[i].options[requiredFields[i].options.length - 1].value;
        sleep(250);
        requiredFields[i].dispatchEvent(new Event('change'));
      }
    }
  }

  function fetchPrivacyTextObject() {
    const privacy_text = {};

    const privacydivs = document.querySelectorAll('div[data-mkto_vis_src^="adobe-privacy-"]');
    if (!privacydivs.length) {
      mkfC.warn('No divs with attribute data-mkto_vis_src found.');
      return {};
    }
    mkfC.log(privacydivs);
    Array.from(privacydivs).forEach((privacydiv) => {
      const privacydiv_rows = privacydiv.querySelectorAll('legend, .mktoFormRow');
      if (privacydiv_rows.length) {
        let currentKey = '';
        let currentText = '';
        Array.from(privacydiv_rows).forEach((privacydiv_row) => {
          let pending_currentKey = '';
          if (privacydiv_row.tagName === 'LEGEND') {
            pending_currentKey = privacydiv_row.innerText.trim();
            if (pending_currentKey.indexOf('=') > -1) {
              pending_currentKey = pending_currentKey.split('-')[1];
              pending_currentKey = pending_currentKey.trim();
            } else {
              pending_currentKey = '';
            }
            if (pending_currentKey === '') {
              return;
            }
            if (currentKey !== pending_currentKey) {
              currentKey = pending_currentKey;
              privacy_text[currentKey] = '';
            }
            return;
          }
          let currentText_pending = privacydiv_row.innerText.trim();
          currentText_pending = currentText_pending.replace(/(\r\n|\n|\r|\t)/gm, '');
          currentText_pending = currentText_pending.replace(/  +/g, ' ');
          if (currentText_pending !== '') {
            if (currentText !== currentText_pending) {
              currentText = currentText_pending;
            }
            if (privacy_text[currentKey] === '') {
              privacy_text[currentKey] = currentText;
            } else {
              privacy_text[currentKey] = `${privacy_text[currentKey]}\n${currentText}`;
            }
          }
        });
      }
    });
    return privacy_text;
    try {
    } catch (e) {
      mkfC.error('An error occurred while fetching and processing Adobe privacy text:', e);
      return {};
    }
  }

  // Usage
  const privacyTextObject = fetchPrivacyTextObject();
  mkfC.log(privacyTextObject);

  //
  //
  //
}

async function runPrivacyCodeTest(test) {
  if (mcz_marketoForm_pref_backup === null) {
    mcz_marketoForm_pref_backup = JSON.parse(JSON.stringify(window.mcz_marketoForm_pref));
  }
  const tests_full = [];
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
    const langCode = SUPPORTED_LANGUAGES[i];
    const testCopy = JSON.parse(JSON.stringify(test));
    const convertlng = convertLangCodeToPrivacyLangCode(langCode);
    testCopy.langCode = langCode;
    testCopy.segLangCode = convertlng;
    testCopy.id_full = `${testCopy.id}-${convertlng}`;
    tests_full.push(testCopy);
  }
  mkfC.log(tests_full);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderTest(test) {
  window.mcz_marketoForm_pref.profile.prefLanguage = test.langCode;
  window.mcz_marketoForm_pref.profile.segLangCode = test.segLangCode;
  window.mcz_marketoForm_pref.form.subtype = test.purpose;
  field_update_mktoFormsLocale(test.segLangCode);
  sleep(1000);
}

function newTest() {
  const test = privacy_tests[Math.floor(Math.random() * privacy_tests.length)];
  if (test) {
    privacy_tests = privacy_tests.filter((t) => t.id !== test.id);
    localStorage.setItem('mkto_tests', JSON.stringify(privacy_tests));
    mkfC.log(`test:${test.id}, tests remaining`, privacy_tests.length);
    const localCopy_mcz_marketoForm_pref = JSON.parse(
      JSON.stringify(window.mcz_marketoForm_pref),
    );
    mkfC.log('Complete test data', test);
    const dlMap = {
      partner_name: 'program.copartnernames',
      purpose: 'form.subtype',
      langCode: 'profile.prefLanguage',
      segLangCode: 'profile.segLangCode',
      field_comments: 'field_visibility.comments',
      field_company_size: 'field_visibility.company_size',
      field_demo: 'field_visibility.demo',
      field_phone: 'field_visibility.phone',
      field_postcode: 'field_visibility.postcode',
      field_state: 'field_visibility.state',
      field_website: 'field_visibility.website',
    };
    for (const key in dlMap) {
      if (dlMap.hasOwnProperty(key)) {
        const dataLayerPoint = dlMap[key];
        if (test.hasOwnProperty(key) && test[key] !== '') {
          const value = test[key];
          const keys = dataLayerPoint.split('.');
          let obj = localCopy_mcz_marketoForm_pref;
          for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = value;
        }
      }
    }
    localStorage.setItem('mkto_test_full', JSON.stringify(test));
    localStorage.setItem('mkto_test_dl', JSON.stringify(localCopy_mcz_marketoForm_pref));
    const url = new URL(window.location.href);
    url.searchParams.set('mkto_test', 'active');
    window.location.href = url.href;
  }
  return null;
}

function getTestData(what_to_get) {
  let test = localStorage.getItem(what_to_get);
  if (test) {
    try {
      test = JSON.parse(test);
    } catch (error) {
      mkfC.error(error);
      test = null;
    }
    return test;
  }
  return null;
}

function getTest() {
  const test = getTestData('mkto_test_full');
  if (test && test.id) {
    if (privacy_tests.length === 0) {
      getTest_emailCheck();
    }
    mkfC.log(`test:${test.id}, tests remaining: ${privacy_tests.length}`);
    runTestID(test);
  } else {
    newTest();
  }
}

function getTest_emailCheck() {
  const formId = getMktoFormID();
  const email_fld = document.querySelector(`#mktoForm_${formId} [name="Email"]`);
  if (email_fld) {
    //
    //
    if (email_fld.getAttribute('privacytest') === 'true') {
      if (
        email_fld.value.includes('privacytest')
        && email_fld.value.includes('@adobetest.com')
      ) {
      } else {
        // clear this for now
        email_fld.removeAttribute('privacytest');
      }
    } else {
      let testing_review = false;
      if (localStorage.getItem('mkto_test')) {
        if (localStorage.getItem('mkto_test') === 'active') {
          testing_review = true;
        }
      } else if (
        email_fld.value.includes('privacytest')
        && email_fld.value.includes('@adobetest.com')
      ) {
        testing_review = true;
      }
      if (testing_review) {
        email_fld.setAttribute('privacytest', 'true');
        //
        //
        privacy_tests = [];
        if (localStorage.getItem('mkto_test') === 'active') {
          privacy_tests = getTestData('mkto_tests');
        }
        if (privacy_tests === null || privacy_tests.length === 0) {
          mkfC.log('No tests found, generating new tests');
          privacy_tests = generateTests(PRIVACY_CODE_RULES_clean);
          localStorage.setItem('mkto_tests', JSON.stringify(privacy_tests));
          localStorage.setItem('mkto_test', 'active');
        }
        mkfC.log('Test Mode - Enabled');
      }
    }
  }
}

async function check_ip_lang() {
  const callbackName = `callback_${Date.now()}`;
  const url = `https://geo2.adobe.com/json/?callback=${callbackName}`;
  function fetchData(url, callbackName) {
    return new Promise((resolve, reject) => {
      window[callbackName] = function (data) {
        resolve(data);
      };
      const script = document.createElement('script');
      script.src = url;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  try {
    const data = await fetchData(url, callbackName);
    const languages = data['Accept-Language'];
    let firstLanguage = languages.split(',')[0];
    firstLanguage = firstLanguage.replace('-', '_');
    firstLanguage = firstLanguage.toLowerCase();
    return firstLanguage;
  } catch (error) {
    mkfC.error('Error fetching data:', error);
    return 'en_us';
  }
}

function clean_lang_code(langCode) {
  return langCode.trim().toLowerCase().replace('-', '_');
}

function convertLangCodeToPrivacyLangCode(langCode) {
  if (langCode_to_privacylangCode[langCode]) {
    return langCode_to_privacylangCode[langCode];
  }
  if (langCode.length > 2) {
    langCode = langCode.substring(0, 2);
  }
  return langCode;
}

function confirm_lang_ok(langCode) {
  const normalizedLangCode = clean_lang_code(langCode);
  const baseLangCode = normalizedLangCode.split('_')[0];
  let foundCode = null;
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
    const supportedLangCode = SUPPORTED_LANGUAGES[i];
    if (supportedLangCode === normalizedLangCode) {
      foundCode = supportedLangCode;
      break;
    }
  }
  if (foundCode === null) {
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const supportedLangCode = SUPPORTED_LANGUAGES[i];
      if (supportedLangCode.startsWith(baseLangCode)) {
        foundCode = supportedLangCode;
        break;
      }
    }
  }
  return foundCode ?? 'en';
}

function check_content_lang() {
  const url = new URL(window.location.href);
  const isPreview = url.searchParams.get('isPreview');
  const lang = url.searchParams.get('lang');
  if (lang && isPreview === '1') {
    return lang.toLowerCase().replace(/-/g, '_');
  }

  if (document.documentElement.lang) {
    return document.documentElement.lang.toLowerCase().replace(/-/g, '_');
  }
  const metaContentLanguage = document.querySelector('meta[http-equiv="Content-Language"]');
  if (
    metaContentLanguage
    && metaContentLanguage.hasAttribute('lang')
    && metaContentLanguage.lang !== ''
  ) {
    return metaContentLanguage.lang.toLowerCase().replace(/-/g, '_');
  }
  return null;
}

function check_browser_lang() {
  const sources = [
    window?.adobeid?.locale,
    window?.adobeIMS?.adobeIdData?.locale,
    window?.dexter?.Analytics?.language,
    navigator.language,
    navigator.userLanguage,
  ];
  return sources.find((lang) => typeof lang !== 'undefined') ?? null;
}

function dl_update_lang_pref(proposedLanguage) {
  if (window.mcz_marketoForm_pref && window.mcz_marketoForm_pref.profile) {
    window.mcz_marketoForm_pref.profile.prefLanguage = confirm_lang_ok(proposedLanguage);
    window.mcz_marketoForm_pref.profile.segLangCode = convertLangCodeToPrivacyLangCode(proposedLanguage);
  }
}

async function fetch_lang_code() {
  let proposedBrowserLanguage = null;
  const url = new URL(window.location.href);
  const lang = url.searchParams.get('lang');
  if (lang) {
    proposedBrowserLanguage = lang;
    proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
    if (
      proposedBrowserLanguage !== 'en'
      && proposedBrowserLanguage !== null
      && proposedBrowserLanguage !== ''
    ) {
      if (has_langbeenSet === false) {
        dl_update_lang_pref(proposedBrowserLanguage);
        field_update_mktoFormsLocale(proposedBrowserLanguage);
      }
      return proposedBrowserLanguage;
    }
  }

  proposedBrowserLanguage = window?.mcz_marketoForm_pref?.profile?.prefLanguage ?? null;
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
    if (has_langbeenSet === false) {
      dl_update_lang_pref(proposedBrowserLanguage);
      field_update_mktoFormsLocale(proposedBrowserLanguage);
    }
    return proposedBrowserLanguage;
  }
  proposedBrowserLanguage = check_content_lang();
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
    dl_update_lang_pref(proposedBrowserLanguage);
    field_update_mktoFormsLocale(proposedBrowserLanguage);
    // mkfC.log("proposedBrowserLanguage : ", proposedBrowserLanguage);
    return proposedBrowserLanguage;
  }
  proposedBrowserLanguage = check_browser_lang();
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
    dl_update_lang_pref(proposedBrowserLanguage);
    field_update_mktoFormsLocale(proposedBrowserLanguage);
    // mkfC.log("proposedBrowserLanguage  : ", proposedBrowserLanguage);
    return proposedBrowserLanguage;
  }
  check_ip_lang()
    .then((lang) => {
      proposedBrowserLanguage = confirm_lang_ok(lang) ?? DEFAULT_LANGUAGE;
      dl_update_lang_pref(proposedBrowserLanguage);
      field_update_mktoFormsLocale(proposedBrowserLanguage);
    })
    .catch((error) => {
      mkfC.error(error);
      proposedBrowserLanguage = DEFAULT_LANGUAGE;
    });
  return proposedBrowserLanguage;
}

function field_update_privacy_code(privacycode) {
  if (typeof privacycode === 'undefined') {
    return;
  }

  logPrivacy(`field_update_privacy_code >>${privacycode}`);
  const mktoConsentNoticeField = document.querySelector('[name="mktoConsentNotice"]');
  if (mktoConsentNoticeField) {
    privacycode = `${privacycode}`;
    privacycode = privacycode.replace('undefined', '');
    privacycode = privacycode.trim();
    privacycode = privacycode.replace(/[-;]+$/g, '');

    let temp = mktoConsentNoticeField.value;
    const d = new Date();
    const n = d.getTime();
    // we have a privacy code and it is different from the current value
    if (privacycode !== '' && temp !== privacycode) {
      mktoConsentNoticeField.value = privacycode; // + "::" + n;
      logPrivacy('privacycode is set');
    } else if (temp !== '') {
      // we already have a privacy code so we will keep it
      temp = temp.split('::')[0];
      mktoConsentNoticeField.value = temp; // + "::" + n;
      logPrivacy('privacycode is kept');
    } else if (privacycode === 'blank') {
      // we have no privacy code we will blank it out
      mktoConsentNoticeField.value = ''; // + "::" + n;
      logPrivacy('privacycode is removed');
    }
    const event = new Event('change', { bubbles: true });
    mktoConsentNoticeField.dispatchEvent(event);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        mktoConsentNoticeField.dispatchEvent(event);
      }, 50 * i);
    }
    field_update_mktoFormsLocale('');
  } else {
    mkfC.error('mktoConsentNoticeField not found');
  }
}

function field_update_mktoFormsLocale(proposedLanguage) {
  const mktoFormsLocaleField = document.querySelector('[name="mktoFormsLocale"]');
  // mkfC.log("field_update_mktoFormsLocale >>" + proposedLanguage);
  if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
    logPrivacy('Known Visitor - field_update_mktoFormsLocale');
    return;
  }
  if (mktoFormsLocaleField) {
    let temp = mktoFormsLocaleField.value;
    proposedLanguage = `${proposedLanguage}`;
    proposedLanguage = proposedLanguage.replace('undefined', '');
    proposedLanguage = proposedLanguage.trim();
    const d = new Date();
    const n = d.getTime();
    if (proposedLanguage !== '' && temp !== proposedLanguage) {
      mktoFormsLocaleField.value = proposedLanguage; // + "::" + n;
    } else {
      temp = temp.split('::')[0];
      mktoFormsLocaleField.value = temp; // + "::" + n;
    }

    has_langbeenSet = true;
    const event = new Event('change', { bubbles: true });
    mktoFormsLocaleField.dispatchEvent(event);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        mktoFormsLocaleField.dispatchEvent(event);
      }, 50 * i);
    }
  } else {
    setTimeout(() => {
      field_update_mktoFormsLocale(proposedLanguage);
    }, 20);
  }
}

function logPrivacy(message) {
  if (typeof message === 'object') {
    message = JSON.stringify(message, null, 2);
  }
  mkfC.log(`%c${message}`, 'font-size: 1.2em; color:#eb1301; font-weight: bold; ');
}

function addListenerToCountry() {
  const country_fld = document.querySelector('[name="Country"]');
  if (country_fld) {
    if (!country_fld.classList.contains('fnc_field_change_country')) {
      country_fld.classList.add('fnc_field_change_country');
      country_fld.addEventListener('change', (event) => {
        field_change_country(event);
      });
      const parent_mktoFormRow = country_fld.closest(
        '.mktoFormRow:not(.fnc_field_observer_country)',
      );
      if (parent_mktoFormRow) {
        parent_mktoFormRow.classList.add('fnc_field_observer_country');
        const observer = new MutationObserver((mutations) => {
          clearTimeout(window.fnc_field_observer_country_timeout);
          window.fnc_field_observer_country_timeout = setTimeout(() => {
            addListenerToCountry();
          }, 100);
        });
        observer.observe(parent_mktoFormRow.parentElement, {
          attributes: false,
          childList: true,
          subtree: true,
        });
      }
    }
  }
}
function matchCriteria(rule, country, purpose, phoneVisible, copartnernames, subscription) {
  const scores = {
    Country: 10,
    Partner: 10,
    Purpose: 10,
    Phone: 10,
    Subscription: 10,
  };

  const matches = [];
  if (rule.countries.length > 0 && rule.countries.includes(country.toLowerCase())) {
    matches.push('Country');

    if (rule.purpose.length > 0 && rule.purpose.includes(purpose.toLowerCase())) {
      matches.push('Purpose');
    }
    if (rule.partner === true && copartnernames.trim() !== '') {
      matches.push('Partner');
    }
    if (rule.subscription === true && subscription.trim() !== '') {
      matches.push('Subscription');
    }
    if (phoneVisible === true && rule.methods.includes('phone')) {
      matches.push('Phone');
    }
  }
  if (rule.countries.length === 0) {
    if (rule.purpose.length > 0 && rule.purpose.includes(purpose.toLowerCase())) {
      matches.push('Purpose');
    }
    if (rule.partner === true && copartnernames.trim() !== '') {
      matches.push('Partner');
    }
    if (rule.subscription === true && subscription.trim() !== '') {
      matches.push('Subscription');
    }
    if (phoneVisible === true && rule.methods.includes('phone')) {
      matches.push('Phone');
    }
  }

  const totalScore = matches.reduce((sum, match) => sum + scores[match], 0);
  return { matches, totalScore };
}

function findBestMatchingRule(
  rules,
  country,
  purpose,
  phoneVisible,
  copartnernames,
  subscription,
) {
  let sortedRules = rules
    .slice()
    .map((rule) => ({
      rule,
      ...matchCriteria(rule, country, purpose, phoneVisible, copartnernames, subscription),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  sortedRules = sortedRules.filter((rule) => rule.totalScore > 0);

  if (sortedRules.length === 0) {
    return {
      rule: null,
      matches: [],
    };
  }

  const bestRule = sortedRules[0];
  return {
    rule: bestRule.rule,
    matches: bestRule.matches,
  };
}

async function field_change_country(mainevent) {
  let country = mainevent.target.value.toLowerCase().trim();
  if (country === '') {
    lastCountry = '';
    field_update_privacy_code('blank');
    return;
  }
  if (country === lastCountry) {
    return;
  }
  lastCountry = country;
  const group_label = 'Privacy Statement Validation';
  mkfC.group(group_label);

  const purpose = window?.mcz_marketoForm_pref?.form?.subtype ?? '';
  let { privacycode } = PRIVACY_CODE_DEFAULT; // Default unless we find a rule.
  let ruleMatch = 0;
  let matchType = 'default';
  let copartnernames = '';
  let subscriptionID = '';
  let subscriptionName = '';
  let localRules = [];
  if ((PRIVACY_CODE_RULES_clean || []).length === 0) {
    let localRules_tmp = JSON.stringify(PRIVACY_CODE_RULES);
    localRules_tmp = localRules_tmp.toLowerCase();
    localRules = JSON.parse(localRules_tmp);
    for (let i = 0; i < localRules.length; i++) {
      const rule = localRules[i];
      localRules[i].partner = false;
      localRules[i].phone = false;
      localRules[i].subscription = false;
      localRules[i].rule_no = `R${(i + 1).toString().padStart(3, '0')}`;
      if (rule.purpose.length) {
        for (let j = 0; j < rule.purpose.length; j++) {
          if (rule.purpose[j].trim() === '') {
            localRules[i].purpose.splice(j, 1);
          }
        }
      }
      if (rule.countries.length) {
        for (let j = 0; j < rule.countries.length; j++) {
          if (rule.countries[j].trim() === '') {
            localRules[i].countries.splice(j, 1);
          }
        }
      }
    }
    for (let i = 0; i < localRules.length; i++) {
      const rule = localRules[i];
      if (rule.methods.length) {
        for (let j = 0; j < rule.methods.length; j++) {
          if (rule.methods[j].trim() === 'partner') {
            localRules[i].partner = true;
          }
          if (rule.methods[j].trim() === 'phone') {
            localRules[i].phone = true;
          }
          if (rule.methods[j].trim() === 'subscription') {
            localRules[i].subscription = true;
          }
        }
      }
    }
    PRIVACY_CODE_RULES_clean = localRules;
  } else {
    localRules = PRIVACY_CODE_RULES_clean;
  }

  if (
    typeof window?.mcz_marketoForm_pref?.program?.copartnernames?.trim() !== 'undefined'
    && window?.mcz_marketoForm_pref?.program?.copartnernames?.trim() !== ''
  ) {
    copartnernames = (window.mcz_marketoForm_pref.program.copartnernames || '')
      .replace(/[ ,]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }

  if (
    typeof window?.mcz_marketoForm_pref?.program?.subscription?.id?.trim() !== 'undefined'
    && window?.mcz_marketoForm_pref?.program?.subscription?.id?.trim() !== ''
  ) {
    subscriptionID = (window.mcz_marketoForm_pref.program.subscription.id || '')
      .replace(/[ ,]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }

  if (
    typeof window?.mcz_marketoForm_pref?.program?.subscription?.name?.trim() !== 'undefined'
    && window?.mcz_marketoForm_pref?.program?.subscription?.name?.trim() !== ''
  ) {
    subscriptionName = (window.mcz_marketoForm_pref.program.subscription.name || '')
      .replace(/[ ,]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }

  logPrivacy('Active Privacy Rules');
  mkfC.groupCollapsed('Privacy Rules Details');
  mkfC.table(localRules);
  localRules.forEach((rule) => {
    logPrivacy(`\n\nPrivacy Rule [${rule.rule_no}]`);
    mkfC.groupCollapsed(`Privacy Rule [${rule.rule_no}]`);
    mkfC.table(rule);
    mkfC.groupEnd(`Privacy Rule [${rule.rule_no}]`);
  });
  mkfC.groupEnd('Privacy Rules Details');

  let phoneVisible = false;
  let phoneVis = window?.mcz_marketoForm_pref?.field_visibility?.phone ?? '';
  phoneVis = phoneVis.toLowerCase();
  if (
    phoneVis === 'visible'
    || phoneVis === 'show'
    || phoneVis === 'all'
    || phoneVis === 'required'
  ) {
    phoneVisible = true;
  } else {
    const phoneField = document.querySelector('[name="Phone"]');
    if (phoneField) {
      let phoneFieldParent = phoneField;
      while (phoneFieldParent) {
        if (
          phoneFieldParent.style.display !== 'none'
          && phoneFieldParent.style.visibility !== 'hidden'
          && phoneFieldParent.style.opacity !== '0'
          && phoneFieldParent.style.height !== '0px'
          && phoneFieldParent.style.width !== '0px'
          && phoneFieldParent.style.maxHeight !== '0px'
          && phoneFieldParent.style.maxWidth !== '0px'
          && phoneFieldParent.style.minHeight !== '0px'
          && phoneFieldParent.style.minWidth !== '0px'
        ) {
          phoneFieldVisible = true;
          break;
        }
        phoneFieldParent = phoneFieldParent.parentElement;
      }
    }
  }
  let { rule: matchingRule, matches } = findBestMatchingRule(
    localRules,
    country,
    purpose,
    phoneVisible,
    copartnernames ?? '',
    subscriptionID ?? '',
  );

  if (matchingRule === null) {
    matchingRule = PRIVACY_CODE_DEFAULT;
    matches = [];
  } else {
    ruleMatch = matchingRule.rule_no;
    matchType = matches.join(',');
  }

  privacyCode = matchingRule.privacycode;
  country = country.toUpperCase();
  if (privacyCode.includes(';')) {
    splitCode = privacyCode.split(';');
    splitCode[0] = splitCode[0].slice(0, 2).toLowerCase() + splitCode[0].slice(2).toUpperCase();
    privacycode = splitCode.join(';');
  }
  let confirmMsg = '';
  if (matchingRule.partner === true) {
    confirmMsg = `Partner [${copartnernames}] `;
  }
  if (matchingRule.subscription === true) {
    confirmMsg = `${confirmMsg}Subscription [${subscriptionID}:${subscriptionName}] `;
  }
  confirmMsg = `${confirmMsg}Country [${country}] Form Purpose [${purpose}] `;
  logPrivacy(confirmMsg);
  logPrivacy(`Privacy Rule [${ruleMatch}] Matched using [${matchType}]`);
  logPrivacy(
    `Base Privacy Code [${matchingRule.privacycode
    }] Style [${matchingRule.optin_style
    }]`,
  );
  logPrivacy(matchingRule);

  const proposedBrowserLanguage = await fetch_lang_code();
  window.mcz_marketoForm_pref.profile.privacy_optin = matchingRule.optin_style;
  if (PRIVACY_CODE_DEFAULT.privacy_links) {
    const tempPrivacyLinks = JSON.parse(JSON.stringify(PRIVACY_CODE_DEFAULT.privacy_links));
    const matchingRulePrivacyLinks = JSON.parse(JSON.stringify(matchingRule.privacy_links));
    for (const key in matchingRulePrivacyLinks) {
      tempPrivacyLinks[key] = matchingRulePrivacyLinks[key];
    }

    let rSLChk = check_content_lang();
    if (rSLChk === null || rSLChk === '') {
      rSLChk = 'en_us';
    }
    if (rSLChk.length < 3 || rSLChk.indexOf('_') < 0) {
      rSLChk = `${rSLChk}_${rSLChk}`;
    }
    let localRegionalSite = adobeRegionalSite[rSLChk];
    if (typeof localRegionalSite === 'undefined' || localRegionalSite === null) {
      localRegionalSite = '';
    }
    if (localRegionalSite === '') {
      if (localRegionalSite.indexOf('en') !== 0) {
        let rSLChk = check_content_lang();
        if (rSLChk === null || rSLChk === '') {
          rSLChk = 'en_us';
        }
        rSLChk = rSLChk.substring(0, 2);
        rSLChk = rSLChk.toLowerCase();
        const keys = Object.keys(adobeRegionalSite);
        const filteredKeys = keys.filter((key) => key.startsWith(rSLChk));
        if (filteredKeys.length > 0) {
          logPrivacy(
            `Regional Site not found for [${rSLChk}] using [${filteredKeys[0]}]`,
          );
          localRegionalSite = adobeRegionalSite[filteredKeys[0]];
        }
      } else {
        logPrivacy(`Regional Site not found for [${rSLChk}]`);
      }
    }
    let base_site = `${mcz_marketoForm_pref?.form?.baseSite}`;
    if (base_site === '' || base_site === 'undefined') {
      base_site = 'https://www.adobe.com';
    }

    logPrivacy(`Regional Site [${base_site}/${localRegionalSite}]`);
    for (const key in tempPrivacyLinks) {
      let privacy_link = tempPrivacyLinks[key];
      if (privacy_link.toLowerCase().indexOf('{adoberegionalsite}') > -1) {
        if (localRegionalSite !== '') {
          privacy_link = privacy_link.replace(/{adobeRegionalSite}/gi, localRegionalSite);
        } else {
          privacy_link = privacy_link.replace(/{adobeRegionalSite}\//gi, '');
        }
        tempPrivacyLinks[key] = privacy_link;
      }
    }

    window.mcz_marketoForm_pref.profile.privacy_links = tempPrivacyLinks;
    logPrivacy('Privacy Links');
    mkfC.table(tempPrivacyLinks);
  }

  const countryOption = document.querySelectorAll(`option[value="${country}"]`);
  if (countryOption.length) {
    window.mcz_marketoForm_pref.profile.privacy_country = countryOption?.[0].innerText;
  }

  privacycode = privacycode.replace(
    '<lc>',
    convertLangCodeToPrivacyLangCode(proposedBrowserLanguage),
  );
  if (copartnernames === '') {
    privacycode = privacycode.replace('-<partner>', '');
  } else {
    privacycode = privacycode.replace('-<partner>', `-${copartnernames}`);
  }
  privacycode = privacycode.replace(/[-;]+$/g, '');

  window.mcz_marketoForm_pref.profile.privacy = window.mcz_marketoForm_pref.profile.privacy || {};
  window.mcz_marketoForm_pref.profile.privacy.code = privacycode;

  logPrivacy(
    `Final Privacy Code [${privacycode}] from Language [${proposedBrowserLanguage}]`,
  );
  field_update_privacy_code(privacycode);

  getTest_emailCheck();

  mkfC.groupEnd(group_label);
}

async function wait_for_field_country() {
  const mktoFormsLocale_fld = document.querySelector('[name="mktoFormsLocale"]');
  if (document.querySelectorAll('.mktoForm').length > 0) {
    if (mktoFormsLocale_fld !== null) {
      formObservmktoFormsLocale = true;

      const formId = getMktoFormID();
      const countryField = document.querySelector(`#mktoForm_${formId} [name="Country"]`);
      if (countryField) {
        if (countryField.value === '') {
          const options = countryField.querySelectorAll('option');
          if (options && options.length > 0) {
            countryField.value = options[0].value;
          }
        }
      }
    }
  }
  if (formObservmktoFormsLocale) {
    addListenerToCountry();

    setTimeout(fetch_lang_code, 10);
    setTimeout(field_update_privacy_code, 10);
  } else if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
    mkfC.log('Known Visitor - language code');
    fetch_lang_code();
  } else {
    setTimeout(wait_for_field_country, 20);
  }
}

export function privacyValidation() {
  mkfC.log('Privacy Validation - Run');
  wait_for_field_country();
}

export default async function init(marketoFormSetup) {
  if (typeof form_dynamics !== 'undefined') {
    if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
      mkfC.log('Known Visitor - Privacy Validation - Skip');
    } else {
      marketoFormSetup('stage1');
    }
  }

  mkfC.log('Privacy Validation - Loaded');
}
