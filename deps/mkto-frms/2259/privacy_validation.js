// <![CDATA[
// ##
// ## Updated 20230908T140051
// ##
// ##
// ##
// ## Privacy Validation
// ##
// ##
if (typeof getRandomCountries != "function") {
  //
  // Supported Languages, this must align with Marketo Segmentation
  //
  const DEFAULT_LANGUAGE = "en_us";
  const SUPPORTED_LANGUAGES = [
    "en_us", // English (United States)
    "en_us", // English (United Kingdom) en_gb
    "es_es", // Spanish (Spain)
    "fr_fr", // French (France)
    "ja", // Japanese (Japan)
    "zh", // Chinese (Traditional, Taiwan)
    "zh", // Chinese (Simplified, China)
    "ko", // Korean
    "de", // German
    "da", // Danish
    "sv", // Swedish
    "it", // Italian
    "nl", // Dutch
    "no", // Norwegian
    "pt", // Portuguese
    "fi", // Finnish
    "ru", // Russian
    "tr", // Turkish
    "pl", // Polish
    "cs", // Czech
  ];
  //
  //
  // Special Rule for language codes which don't match up with Privacy Code Format
  // If language code matches the left change it to the right.
  //
  const langCode_to_privacylangCode = {
    zh_cn: "chi",
    zh_tw: "zho",
  };
  //
  // EU+ Countries specific for privacy code rules
  const B2B_RFI_COUNTRIES = [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "DE",
    "GR",
    "HU",
    "IT",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "RO",
    "RU",
    "SK",
    "SI",
    "ES",
    "CH",
  ];
  // ##
  // ##
  // ## Privacy Code Rules
  // ##
  // ##
  const PRIVACY_CODE_DEFAULT = {
    purpose: [""],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email"],
  };
  var PRIVACY_CODE_RULES = []; // Privacy Code Rules
  PRIVACY_CODE_RULES.push(PRIVACY_CODE_DEFAULT);

  // ##################

  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
  });

  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: ["CN"], // China
    privacycode: "ch1B;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: ["KR"], // Korea
    privacycode: "sk1A;ve3;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: ["KR"], // Korea
    privacycode: "sk1A;ve2;<lc>",
    optin_style: "explicit",
    methods: ["email"],
  });
  //
  // Named Sponsor
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs3I;ve2;<lc>-<partner>",
    optin_style: "implicit",
    methods: ["email", "phone", "partner"],
  });
  //
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: ["whitepaper_form"],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs1F;ve1;<lc>-",
    optin_style: "implicit",
    methods: ["email", "phone"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: [""],
    privacycode: "cs3H;ve2;<lc>-<partner>",
    optin_style: "implicit",
    methods: ["email", "phone", "mail", "partner"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: ["strategy_webinar", "whitepaper_form", "nurture"],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: ["seminar", "event_registration", "event_attendance"],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs3G;ve3;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: ["AU", "SG"], // Australia, Singapore
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
  });
  PRIVACY_CODE_RULES.push({
    purpose: ["trial_download"],
    countries: ["AU", "SG"], // Australia, Singapore
    privacycode: "cs3B;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: ["trial_download"],
    countries: B2B_RFI_COUNTRIES, // Some EU Countries + Canada + ROW
    privacycode: "cs2A;ve1;<lc>",
    optin_style: "soft",
    methods: ["email"],
  });
  //
  //
  PRIVACY_CODE_RULES.push({
    purpose: ["whitepaper_form", "nurture", "strategy_webinar"],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
  });
  //
  //
  // Catch all Rule, not rules match above.
  PRIVACY_CODE_RULES.push({
    purpose: [""],
    countries: [""],
    privacycode: "cs1B;ve3;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone", "mail"],
  });
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  // ##
  // ##
  // ##
  // ##
  // ##################
  // ##
  // ## Rule Processing
  // ##

  console.log("Privacy Validation - Loaded");

  var PRIVACY_CODE_RULES_clean = [];
  var privacy_tests = [];
  var privacy_test_results = [];

  function getRandomCountries(numCountries) {
    let countrySelects = document.querySelector('[name="Country"]');
    if (!countrySelects) {
      return [];
    }
    if (!numCountries || numCountries < 1) {
      numCountries = 3;
    }
    if (numCountries >= countrySelects.options.length) {
      return Array.from(countrySelects.options).map((opt) => opt.value);
    }
    let allCountries = Array.from(countrySelects.options).map((opt) => opt.value);
    let availableCountries = allCountries.filter((country) => !B2B_RFI_COUNTRIES.includes(country));
    let randomCountries = [];

    while (randomCountries.length < 5 && availableCountries.length > 0) {
      let randomIndex = Math.floor(Math.random() * availableCountries.length);
      randomCountries.push(availableCountries[randomIndex]);
      availableCountries.splice(randomIndex, 1);
    }
    return randomCountries;
  }

  function generateTests(rules) {
    let subtypeRules = window?.mcz_marketoForm_pref?.form?.subtypeRules ?? {};
    let fieldRules = window?.mcz_marketoForm_pref?.field_visibility ?? {};
    if (fieldRules == null) {
      console.log("No Field Rules");
      return [];
    }

    let fieldNames = Object.keys(fieldRules);
    let tests = [];
    function addTest(test) {
      let d = new Date();
      let datetime = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
      test.datetime = datetime;
      let testEmail =
        "privacytest-" +
        datetime.replace(/-/g, "").replace(/ /g, "").replace(/:/g, "") +
        "-$$$" +
        "@adobetest.com";
      test.email = testEmail;
      tests.push(test);
    }
    //
    //
    for (let rule of rules) {
      let country_check =
        rule.countries.length === 0 || rule.countries[0] === ""
          ? getRandomCountries()
          : rule.countries;
      for (let country of country_check) {
        let purposes =
          rule.purpose.length === 0 || rule.purpose[0] === ""
            ? Object.keys(subtypeRules)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
            : rule.purpose;
        let phonetest = false;
        let test;
        for (let purpose of purposes) {
          let countryLabel = country.toUpperCase();
          let countrySelects = document.querySelector(
            '[name="Country"] option[value="' + country.toUpperCase() + '"]'
          );
          if (countrySelects) {
            countryLabel = countrySelects.innerText;
          }
          test = {
            rule_no: rule.rule_no,
            country: country.toUpperCase(),
            country_lbl: countryLabel,
            purpose: purpose,
            privacycode: rule.privacycode,
            optin_style: rule.optin_style,
            methods: rule.methods,
            partner_name: "",
            partner_visible: rule.partner,
            phone_visible: rule.phone,
          };
          for (let f = 0; f < fieldNames.length; f++) {
            let setting = "hidden";
            let random_vis = Math.floor(Math.random() * 2);
            if (random_vis > 0) {
              setting = "visible";
              if (rule.phone && fieldNames[f] === "phone") {
                phonetest = true;
              }
            }
            test["field_" + fieldNames[f]] = setting;
          }
          if (rule.partner) {
            test.partner_name = "Partner Name " + Math.floor(Math.random() * 1000);
            addTest(test);
          } else {
            addTest(test);
          }
        }
        //add extra hidden no partner name test
        if (rule.partner) {
          test.partner_name = "";
          addTest(test);
        }
        //add extra hidden phone test
        if (rule.phone && phonetest === false) {
          test.field_phone = "hidden";
          addTest(test);
          phonetest = true;
        }
      }
    }
    for (let i = 0; i < tests.length; i++) {
      tests[i].id = "T" + (i + 1).toString().padStart(4, "0");
      tests[i].email = tests[i].email.replace("$$$", tests[i].id);
      tests[i].privacycode = tests[i].privacycode.replace(/[-;]+$/g, "");
    }
    return tests;
  }

  function runTestID(test) {
    let formId = getMktoFormID();
    let form = MktoForms2.getForm(formId);
    let formData = form.getValues();
    let requiredFields = document.querySelectorAll("#mktoForm_" + formId + " .mktoRequired");

    const fieldMap = {
      fn: "FirstName",
      ln: "LastName",
      company: "mktoFormsCompany",
      phone: "Phone",
      comments: "mktoQuestionComments",
      demo: "mktoRequestProductDemo",
      state: "State",
      postcode: "PostalCode",
      company_size: "mktoDemandbaseEmployeeRange",
      website: "mktodemandbaseWebsite",
      email: "Email",
      country: "Country",
      poi: "mktoFormsPrimaryProductInterest",
      functionalArea: "mktoFormsFunctionalArea",
    };
    const exampleData = {
      fn: "John",
      ln: "Adobe",
      company: "Adobe",
      phone: "1234567890",
      comments: "This is a test comment",
      demo: "true",
      state: "",
      postcode: "12345",
      company_size: "1-10",
      website: "www.adobe.com",
      email: "",
      country: "US",
      poi: "LAST",
      functionalArea: "LAST",
    };

    for (let key in fieldMap) {
      if (fieldMap.hasOwnProperty(key)) {
        let formField = fieldMap[key];
        let value;
        if (test.hasOwnProperty(key) && test[key] !== "") {
          value = test[key];
        } else {
          value = exampleData.hasOwnProperty(key) ? exampleData[key] : "";
        }
        let field = document.querySelector('[name="' + formField + '"]');
        if (field) {
          if (field.tagName === "SELECT") {
            if (value == "LAST") {
              value = field.options[field.options.length - 1].value;
            } else {
              let option = field.querySelector('option[value="' + value + '"]');
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
          field.dispatchEvent(new Event("change"));
        }
      }
    }
    for (let i = 0; i < requiredFields.length; i++) {
      if (requiredFields[i].value === "") {
        if (requiredFields[i].tagName === "SELECT") {
          requiredFields[i].value =
            requiredFields[i].options[requiredFields[i].options.length - 1].value;
          sleep(250);
          requiredFields[i].dispatchEvent(new Event("change"));
        }
      }
    }

    function fetchPrivacyTextObject() {
      let privacy_text = {};

      const privacydivs = document.querySelectorAll('div[data-mkto_vis_src^="adobe-privacy-"]');
      if (!privacydivs.length) {
        console.warn("No divs with attribute data-mkto_vis_src found.");
        return {};
      }
      console.log(privacydivs);
      Array.from(privacydivs).forEach((privacydiv) => {
        let privacydiv_rows = privacydiv.querySelectorAll("legend, .mktoFormRow");
        if (privacydiv_rows.length) {
          let currentKey = "";
          let currentText = "";
          Array.from(privacydiv_rows).forEach((privacydiv_row) => {
            let pending_currentKey = "";
            if (privacydiv_row.tagName === "LEGEND") {
              pending_currentKey = privacydiv_row.innerText.trim();
              if (pending_currentKey.indexOf("=") > -1) {
                pending_currentKey = pending_currentKey.split("-")[1];
                pending_currentKey = pending_currentKey.trim();
              } else {
                pending_currentKey = "";
              }
              if (pending_currentKey == "") {
                return;
              }
              if (currentKey != pending_currentKey) {
                currentKey = pending_currentKey;
                privacy_text[currentKey] = "";
              }
              return;
            }
            let currentText_pending = privacydiv_row.innerText.trim();
            currentText_pending = currentText_pending.replace(/(\r\n|\n|\r|\t)/gm, "");
            currentText_pending = currentText_pending.replace(/  +/g, " ");
            if (currentText_pending != "") {
              if (currentText != currentText_pending) {
                currentText = currentText_pending;
              }
              if (privacy_text[currentKey] == "") {
                privacy_text[currentKey] = currentText;
              } else {
                privacy_text[currentKey] = privacy_text[currentKey] + "\n" + currentText;
              }
            }
          });
        }
      });
      return privacy_text;
      try {
      } catch (e) {
        console.error("An error occurred while fetching and processing Adobe privacy text:", e);
        return {};
      }
    }

    // Usage
    var privacyTextObject = fetchPrivacyTextObject();
    console.log(privacyTextObject);

    //
    //
    //
  }

  var mcz_marketoForm_pref_backup;
  async function runPrivacyCodeTest(test) {
    if (mcz_marketoForm_pref_backup == null) {
      mcz_marketoForm_pref_backup = JSON.parse(JSON.stringify(window.mcz_marketoForm_pref));
    }
    var tests_full = [];
    for (var i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      var langCode = SUPPORTED_LANGUAGES[i];
      var testCopy = JSON.parse(JSON.stringify(test));
      let convertlng = convertLangCodeToPrivacyLangCode(langCode);
      testCopy.langCode = langCode;
      testCopy.segLangCode = convertlng;
      testCopy.id_full = testCopy.id + "-" + convertlng;
      tests_full.push(testCopy);
    }
    console.log(tests_full);
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
    let test = privacy_tests[Math.floor(Math.random() * privacy_tests.length)];
    if (test) {
      privacy_tests = privacy_tests.filter((t) => t.id !== test.id);
      localStorage.setItem("mkto_tests", JSON.stringify(privacy_tests));
      console.log("test:" + test.id + ", tests remaining", privacy_tests.length);
      let localCopy_mcz_marketoForm_pref = JSON.parse(JSON.stringify(window.mcz_marketoForm_pref));
      console.log("Complete test data", test);
      const dlMap = {
        partner_name: "program.copartnernames",
        purpose: "form.subtype",
        langCode: "profile.prefLanguage",
        segLangCode: "profile.segLangCode",
        field_comments: "field_visibility.comments",
        field_company_size: "field_visibility.company_size",
        field_demo: "field_visibility.demo",
        field_phone: "field_visibility.phone",
        field_postcode: "field_visibility.postcode",
        field_state: "field_visibility.state",
        field_website: "field_visibility.website",
      };
      for (let key in dlMap) {
        if (dlMap.hasOwnProperty(key)) {
          let dataLayerPoint = dlMap[key];
          if (test.hasOwnProperty(key) && test[key] !== "") {
            let value = test[key];
            let keys = dataLayerPoint.split(".");
            let obj = localCopy_mcz_marketoForm_pref;
            for (let i = 0; i < keys.length - 1; i++) {
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
          }
        }
      }
      localStorage.setItem("mkto_test_full", JSON.stringify(test));
      localStorage.setItem("mkto_test_dl", JSON.stringify(localCopy_mcz_marketoForm_pref));
      let url = new URL(window.location.href);
      url.searchParams.set("mkto_test", "active");
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
        console.error(error);
        test = null;
      }
      return test;
    }
    return null;
  }

  function getTest() {
    let test = getTestData("mkto_test_full");
    if (test && test.id) {
      if (privacy_tests.length === 0) {
        getTest_emailCheck();
      }
      console.log("test:" + test.id + ", tests remaining: " + privacy_tests.length);
      runTestID(test);
    } else {
      newTest();
    }
  }

  function getTest_emailCheck() {
    let formId = getMktoFormID();
    let email_fld = document.querySelector("#mktoForm_" + formId + ' [name="Email"]');
    if (email_fld) {
      //
      //
      if (email_fld.getAttribute("privacytest") == "true") {
        if (email_fld.value.includes("privacytest") && email_fld.value.includes("@adobetest.com")) {
        } else {
          //clear this for now
          email_fld.removeAttribute("privacytest");
        }
      } else {
        let testing_review = false;
        if (localStorage.getItem("mkto_test")) {
          if (localStorage.getItem("mkto_test") == "active") {
            testing_review = true;
          }
        } else {
          if (
            email_fld.value.includes("privacytest") &&
            email_fld.value.includes("@adobetest.com")
          ) {
            testing_review = true;
          }
        }
        if (testing_review) {
          email_fld.setAttribute("privacytest", "true");
          //
          //
          privacy_tests = [];
          if (localStorage.getItem("mkto_test") == "active") {
            privacy_tests = getTestData("mkto_tests");
          }
          if (privacy_tests == null || privacy_tests.length == 0) {
            console.log("No tests found, generating new tests");
            privacy_tests = generateTests(PRIVACY_CODE_RULES_clean);
            localStorage.setItem("mkto_tests", JSON.stringify(privacy_tests));
            localStorage.setItem("mkto_test", "active");
          }
          console.log("Test Mode - Enabled");
        }
      }
    }
  }

  if (typeof window?.mcz_marketoForm_pref?.profile == "undefined") {
    window.mcz_marketoForm_pref.profile = {
      prefLanguage: "",
      segLangCode: "",
    };
  }

  async function check_ip_lang() {
    const callbackName = "callback_" + Date.now();
    const url = `https://geo2.adobe.com/json/?callback=${callbackName}`;
    function fetchData(url, callbackName) {
      return new Promise((resolve, reject) => {
        window[callbackName] = function (data) {
          resolve(data);
        };
        const script = document.createElement("script");
        script.src = url;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    try {
      const data = await fetchData(url, callbackName);
      const languages = data["Accept-Language"];
      let firstLanguage = languages.split(",")[0];
      firstLanguage = firstLanguage.replace("-", "_");
      firstLanguage = firstLanguage.toLowerCase();
      return firstLanguage;
    } catch (error) {
      console.error("Error fetching data:", error);
      return "en_us";
    }
  }

  function clean_lang_code(langCode) {
    return langCode.trim().toLowerCase().replace("-", "_");
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
    const baseLangCode = normalizedLangCode.split("_")[0];
    let foundCode = null;
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const supportedLangCode = SUPPORTED_LANGUAGES[i];
      if (supportedLangCode == normalizedLangCode) {
        foundCode = supportedLangCode;
        break;
      }
    }
    if (foundCode == null) {
      for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
        const supportedLangCode = SUPPORTED_LANGUAGES[i];
        if (supportedLangCode.startsWith(baseLangCode)) {
          foundCode = supportedLangCode;
          break;
        }
      }
    }
    return foundCode ?? "en";
  }

  function check_content_lang() {
    if (document.documentElement.lang) {
      return document.documentElement.lang;
    }
    const metaContentLanguage = document.querySelector('meta[http-equiv="Content-Language"]');
    if (
      metaContentLanguage &&
      metaContentLanguage.hasAttribute("lang") &&
      metaContentLanguage.lang !== ""
    ) {
      return metaContentLanguage.lang;
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
    return sources.find((lang) => typeof lang !== "undefined") ?? null;
  }

  function dl_update_lang_pref(proposedLanguage) {
    if (window.mcz_marketoForm_pref && window.mcz_marketoForm_pref.profile) {
      window.mcz_marketoForm_pref.profile.prefLanguage = confirm_lang_ok(proposedLanguage);
      window.mcz_marketoForm_pref.profile.segLangCode =
        convertLangCodeToPrivacyLangCode(proposedLanguage);
    }
  }

  var has_langbeenSet = false;
  async function fetch_lang_code() {
    //console.log("fetch_lang_code");
    let proposedBrowserLanguage = window?.mcz_marketoForm_pref?.profile?.prefLanguage ?? null;
    if (proposedBrowserLanguage != null && proposedBrowserLanguage != "") {
      proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
      if (has_langbeenSet == false) {
        dl_update_lang_pref(proposedBrowserLanguage);
        field_update_mktoFormsLocale(proposedBrowserLanguage);
      }
      return proposedBrowserLanguage;
    } else {
      proposedBrowserLanguage = check_content_lang();
      if (proposedBrowserLanguage != null && proposedBrowserLanguage != "") {
        proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
        dl_update_lang_pref(proposedBrowserLanguage);
        field_update_mktoFormsLocale(proposedBrowserLanguage);
        //console.log("proposedBrowserLanguage : ", proposedBrowserLanguage);
        return proposedBrowserLanguage;
      }
      proposedBrowserLanguage = check_browser_lang();
      if (proposedBrowserLanguage != null && proposedBrowserLanguage != "") {
        proposedBrowserLanguage = confirm_lang_ok(proposedBrowserLanguage);
        dl_update_lang_pref(proposedBrowserLanguage);
        field_update_mktoFormsLocale(proposedBrowserLanguage);
        //console.log("proposedBrowserLanguage  : ", proposedBrowserLanguage);
        return proposedBrowserLanguage;
      }
      check_ip_lang()
        .then((lang) => {
          proposedBrowserLanguage = confirm_lang_ok(lang) ?? DEFAULT_LANGUAGE;
          dl_update_lang_pref(proposedBrowserLanguage);
          field_update_mktoFormsLocale(proposedBrowserLanguage);
        })
        .catch((error) => {
          console.error(error);
          proposedBrowserLanguage = DEFAULT_LANGUAGE;
        });
      return proposedBrowserLanguage;
    }
  }
  function field_update_privacy_code(privacycode) {
    const mktoConsentNoticeField = document.querySelector('[name="mktoConsentNotice"]');
    if (mktoConsentNoticeField) {
      privacycode = "" + privacycode;
      privacycode = privacycode.replace("undefined", "");
      privacycode = privacycode.trim();
      privacycode = privacycode.replace(/[-;]+$/g, "");

      // console.log("field_update_privacy_code >>" + privacycode);

      let temp = mktoConsentNoticeField.value;
      let d = new Date();
      let n = d.getTime();
      if (privacycode != "" && temp != privacycode) {
        mktoConsentNoticeField.value = privacycode; //+ "::" + n;
      } else {
        temp = temp.split("::")[0];
        mktoConsentNoticeField.value = temp; //+ "::" + n;
      }
      let event = new Event("change", { bubbles: true });
      mktoConsentNoticeField.dispatchEvent(event);
      for (let i = 0; i < 5; i++) {
        setTimeout(function () {
          mktoConsentNoticeField.dispatchEvent(event);
        }, 50 * i);
      }
      field_update_mktoFormsLocale("");
    } else {
      console.error("mktoConsentNoticeField not found");
    }
  }

  function field_update_mktoFormsLocale(proposedLanguage) {
    const mktoFormsLocaleField = document.querySelector('[name="mktoFormsLocale"]');
    //console.log("field_update_mktoFormsLocale >>" + proposedLanguage);
    if (window?.mcz_marketoForm_pref?.profile?.known_visitor == true) {
      console.log("Known Visitor - field_update_mktoFormsLocale");
      return;
    }
    if (mktoFormsLocaleField) {
      let temp = mktoFormsLocaleField.value;
      proposedLanguage = "" + proposedLanguage;
      proposedLanguage = proposedLanguage.replace("undefined", "");
      proposedLanguage = proposedLanguage.trim();
      let d = new Date();
      let n = d.getTime();
      if (proposedLanguage != "" && temp != proposedLanguage) {
        mktoFormsLocaleField.value = proposedLanguage; //+ "::" + n;
      } else {
        temp = temp.split("::")[0];
        mktoFormsLocaleField.value = temp; //+ "::" + n;
      }

      has_langbeenSet = true;
      let event = new Event("change", { bubbles: true });
      mktoFormsLocaleField.dispatchEvent(event);
      for (let i = 0; i < 5; i++) {
        setTimeout(function () {
          mktoFormsLocaleField.dispatchEvent(event);
        }, 50 * i);
      }
    } else {
      setTimeout(function () {
        field_update_mktoFormsLocale(proposedLanguage);
      }, 20);
    }
  }

  var lastCountry = "";
  async function field_change_country(mainevent) {
    let country = mainevent.target.value.toLowerCase().trim();
    if (country == "") {
      return;
    }
    if (country == lastCountry) {
      return;
    }
    lastCountry = country;
    var group_label = "Privacy Statement Validation";
    console.group(group_label);
    function logPrivacy(message) {
      if (typeof message == "object") {
        message = JSON.stringify(message, null, 2);
      }
      console.log(`%c${message}`, "font-size: 1.2em; color:#eb1301; font-weight: bold; ");
    }

    let purpose = window?.mcz_marketoForm_pref?.form?.subtype ?? "";
    let privacycode = PRIVACY_CODE_DEFAULT.privacycode; // Default unless we find a rule.
    let ruleMatch = 0;
    let matchType = "default";
    let copartnernames = "";
    let localRules = [];
    if (PRIVACY_CODE_RULES_clean.length == 0) {
      let localRules_tmp = JSON.stringify(PRIVACY_CODE_RULES);
      localRules_tmp = localRules_tmp.toLowerCase();
      localRules = JSON.parse(localRules_tmp);
      for (let i = 0; i < localRules.length; i++) {
        const rule = localRules[i];
        localRules[i].partner = false;
        localRules[i].phone = false;
        localRules[i].rule_no = "R" + (i + 1).toString().padStart(3, "0");
        if (rule.purpose.length) {
          for (let j = 0; j < rule.purpose.length; j++) {
            if (rule.purpose[j].trim() == "") {
              localRules[i].purpose.splice(j, 1);
            }
          }
        }
        if (rule.countries.length) {
          for (let j = 0; j < rule.countries.length; j++) {
            if (rule.countries[j].trim() == "") {
              localRules[i].countries.splice(j, 1);
            }
          }
        }
      }
      for (let i = 0; i < localRules.length; i++) {
        const rule = localRules[i];
        if (rule.methods.length) {
          for (let j = 0; j < rule.methods.length; j++) {
            if (rule.methods[j].trim() == "partner") {
              localRules[i].partner = true;
            }
            if (rule.methods[j].trim() == "phone") {
              localRules[i].phone = true;
            }
          }
        }
      }
      PRIVACY_CODE_RULES_clean = localRules;
    } else {
      localRules = PRIVACY_CODE_RULES_clean;
    }

    if (
      typeof window?.mcz_marketoForm_pref?.program?.copartnernames?.trim() !== "undefined" &&
      window?.mcz_marketoForm_pref?.program?.copartnernames?.trim() !== ""
    ) {
      copartnernames = (window.mcz_marketoForm_pref.program.copartnernames || "")
        .replace(/[ ,]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
    }

    console.log("Active Rules : ", localRules);

    let phoneVisible = false;
    let phoneVis = window?.mcz_marketoForm_pref?.field_visibility?.phone ?? "";
    phoneVis = phoneVis.toLowerCase();
    if (
      phoneVis === "visible" ||
      phoneVis === "show" ||
      phoneVis === "all" ||
      phoneVis === "required"
    ) {
      phoneVisible = true;
    } else {
      let phoneField = document.querySelector('[name="Phone"]');
      if (phoneField) {
        let phoneFieldParent = phoneField;
        while (phoneFieldParent) {
          if (
            phoneFieldParent.style.display != "none" &&
            phoneFieldParent.style.visibility != "hidden" &&
            phoneFieldParent.style.opacity != "0" &&
            phoneFieldParent.style.height != "0px" &&
            phoneFieldParent.style.width != "0px" &&
            phoneFieldParent.style.maxHeight != "0px" &&
            phoneFieldParent.style.maxWidth != "0px" &&
            phoneFieldParent.style.minHeight != "0px" &&
            phoneFieldParent.style.minWidth != "0px"
          ) {
            phoneFieldVisible = true;
            break;
          }
          phoneFieldParent = phoneFieldParent.parentElement;
        }
      }
    }
    function matchCriteria(rule, country, purpose, phoneVisible, copartnernames) {
      const scores = {
        Country: 10,
        Partner: 10,
        Purpose: 10,
        Phone: 10,
      };

      const matches = [];
      if (rule.countries.length > 0 && rule.countries.includes(country.toLowerCase())) {
        matches.push("Country");

        if (rule.purpose.length > 0 && rule.purpose.includes(purpose.toLowerCase())) {
          matches.push("Purpose");
        }
        if (rule.partner === true && copartnernames.trim() !== "") {
          matches.push("Partner");
        }
        if (phoneVisible === true && rule.methods.includes("phone")) {
          matches.push("Phone");
        }
      }
      if (rule.countries.length === 0) {
        if (rule.purpose.length > 0 && rule.purpose.includes(purpose.toLowerCase())) {
          matches.push("Purpose");
        }
        if (rule.partner === true && copartnernames.trim() !== "") {
          matches.push("Partner");
        }
        if (phoneVisible === true && rule.methods.includes("phone")) {
          matches.push("Phone");
        }
      }

      const totalScore = matches.reduce((sum, match) => sum + scores[match], 0);
      return { matches, totalScore };
    }

    function findBestMatchingRule(rules, country, purpose, phoneVisible, copartnernames) {
      let sortedRules = rules
        .slice()
        .map((rule) => ({
          rule,
          ...matchCriteria(rule, country, purpose, phoneVisible, copartnernames),
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
    let { rule: matchingRule, matches } = findBestMatchingRule(
      localRules,
      country,
      purpose,
      phoneVisible,
      copartnernames ?? ""
    );

    if (matchingRule === null) {
      matchingRule = PRIVACY_CODE_DEFAULT;
    }

    privacyCode = matchingRule.privacycode;
    country = country.toUpperCase();
    splitCode = privacyCode.split(";");
    splitCode[0] = splitCode[0].slice(0, 2).toLowerCase() + splitCode[0].slice(2).toUpperCase();
    privacycode = splitCode.join(";");
    let confirmMsg = "";
    if (matchingRule.partner == true) {
      confirmMsg = "Partner [" + copartnernames + "] ";
    }
    confirmMsg = confirmMsg + "Country [" + country + "] Form Purpose [" + purpose + "] ";
    logPrivacy(confirmMsg);
    logPrivacy("Privacy Rule [" + ruleMatch + "] Matched using [" + matchType + "]");
    logPrivacy(
      "Base Privacy Code [" +
        matchingRule.privacycode +
        "] Style [" +
        matchingRule.optin_style +
        "]"
    );
    logPrivacy(matchingRule);
    window.mcz_marketoForm_pref.profile.privacy_optin = matchingRule.optin_style;

    const proposedBrowserLanguage = await fetch_lang_code();
    privacycode = privacycode.replace(
      "<lc>",
      convertLangCodeToPrivacyLangCode(proposedBrowserLanguage)
    );
    if (copartnernames == "") {
      privacycode = privacycode.replace("-<partner>", "");
    } else {
      privacycode = privacycode.replace("-<partner>", "-" + copartnernames);
    }
    privacycode = privacycode.replace(/[-;]+$/g, "");

    window.mcz_marketoForm_pref.profile.privacy = privacycode;
    logPrivacy(
      "Final Privacy Code [" + privacycode + "] from Language [" + proposedBrowserLanguage + "]"
    );
    field_update_privacy_code(privacycode);

    getTest_emailCheck();

    console.groupEnd(group_label);
  }
  var formObservmktoFormsLocale = false;
  async function wait_for_field_country() {
    let mktoFormsLocale_fld = document.querySelector('[name="mktoFormsLocale"]');
    if (document.querySelectorAll(".observMKTO").length > 0) {
      if (mktoFormsLocale_fld != null) {
        formObservmktoFormsLocale = true;
        //console.log("Country field detected!");
      }
    }
    if (formObservmktoFormsLocale) {
      //console.log("Change handler detected!");
      function addListenerToCountry() {
        let country_fld = document.querySelector('[name="Country"]');
        if (country_fld) {
          if (!country_fld.classList.contains("fnc_field_change_country")) {
            country_fld.classList.add("fnc_field_change_country");
            country_fld.addEventListener("change", function (event) {
              field_change_country(event);
            });
            let parent_mktoFormRow = country_fld.closest(
              ".mktoFormRow:not(.fnc_field_observer_country)"
            );
            if (parent_mktoFormRow) {
              parent_mktoFormRow.classList.add("fnc_field_observer_country");
              let observer = new MutationObserver(function (mutations) {
                clearTimeout(window.fnc_field_observer_country_timeout);
                window.fnc_field_observer_country_timeout = setTimeout(function () {
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
      addListenerToCountry();

      setTimeout(fetch_lang_code, 10);
      setTimeout(field_update_privacy_code, 10);
    } else {
      if (window?.mcz_marketoForm_pref?.profile?.known_visitor == true) {
        console.log("Known Visitor - wait_for_field_country");
        fetch_lang_code();
      } else {
        setTimeout(wait_for_field_country, 20);
      }
    }
  }

  wait_for_field_country();
}

// ##
// ##
// ]]>