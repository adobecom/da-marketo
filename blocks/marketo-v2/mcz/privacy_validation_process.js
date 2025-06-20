/* eslint-disable max-len */
// Privacy Validation - Rule Processing

import { mkfC } from './marketo_form_setup_rules.js';
import { getMktoFormID } from './global.js';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  adobeRegionalSite,
  langCodeToPrivacylangCode,
  B2B_RFI_COUNTRIES,
  PRIVACY_CODE_DEFAULT,
  PRIVACY_CODE_RULES,
} from './privacy_validation_rules.js';

let privacyCodeRulesClean = [];
let privacyTests = [];
let hasLangbeenSet = false;
let lastCountry = '';
let formObservmktoFormsLocale = false;

function getRandomCountries(num) {
  let numCountries = num;
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
  rules.forEach((rule) => {
    const countryCheck = rule.countries.length === 0 || rule.countries[0] === ''
      ? getRandomCountries()
      : rule.countries;
    countryCheck.forEach((country) => {
      const purposes = rule.purpose.length === 0 || rule.purpose[0] === ''
        ? Object.keys(subtypeRules)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
        : rule.purpose;
      let phonetest = false;
      let test;
      purposes.forEach((purpose) => {
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
        fieldNames.forEach((fieldName) => {
          let setting = 'hidden';
          const randomVis = Math.floor(Math.random() * 2);
          if (randomVis > 0) {
            setting = 'visible';
            if (rule.phone && fieldName === 'phone') {
              phonetest = true;
            }
          }
          test[`field_${fieldName}`] = setting;
        });
        if (rule.partner) {
          test.partner_name = `Partner Name ${Math.floor(Math.random() * 1000)}`;
          addTest(test);
        } else {
          addTest(test);
        }
      });
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
    });
  });
  for (let i = 0; i < tests.length; i += 1) {
    tests[i].id = `T${(i + 1).toString().padStart(4, '0')}`;
    tests[i].email = tests[i].email.replace('$$$', tests[i].id);
    tests[i].privacycode = tests[i].privacycode.replace(/[-;]+$/g, '');
  }
  return tests;
}

function getTestData(whatToGet) {
  let test = localStorage.getItem(whatToGet);
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

function getTestEmailCheck() {
  const formId = getMktoFormID();
  const emailFld = document.querySelector(`#mktoForm_${formId} [name="Email"]`);
  if (emailFld) {
    //
    //
    if (emailFld.getAttribute('privacytest') === 'true') {
      if (
        emailFld.value.includes('privacytest')
        && emailFld.value.includes('@adobetest.com')
      ) {
        // we are in test mode
      } else {
        // clear this for now
        emailFld.removeAttribute('privacytest');
      }
    } else {
      let testingReview = false;
      if (localStorage.getItem('mkto_test')) {
        if (localStorage.getItem('mkto_test') === 'active') {
          testingReview = true;
        }
      } else if (
        emailFld.value.includes('privacytest')
        && emailFld.value.includes('@adobetest.com')
      ) {
        testingReview = true;
      }
      if (testingReview) {
        emailFld.setAttribute('privacytest', 'true');
        //
        //
        privacyTests = [];
        if (localStorage.getItem('mkto_test') === 'active') {
          privacyTests = getTestData('mkto_tests');
        }
        if (privacyTests === null || privacyTests.length === 0) {
          mkfC.log('No tests found, generating new tests');
          privacyTests = generateTests(privacyCodeRulesClean);
          localStorage.setItem('mkto_tests', JSON.stringify(privacyTests));
          localStorage.setItem('mkto_test', 'active');
        }
        mkfC.log('Test Mode - Enabled');
      }
    }
  }
}

function fetchData(url, callbackName) {
  return new Promise((resolve, reject) => {
    window[callbackName] = (data) => {
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = url;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function checkIpLang() {
  const callbackName = `callback_${Date.now()}`;
  const url = `https://geo2.adobe.com/json/?callback=${callbackName}`;
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

function cleanLangCode(langCode) {
  return langCode.trim().toLowerCase().replace('-', '_');
}

function convertLangCodeToPrivacyLangCode(code) {
  let langCode = code;
  if (langCodeToPrivacylangCode[langCode]) {
    return langCodeToPrivacylangCode[langCode];
  }
  if (langCode.length > 2) {
    langCode = langCode.substring(0, 2);
  }
  return langCode;
}

function confirmLangOk(langCode) {
  const normalizedLangCode = cleanLangCode(langCode);
  const baseLangCode = normalizedLangCode.split('_')[0];
  let foundCode = null;
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i += 1) {
    const supportedLangCode = SUPPORTED_LANGUAGES[i];
    if (supportedLangCode === normalizedLangCode) {
      foundCode = supportedLangCode;
      break;
    }
  }
  if (foundCode === null) {
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i += 1) {
      const supportedLangCode = SUPPORTED_LANGUAGES[i];
      if (supportedLangCode.startsWith(baseLangCode)) {
        foundCode = supportedLangCode;
        break;
      }
    }
  }
  return foundCode ?? 'en';
}

function checkContentLang() {
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

function checkBrowserLang() {
  const sources = [
    window?.adobeid?.locale,
    window?.adobeIMS?.adobeIdData?.locale,
    window?.dexter?.Analytics?.language,
    navigator.language,
    navigator.userLanguage,
  ];
  return sources.find((lang) => typeof lang !== 'undefined') ?? null;
}

function dlUpdateLangPref(proposedLanguage) {
  if (window.mcz_marketoForm_pref && window.mcz_marketoForm_pref.profile) {
    window.mcz_marketoForm_pref.profile.prefLanguage = confirmLangOk(proposedLanguage);
    window.mcz_marketoForm_pref.profile.segLangCode = convertLangCodeToPrivacyLangCode(proposedLanguage);
  }
}

function logPrivacy(logData) {
  let message = logData;
  if (typeof message === 'object') {
    message = JSON.stringify(message, null, 2);
  }
  mkfC.log(`%c${message}`, 'font-size: 1.2em; color:#eb1301; font-weight: bold; ');
}

function fieldUpdateMktoFormsLocale(locale) {
  let proposedLanguage = locale;
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
    if (proposedLanguage !== '' && temp !== proposedLanguage) {
      mktoFormsLocaleField.value = proposedLanguage; // + "::" + n;
    } else {
      [temp] = temp.split('::');
      mktoFormsLocaleField.value = temp; // + "::" + n;
    }

    hasLangbeenSet = true;
    const event = new Event('change', { bubbles: true });
    mktoFormsLocaleField.dispatchEvent(event);
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => {
        mktoFormsLocaleField.dispatchEvent(event);
      }, 50 * i);
    }
  } else {
    setTimeout(() => {
      fieldUpdateMktoFormsLocale(proposedLanguage);
    }, 20);
  }
}

async function fetchLangCode() {
  let proposedBrowserLanguage = null;
  const url = new URL(window.location.href);
  const lang = url.searchParams.get('lang');
  if (lang) {
    proposedBrowserLanguage = lang;
    proposedBrowserLanguage = confirmLangOk(proposedBrowserLanguage);
    if (
      proposedBrowserLanguage !== 'en'
      && proposedBrowserLanguage !== null
      && proposedBrowserLanguage !== ''
    ) {
      if (hasLangbeenSet === false) {
        dlUpdateLangPref(proposedBrowserLanguage);
        fieldUpdateMktoFormsLocale(proposedBrowserLanguage);
      }
      return proposedBrowserLanguage;
    }
  }

  proposedBrowserLanguage = window?.mcz_marketoForm_pref?.profile?.prefLanguage ?? null;
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirmLangOk(proposedBrowserLanguage);
    if (hasLangbeenSet === false) {
      dlUpdateLangPref(proposedBrowserLanguage);
      fieldUpdateMktoFormsLocale(proposedBrowserLanguage);
    }
    return proposedBrowserLanguage;
  }
  proposedBrowserLanguage = checkContentLang();
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirmLangOk(proposedBrowserLanguage);
    dlUpdateLangPref(proposedBrowserLanguage);
    fieldUpdateMktoFormsLocale(proposedBrowserLanguage);
    // mkfC.log("proposedBrowserLanguage : ", proposedBrowserLanguage);
    return proposedBrowserLanguage;
  }
  proposedBrowserLanguage = checkBrowserLang();
  if (proposedBrowserLanguage !== null && proposedBrowserLanguage !== '') {
    proposedBrowserLanguage = confirmLangOk(proposedBrowserLanguage);
    dlUpdateLangPref(proposedBrowserLanguage);
    fieldUpdateMktoFormsLocale(proposedBrowserLanguage);
    // mkfC.log("proposedBrowserLanguage  : ", proposedBrowserLanguage);
    return proposedBrowserLanguage;
  }
  checkIpLang()
    .then((language) => {
      proposedBrowserLanguage = confirmLangOk(language) ?? DEFAULT_LANGUAGE;
      dlUpdateLangPref(proposedBrowserLanguage);
      fieldUpdateMktoFormsLocale(proposedBrowserLanguage);
    })
    .catch((error) => {
      mkfC.error(error);
      proposedBrowserLanguage = DEFAULT_LANGUAGE;
    });
  return proposedBrowserLanguage;
}

function fieldUpdatePrivacyCode(code) {
  let privacyCode = code;
  if (typeof privacyCode === 'undefined') {
    return;
  }

  logPrivacy(`field_update_privacy_code >>${privacyCode}`);
  const mktoConsentNoticeField = document.querySelector('[name="mktoConsentNotice"]');
  if (mktoConsentNoticeField) {
    privacyCode = `${privacyCode}`;
    privacyCode = privacyCode.replace('undefined', '');
    privacyCode = privacyCode.trim();
    privacyCode = privacyCode.replace(/[-;]+$/g, '');

    let temp = mktoConsentNoticeField.value;
    // we have a privacy code and it is different from the current value
    if (privacyCode !== '' && temp !== privacyCode) {
      mktoConsentNoticeField.value = privacyCode; // + "::" + n;
      logPrivacy('privacycode is set');
    } else if (temp !== '') {
      // we already have a privacy code so we will keep it
      [temp] = temp.split('::');
      mktoConsentNoticeField.value = temp; // + "::" + n;
      logPrivacy('privacycode is kept');
    } else if (privacyCode === 'blank') {
      // we have no privacy code we will blank it out
      mktoConsentNoticeField.value = ''; // + "::" + n;
      logPrivacy('privacycode is removed');
    }
    const event = new Event('change', { bubbles: true });
    mktoConsentNoticeField.dispatchEvent(event);
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => {
        mktoConsentNoticeField.dispatchEvent(event);
      }, 50 * i);
    }
    fieldUpdateMktoFormsLocale('');
  } else {
    mkfC.error('mktoConsentNoticeField not found');
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

async function fieldChangeCountry(mainevent) {
  let country = mainevent.target.value.toLowerCase().trim();
  if (country === '') {
    lastCountry = '';
    fieldUpdatePrivacyCode('blank');
    return;
  }
  if (country === lastCountry) {
    return;
  }
  lastCountry = country;
  const groupLabel = 'Privacy Statement Validation';
  mkfC.group(groupLabel);

  const purpose = window?.mcz_marketoForm_pref?.form?.subtype ?? '';
  let { privacycode } = PRIVACY_CODE_DEFAULT; // Default unless we find a rule.
  let ruleMatch = 0;
  let matchType = 'default';
  let copartnernames = '';
  let subscriptionID = '';
  let subscriptionName = '';
  let localRules = [];
  if ((privacyCodeRulesClean || []).length === 0) {
    let localRulesTmp = JSON.stringify(PRIVACY_CODE_RULES);
    localRulesTmp = localRulesTmp.toLowerCase();
    localRules = JSON.parse(localRulesTmp);
    for (let i = 0; i < localRules.length; i += 1) {
      const rule = localRules[i];
      localRules[i].partner = false;
      localRules[i].phone = false;
      localRules[i].subscription = false;
      localRules[i].rule_no = `R${(i + 1).toString().padStart(3, '0')}`;
      if (rule.purpose.length) {
        for (let j = 0; j < rule.purpose.length; j += 1) {
          if (rule.purpose[j].trim() === '') {
            localRules[i].purpose.splice(j, 1);
          }
        }
      }
      if (rule.countries.length) {
        for (let j = 0; j < rule.countries.length; j += 1) {
          if (rule.countries[j].trim() === '') {
            localRules[i].countries.splice(j, 1);
          }
        }
      }
    }
    for (let i = 0; i < localRules.length; i += 1) {
      const rule = localRules[i];
      if (rule.methods.length) {
        for (let j = 0; j < rule.methods.length; j += 1) {
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
    privacyCodeRulesClean = localRules;
  } else {
    localRules = privacyCodeRulesClean;
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

  const privacyCode = matchingRule.privacycode;
  country = country.toUpperCase();
  if (privacyCode.includes(';')) {
    const splitCode = privacyCode.split(';');
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

  const proposedBrowserLanguage = await fetchLangCode();
  window.mcz_marketoForm_pref.profile.privacy_optin = matchingRule.optin_style;
  if (PRIVACY_CODE_DEFAULT.privacy_links) {
    const tempPrivacyLinks = JSON.parse(JSON.stringify(PRIVACY_CODE_DEFAULT.privacy_links));
    const matchingRulePrivacyLinks = JSON.parse(JSON.stringify(matchingRule.privacy_links));
    Object.keys(matchingRulePrivacyLinks).forEach((key) => {
      tempPrivacyLinks[key] = matchingRulePrivacyLinks[key];
    });

    let rSLChk = checkContentLang();
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
        rSLChk = checkContentLang();
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
    let baseSite = `${window.mcz_marketoForm_pref?.form?.baseSite}`;
    if (baseSite === '' || baseSite === 'undefined') {
      baseSite = 'https://www.adobe.com';
    }

    logPrivacy(`Regional Site [${baseSite}/${localRegionalSite}]`);
    Object.keys(tempPrivacyLinks).forEach((key) => {
      let privacyLink = tempPrivacyLinks[key];
      if (privacyLink.toLowerCase().indexOf('{adoberegionalsite}') > -1) {
        if (localRegionalSite !== '') {
          privacyLink = privacyLink.replace(/{adobeRegionalSite}/gi, localRegionalSite);
        } else {
          privacyLink = privacyLink.replace(/{adobeRegionalSite}\//gi, '');
        }
        tempPrivacyLinks[key] = privacyLink;
      }
    });

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
  fieldUpdatePrivacyCode(privacycode);

  getTestEmailCheck();

  mkfC.groupEnd(groupLabel);
}

function addListenerToCountry() {
  const countryFld = document.querySelector('[name="Country"]');
  if (countryFld) {
    if (!countryFld.classList.contains('fnc_field_change_country')) {
      countryFld.classList.add('fnc_field_change_country');
      countryFld.addEventListener('change', (event) => {
        fieldChangeCountry(event);
      });
      const parentMktoFormRow = countryFld.closest(
        '.mktoFormRow:not(.fnc_field_observer_country)',
      );
      if (parentMktoFormRow) {
        parentMktoFormRow.classList.add('fnc_field_observer_country');
        const observer = new MutationObserver(() => {
          clearTimeout(window.fnc_field_observer_country_timeout);
          window.fnc_field_observer_country_timeout = setTimeout(() => {
            addListenerToCountry();
          }, 100);
        });
        observer.observe(parentMktoFormRow.parentElement, {
          attributes: false,
          childList: true,
          subtree: true,
        });
      }
    }
  }
}

async function waitForFieldCountry() {
  const mktoFormsLocaleFld = document.querySelector('[name="mktoFormsLocale"]');
  if (document.querySelectorAll('.mktoForm').length > 0) {
    if (mktoFormsLocaleFld !== null) {
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

    setTimeout(fetchLangCode, 10);
    setTimeout(fieldUpdatePrivacyCode, 10);
  } else if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
    mkfC.log('Known Visitor - language code');
    fetchLangCode();
  } else {
    setTimeout(waitForFieldCountry, 20);
  }
}

export function privacyValidation() {
  mkfC.log('Privacy Validation - Run');
  waitForFieldCountry();
}

export default async function init(marketoFormSetup) {
  // eslint-disable-next-line camelcase
  if (typeof form_dynamics !== 'undefined') {
    if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
      mkfC.log('Known Visitor - Privacy Validation - Skip');
    } else {
      marketoFormSetup('stage1');
    }
  }

  mkfC.log('Privacy Validation - Loaded');
}
