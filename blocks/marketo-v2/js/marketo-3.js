// <![CDATA[
// ##
// ## Updated 20241118T171952
// ##
// ##  Marketo Form Processing

var mkto_formsLoaded = mkto_formsLoaded || {};
var mktoFrmParams = new URLSearchParams(window.location.search);
var mktoForm = document.querySelector(".mktoForm");
mktoForm.setAttribute("style", "opacity:0");
mktoForm.classList.add("starting_fieldset");
var consStyl = "font-size: 1.2em; color: green; font-weight: bold; ";

if (typeof mktoPerformanceObserver == "undefined") {
  mkf_c.log("Marketo Form Setup - Begin");

  var unique_id = "";
  var activeCookie = false;

  mktoPerformanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      let loadTimeRounded = Math.round(entry.duration);
      let currentTimeBucket = Math.round(loadTimeRounded / 500) * 500;
      if (entry.name === "MarketoFormVisible" && entry.entryType === "measure") {
        if (
          window.mcz_marketoForm_pref?.performance?.loadTime == null ||
          window.mcz_marketoForm_pref?.performance?.loadTime === undefined
        ) {
          window.mcz_marketoForm_pref.performance = {
            loadTime: loadTimeRounded,
            loadTimeBucket: currentTimeBucket,
            currentTime: loadTimeRounded,
            currentTimeBucket: currentTimeBucket,
          };

          if (document.getElementById("mktoFormsCompany")) {
            document.getElementById("mktoFormsCompany").id = "mktoFormsCompany_ignore";
          }

          mkf_c.log(
            `%cForm load time: ${window?.mcz_marketoForm_pref?.performance?.loadTime}ms, bucket: ${window?.mcz_marketoForm_pref?.performance?.loadTimeBucket}ms`,
            consStyl
          );

          if (typeof aaInteraction === "function") {
            aaInteraction(
              "Marketo Form View",
              "formView",
              window?.mcz_marketoForm_pref?.form?.id,
              window?.mcz_marketoForm_pref?.performance?.loadTime
            );
          }
        }
      }
    }
  });

  mktoPerformanceObserver.observe({ entryTypes: ["measure"] });

  var adobeOrg = "";
  if (window?.imsOrgId) {
    adobeOrg = "AMCV_" + encodeURIComponent(window.imsOrgId) + ";";
  }

  window.checkAdobePrivacy = function () {
    if (typeof window?.adobePrivacy?.hasUserProvidedConsent === "function") {
      if (window?.adobePrivacy?.hasUserProvidedConsent()) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  };

  window.checkCookie = function (incMunchkin = true) {
    const cookieMatch = document.cookie.match(/_mkto_trk=([^;]+)/);
    if (!cookieMatch) return null;
    let cookieValue = cookieMatch[1];
    let munch = cookieValue.match(/id:([^&]+)/)[0].replace("id:", "#m:");
    if (incMunchkin === false) {
      return munch ? `${munch}` : null;
    }
    let tokenMatch = cookieValue.match(/&token:_mch-adobe\.com-([^&]+)/);
    if (tokenMatch) {
      let token = tokenMatch[1];
      let parts = token.split("-");
      if (parts.length === 2 && /^\d{9,}-\d{3,}$/.test(token)) {
        return `#c:${parts[0]}#v:${parts[1]}`;
      } else {
        return `#v:${token}`;
      }
    } else {
      return null;
    }
  };

  window.getMktoFormID = function () {
    if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
      return window.mcz_marketoForm_pref.form.id;
    }
    let mktoForm = document.querySelector("form.mktoForm");
    if (mktoForm) {
      let formId = document.querySelector("form.mktoForm")
        ? document.querySelector("form.mktoForm").id
        : null;
      formId = formId.replace("mktoForm_", "");
      formId = parseInt(formId);
      if (formId) {
        if (window?.mcz_marketoForm_pref?.form !== undefined) {
          window.mcz_marketoForm_pref.form["id"] = formId;
        }
        return formId;
      } else {
        mkf_c.log("ERROR: unable to get form ID");
        if (window?.mcz_marketoForm_pref?.form?.id !== undefined) {
          window.mcz_marketoForm_pref.form.id = null;
        }
        return null;
      }
    } else {
      mkf_c.log("ERROR: no Marketo form found");
      window.mcz_marketoForm_pref.form.id = null;
      return null;
    }
  };

  window.getUniqueID = function (formValues, bypass = false) {
    let unique_id_temp = "";
    let unique_id = mcz_marketoForm_pref?.profile?.unique_id;
    if (!bypass && unique_id !== "") {
      if (unique_id.indexOf("v:") > -1) {
        return unique_id;
      } else {
        let checkNew = getUniqueID(formValues, true);
        if (checkNew.indexOf("v:") > -1) {
          unique_id = checkNew;
          return checkNew;
        } else {
          return unique_id;
        }
      }
    }
    if (activeCookie && unique_id !== "" && !bypass) {
      return unique_id;
    }
    let munchkinId = "";
    if (formValues && formValues.munchkinId) {
      munchkinId = formValues.munchkinId;
    } else {
      let munchkinIdField = document.querySelector(".mktoForm[id] input[name='munchkinId']");
      if (munchkinIdField) {
        munchkinId = munchkinIdField.value;
      }
    }
    unique_id_temp += "#m:" + munchkinId;
    unique_id_temp += "#f:" + formValues.formid;
    unique_id_temp += "#t:" + new Date().getTime();

    if (checkAdobePrivacy()) {
      activeCookie = true;
      unique_id_temp += checkCookie(true);
    } else {
      activeCookie = false;
      unique_id_temp += checkCookie(false);
    }

    unique_id_temp = unique_id_temp.replace(/null/g, "");
    if (bypass) {
      return unique_id_temp;
    } else {
      unique_id = unique_id_temp;
      if (window?.mcz_marketoForm_pref?.profile !== undefined) {
        window.mcz_marketoForm_pref.profile.unique_id = unique_id;
      }
      return unique_id;
    }
  };

  performance.mark("MarketoFormStart");

  window.uFFld = function (form, fieldName, value, critical = false) {
    if (form === null || form === undefined) {
      mkf_c.warn("Form is null or undefined for:" + fieldName + " = " + value);
      return;
    }

    value = "" + value;
    value = value.replace(/undefined|null/g, "").trim();
    value = String(value);

    if (critical && value === "") {
      mkf_c.warn("Critical field is empty: " + fieldName);
    }

    let formField = document.querySelector('[name="' + fieldName + '"]');
    if (formField) {
      let activeOnForm = false;
      let checklbl = document.querySelector('label[for="' + fieldName + '"]');
      if (checklbl) {
        let lbl = checklbl.innerText;
        mkf_c.log(lbl);
        if (lbl.length > 0) {
          let parent = checklbl.parentElement;
          while (parent) {
            if (parent.classList.contains("mktoFormRowTop")) {
              activeOnForm = true;
              mkf_c.log("Active on Form: " + fieldName);
              if (parent.classList.contains("mktoHidden")) {
                mkf_c.log("Active on Form (but hidden): " + fieldName);
                activeOnForm = false;
              }
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      if (activeOnForm == false) {
        if (formField.tagName == "SELECT" && formField.querySelectorAll("option").length > 0) {
          let options = formField.querySelectorAll("option");
          let found = false;
          for (let i = 0; i < options.length; i++) {
            if (options[i].value == value) {
              found = true;
              break;
            }
          }
          if (!found) {
            let newOption = document.createElement("option");
            newOption.value = value;
            newOption.innerHTML = value;
            formField.appendChild(newOption);
          }
        }

        if (formField.type == "radio" || formField.type == "checkbox") {
          let radioCheck = document.querySelector(
            '[name="' + fieldName + '"][value="' + value + '"]'
          );
          if (!radioCheck) {
            let nwO = document.createElement("input");
            nwO.type = formField.type;
            nwO.name = fieldName;
            nwO.value = value;
            nwO.style.display = "none";
            formField.parentElement.appendChild(nwO);
          }
        }
        let tV = form.getValues();
        if (tV.hasOwnProperty(fieldName)) {
          if (tV[fieldName] != value) {
            form.setValues({ [fieldName]: value });
          }
        } else {
          form.addHiddenFields({ [fieldName]: value });
        }
        formField.value = value;
      }
    } else {
      let hiddenField = {};
      hiddenField[fieldName] = value;
      form.addHiddenFields(hiddenField);
    }
  };

  function marketoFormSetup(lvl) {
    if (lvl === undefined || lvl === null) {
      lvl = "";
    }
    mkf_c.log("Marketo Form Setup - Triggered " + lvl);

    if (lvl == "stage1") {
      if (typeof window.mcz_marketoForm_pref === "undefined") {
        mkf_c.log("Marketo Form DataLayer - Not Found, using default values");
        window.mcz_marketoForm_pref = window.mcz_marketoForm_pref_example || [];
      } else {
        mkf_c.log("mcz_marketoForm_pref is defined, check quality");
        checkAndAddProperties(
          window.mcz_marketoForm_pref,
          window.mcz_marketoForm_pref_example,
          false
        );
      }

      function checkAndAddProperties(obj, defaultObj, replace) {
        for (let prop in defaultObj) {
          if (typeof obj[prop] === "undefined") {
            obj[prop] = defaultObj[prop];
          } else if (typeof obj[prop] === "object") {
            checkAndAddProperties(obj[prop], defaultObj[prop], replace);
          } else if (replace) {
            obj[prop] = defaultObj[prop];
          }
        }
      }

      let templateLog = "";
      function aTLg(log) {
        if (log === undefined || log === null) {
          return;
        }
        if (log == "---") {
          templateLog += "-----------------------------\n";
          return;
        }
        templateLog += log + "\n";
      }

      function checkTemplate() {
        let groupLBL = "Marketo Form Template";
        mkf_c.groupCollapsed(groupLBL);

        const mczPrefs = window.mcz_marketoForm_pref;
        if (!mczPrefs) {
          mkf_c.warn("mcz_marketoForm_pref not defined.");
          mkf_c.groupEnd(groupLBL);
          return;
        }
        if (!mczPrefs.form) {
          mkf_c.warn("mcz_.._pref.form not defined.");
          mkf_c.groupEnd(groupLBL);
          return;
        }
        if (!mczPrefs.form.template) {
          mkf_c.warn("mcz_.._pref.form.template not defined.");
          mkf_c.groupEnd(groupLBL);
          return;
        }
        if (mktoFrmParams.get("template")) {
          mczPrefs.form.template = mktoFrmParams.get("template");
        }
        let poi = mktoFrmParams.get("mktfrm_poi") || "";
        if (!poi && window.location.hash) {
          const hash = window.location.hash;
          if (hash.includes("#poi")) {
            poi = hash.replace("#poi", "");
          }
        }

        if (poi.length > 2) {
          poi = poi
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+$/, "")
            .toUpperCase();

          mczPrefs.program.poi = poi;
          mkf_c.log(`POI provided in query string: ${poi}`);
        }
        aTLg("Subtypes Verbs");
        aTLg(JSON.stringify(mczPrefs.form.subtypeRules, null, 2));
        aTLg("\nSubtypes Enforced:");
        aTLg(JSON.stringify(mczPrefs.form.subtypeTemplate, null, 2));

        if (mczPrefs.form.subtypeTemplate) {
          if (mczPrefs.form.subtypeTemplate.hasOwnProperty(mczPrefs.form.template)) {
            let originalSubtype = mczPrefs.form.subtype;
            mczPrefs.form.subtype = mczPrefs.form.subtypeTemplate[mczPrefs.form.template];
            if (originalSubtype != mczPrefs.form.subtype) {
              aTLg("Subtype Changed: '" + originalSubtype + "' > '" + mczPrefs.form.subtype + "'");
            }
          } else {
            aTLg("No template rule: " + mczPrefs.form.template);
            aTLg("Using subtype: " + mczPrefs.form.subtype);
          }
        } else {
          aTLg("subtype in template undefined.");
        }

        const templateName = mczPrefs.form?.template;
        const templates = window?.templateRules;

        templateLog = "\nTemplate = '" + templateName + "'\n" + templateLog;

        if (!templateName || !Array.isArray(templates)) {
          mkf_c.warn("Template incorrect.");
          mkf_c.groupEnd(groupLBL);
          return;
        }
        const templateRule = templates.find((template) => template.hasOwnProperty(templateName));
        if (!templateRule) {
          mkf_c.warn("Template missing rule: " + templateName);
          mkf_c.groupEnd(groupLBL);
          return;
        }
        const rule = templateRule[templateName];
        if (templateName.indexOf("flex") > -1 && !mktoFrmParams.get("template")) {
          mkf_c.log("\nFlex >> Rules are relaxed");
          mkf_c.groupEnd(groupLBL);
        } else {
          aTLg("\nEvaluating rules'" + templateName + "'");
          if (templateName.indexOf("flex") > -1 && mktoFrmParams.get("template") > -1) {
            aTLg("Testing Flex Form Detected - Rules Enforced");
          }

          if (rule.field_visibility) {
            aTLg("\nVisibility rules");
            applyRuleToFields(rule.field_visibility, mczPrefs.field_visibility, "field_visibility");
          }
          if (rule.field_filters) {
            aTLg("\nFilter rules");
            applyRuleToFields(rule.field_filters, mczPrefs.field_filters, "field_filters");
          }
        }

        aTLg("---");

        aTLg("\nComplete Rule for Template '" + templateName + "'\n");
        aTLg(JSON.stringify(rule, null, 2));
        mkf_c.log(templateLog);
        mkf_c.groupEnd(groupLBL);
      }

      function applyRuleToFields(ruleFields, fields, fieldName) {
        if (!fields) {
          return;
        }
        let matches_Y = "";
        let matches_N = "";
        Object.entries(ruleFields).forEach(function (entry) {
          var key = entry[0];
          var ruleArray = entry[1];
          var ruleValue = ruleArray[0].split(":")[0];
          let thisV =
            " - '" + key + "' is set as '" + fields[key] + "', Rule is '" + ruleValue + "'";

          if (fields[key] !== ruleValue) {
            matches_N += thisV + "\n";
            fields[key] = ruleValue;
          } else {
            matches_Y += thisV + "\n";
          }
        });
        if (matches_Y !== "") {
          matches_Y = "\nMatches:\n" + matches_Y + "\n";
        }
        if (matches_N !== "") {
          matches_N = "!!!!!! No Match:\n" + matches_N;
        }
        aTLg(matches_Y + matches_N);
      }
      if (window.knownMktoVisitor !== undefined && window.knownMktoVisitor !== null) {
        mkf_c.log("Known Visitor - marketoFormSetup");
        if (typeof privacyValidation === "function") {
          privacyValidation();
        }
      } else {
        if (typeof checkTemplate === "function") {
          checkTemplate();
        }
        if (typeof renderingReview === "function") {
          renderingReview();
        }
      }

      return;
    }

    if (window.location.href.indexOf("mkto_test") > -1) {
      if (mktoFrmParams.get("mkto_test") == "active") {
        if (localStorage.getItem("mkto_test_dl")) {
          if (localStorage.getItem("mkto_test") != "active") {
            localStorage.setItem("mkto_test", "active");
          }
          mkf_c.log("Test Data Layer Found");
          try {
            mcz_marketoForm_pref_test = JSON.parse(localStorage.getItem("mkto_test_dl"));
            mkf_c.log("current data layer", window.mcz_marketoForm_pref);
            mkf_c.log("test data layer", mcz_marketoForm_pref_test);
            checkAndAddProperties(window.mcz_marketoForm_pref, mcz_marketoForm_pref_test, true);
          } catch (error) {
            mkf_c.warn("ERROR: parsing error", error);
          }
        }
      } else {
        localStorage.setItem("mkto_test", "inactive");
        let url = new URL(window.location.href);
        url.searchParams.set("mkto_test", "inactive");
        window.history.replaceState({}, "", url.href);
      }
    } else {
      if (localStorage.getItem("mkto_test")) {
        if (localStorage.getItem("mkto_test") == "active") {
          mkf_c.log("Testing is active, redirecting to test version");
          let url = new URL(window.location.href);
          url.searchParams.set("mkto_test", "active");
          window.location.href = url.href;
        }
      }
    }

    function isTestRecord() {
      let testRecord = "not_test";
      let here = window.location.href.toLowerCase();

      let email_fld = document.querySelector('.mktoForm[id] [name="Email"]');
      if (email_fld) {
        if (email_fld.value.includes("@adobetest.com")) {
          testRecord = "test_submit";
          if (email_fld.value.includes("privacytest") || email_fld.value.includes("nosub")) {
            testRecord = "test_no_submit";
          }
        }
      }
      if (here.indexOf(".hlx.") > -1) {
        testRecord = "test_submit";
      }
      if (here.indexOf("preview=1") > -1 && here.indexOf("formid=") > -1) {
        testRecord = "test_no_submit";
      }
      if (window?.mcz_marketoForm_pref?.profile !== undefined) {
        if (testRecord == "not_test") {
          window.mcz_marketoForm_pref.profile["testing"] = false;
        } else {
          window.mcz_marketoForm_pref.profile["testing"] = true;
        }
      }

      if (testRecord.indexOf("test_submit") > -1) {
        consStyl = "font-size: 1.2em; color: purple; font-weight: bold; ";
      } else if (testRecord.indexOf("test_no_submit") > -1) {
        consStyl = "font-size: 1.2em; color: red; font-weight: bold; ";
      }

      return testRecord;
    }

    function mkto_buildForm() {
      let formId = window.getMktoFormID();
      if (typeof formId === "undefined" || formId === null) {
        return;
      }
      if (!mkto_formsLoaded[formId]) {
        mkto_formsLoaded[formId] = true;
      } else {
        mkf_c.log("Form [" + formId + "] already loaded");
        return;
      }

      //################################################
      //##
      //## Console read out
      //##

      var group_label = "Adobe Marketo Engage - Form Setup";
      mkf_c.group(group_label);

      function print_niceDL(json) {
        const friendlyNames = {
          field_visibility: "Field Visibility Preferences",
          field_filters: "Select Field Value Filters",
          subtypeRules: "Form Type Submit Verbs",
          profile: "Visitor Preferences",
          form: "Form Configuration",
          subType: "Form Type",
          type: "Application",
          program: "Marketo Program Settings",
          campaignids: "Campaign IDs",
          success: "Success - Thank You Reactions",
          value_setup: "How Fields relate to each other",
          mktoInstantInquiry: "Inquiry Creation",
          subtypeTemplate: "Template > Form Types",
          logging: "Tesing & Logging",
        };
        function isKeyValuePairObject(obj) {
          for (let key in obj) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              return false;
            }
          }
          return true;
        }
        function formatKeyValuePair(node) {
          let maxKeyLength = Math.max(...Object.keys(node).map((key) => key.length));
          let formattedPairs = [];
          for (let key in node) {
            let adjustedKey = key + " ".repeat(maxKeyLength - key.length);
            let combined = adjustedKey + " : \t" + node[key];
            formattedPairs.push(combined);
          }
          return formattedPairs;
        }
        function logNode(node, nodeName, depth = 0) {
          if (typeof node !== "object" || node === null) {
            return;
          }
          nodeName = friendlyNames[nodeName] ? friendlyNames[nodeName] : nodeName;
          if (
            depth === 0 ||
            nodeName == "Form Configuration" ||
            nodeName == "Campaign IDs" ||
            nodeName == "Marketo Program Settings" ||
            nodeName == "success"
          ) {
            mkf_c.group(nodeName ? `${nodeName}` : "Configuration");
          } else {
            mkf_c.groupCollapsed(nodeName ? `${nodeName}` : "Configuration");
          }
          let simpleKeys = Object.keys(node).filter(
            (key) => !(typeof node[key] === "object" && node[key] !== null)
          );
          let maxKeyLength = Math.max(...simpleKeys.map((key) => key.length));
          for (let key of simpleKeys) {
            let value = node[key];
            let adjustedKey = key + " ".repeat(maxKeyLength - key.length);
            mkf_c.log(`${adjustedKey} : ${value}`);
          }
          for (let key in node) {
            let value = node[key];
            if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
              logNode(value, key, depth + 1); // Increase the depth as we go deeper
            }
          }

          mkf_c.groupEnd(group_label);
        }
        function logJson(json) {
          logNode(json);
        }
        logJson(json);
      }
      print_niceDL(mcz_marketoForm_pref);

      isTestRecord();

      MktoForms2.getForm(formId).onValidate(function (valid) {
        let formId = getMktoFormID();
        let form = MktoForms2.getForm(formId);
        let fData = form.getValues();
        let unique_id = getUniqueID(fData);
        let requiredFields = document.querySelectorAll("#mktoForm_" + formId + " .mktoRequired");
        let requiredFieldsData = {};
        let requiredFieldsFilled = true;
        let testRecord = false;

        isTestRecord();
        if (window?.mcz_marketoForm_pref?.profile !== undefined) {
          if (typeof testRecord !== "boolean") {
            testRecord = false;
          } else {
            testRecord = window.mcz_marketoForm_pref.profile.testing;
          }
        }

        for (let i = 0; i < requiredFields.length; i++) {
          let fieldName = requiredFields[i].getAttribute("name");
          if (fieldName) {
            if (fData.hasOwnProperty(fieldName)) {
              requiredFieldsData[fieldName] = fData[fieldName];
            }
          }
        }
        for (let key in fData) {
          if (fData.hasOwnProperty(key)) {
            let review = "" + fData[key];
            if (review.indexOf("{{") > -1) {
              form.setValues({
                [key]: "",
              });
            }
            if (review != review.trim()) {
              form.setValues({ [key]: review.trim() });
            }
            if (requiredFieldsData.hasOwnProperty(key)) {
              if (review == "") {
                requiredFieldsFilled = false;
                mkf_c.log("Required Field Missing: " + key);
              }
            }
          }
        }
        let countryField = document.querySelector("#mktoForm_" + formId + ' [name="Country"]');
        if (countryField) {
          if (countryField.value == "") {
            let options = countryField.querySelectorAll("option");
            if (options && options.length > 0) {
              countryField.value = options[0].value;
            }
          }
        }

        let mktoInvalid_nonreq = document.querySelectorAll(
          "#mktoForm_" + formId + " .mktoInvalid:not(.mktoRequired)"
        );
        for (let i = 0; i < mktoInvalid_nonreq.length; i++) {
          mktoInvalid_nonreq[i].classList.remove("mktoInvalid");
        }

        if (requiredFieldsFilled) {
          valid = true;
        } else {
          valid = false;
        }

        if (fData.hasOwnProperty("Email")) {
          let eVld = true;
          if (fData.Email.indexOf("@") == -1) {
            eVld = false;
          }
          if (fData.Email.indexOf(".") == -1) {
            eVld = false;
          }
          let emailSplit = fData.Email.split("@");
          if (emailSplit.length == 2) {
            if (emailSplit[1].indexOf(".") == -1) {
              eVld = false;
            }
          }
          let eFld = document.querySelector("#mktoForm_" + formId + ' [name="Email"]');
          if (eFld) {
            if (fData.Email != fData.Email.trim()) {
              fData.Email = fData.Email.trim();
              form.setValues({ ["Email"]: fData.Email });
            }
            if (eFld.getAttribute("type") != "email") {
              eFld.setAttribute("type", "email");
            }
            if (eVld) {
              eFld.classList.remove("mktoInvalid");
              eFld.classList.add("mktoValid");
            } else {
              eFld.classList.remove("mktoValid");
              eFld.classList.add("mktoInvalid");
            }
          }
          if (!eVld) {
            valid = false;
          }
        }

        function mktoFrmsGetValueByName(name) {
          if (!name || typeof name !== "string") {
            return "";
          }
          const consentCheck = typeof checkAdobePrivacy === "function" && checkAdobePrivacy();
          const safeGet = (obj, path) => {
            return path.reduce(
              (acc, curr) => (acc && acc[curr] !== undefined ? acc[curr] : undefined),
              obj
            );
          };
          const getParam = (paramName) => {
            const campaignValue = safeGet(window, [
              "mcz_marketoForm_pref",
              "program",
              "campaignids",
              paramName,
            ]);
            if (campaignValue) {
              const trimmed = String(campaignValue).trim();
              if (trimmed && !["null", "undefined"].includes(trimmed)) {
                return trimmed;
              }
            }
            return new URLSearchParams(window.location.search).get(paramName) || "";
          };
          const getCookie = (cookieName) => {
            const cookies = document.cookie.split("; ").reduce((acc, curr) => {
              const [key, value] = curr.split("=");
              acc[key] = value;
              return acc;
            }, {});
            return cookies[cookieName] || "";
          };
          const getFromStorage = (storage, key) => {
            try {
              return storage?.getItem(key) || "";
            } catch {
              return "";
            }
          };
          const parseJSON = (value) => {
            if (!value || typeof value !== "string" || !value.trim()) {
              return "";
            }
            try {
              const parsed = JSON.parse(value);
              return parsed === null || parsed === undefined ? "" : parsed;
            } catch {
              return value;
            }
          };
          const getValue = () => {
            if (!consentCheck) {
              return getParam(name);
            }
            return (
              getParam(name) ||
              getFromStorage(sessionStorage, name) ||
              getCookie(name) ||
              getFromStorage(localStorage, name) ||
              ""
            );
          };
          const ensureString = (value) => {
            if (typeof value === "string") return value;
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
          };
          return ensureString(parseJSON(getValue()));
        }

        var mktoFrmPvtURL = new URL(window.location.href);
        mktoFrmPvtURL.searchParams.forEach((value, key) => {
          if (!value || value === "null" || value === "undefined") {
            mktoFrmPvtURL.searchParams.delete(key);
            return;
          }
          if (value.startsWith("|")) {
            return;
          }
          mktoFrmPvtURL.searchParams.set(key, "|" + value);
        });
        if (window?.mcz_marketoForm_pref?.program !== undefined) {
          window.mcz_marketoForm_pref.program["url"] = decodeURI(mktoFrmPvtURL.toString());
        }
        function addUniqueParam(paramName, paramValue) {
          if (!paramName || !paramValue) return mktoFrmPvtURL;
          const cleanName = String(paramName).trim();
          const cleanValue = String(paramValue).trim();
          if (!cleanValue || cleanValue === "null" || cleanValue === "undefined") {
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
              mktoFrmPvtURL.searchParams.set(newParamName, "|" + cleanValue);
            }
          } else {
            mktoFrmPvtURL.searchParams.set(cleanName, "|" + cleanValue);
          }
          if (window?.mcz_marketoForm_pref?.program !== undefined) {
            window.mcz_marketoForm_pref.program["url"] = decodeURI(mktoFrmPvtURL.toString());
          }
          return mktoFrmPvtURL;
        }

        try {
          const attrMapping = {
            sfdc: {
              field: "mktoProductionCampaignId",
              status: "internal_Prod_Camp_Status",
              queryParam: "s_iid",
              cookie: "s_iid",
              critical: true,
              starts_with: ["7015", "7011"],
              min_length: 18,
              max_length: 18,
            },
            external: {
              field: "mktoExternalCampaignId",
              status: "External_Camp_Status",
              queryParam: "s_cid",
              cookie: "s_cid",
              critical: false,
              starts_with: ["7015", "7011"],
              min_length: 18,
              max_length: 18,
            },
            retouch: {
              field: "mktoRetouchCampaignId",
              status: "Retouch_Camp_Status",
              queryParam: "s_rtid",
              cookie: "s_rtid",
              critical: false,
              starts_with: ["7015", "7011"],
              min_length: 18,
              max_length: 18,
            },
            onsite: {
              field: "mktoOnsiteCampaignId",
              status: "Onsite_Camp_Status",
              queryParam: "s_osc",
              cookie: "s_osc",
              critical: false,
              starts_with: ["7015", "7011"],
              min_length: 18,
              max_length: 18,
            },
          };

          const cgen_sparams = ["trackingid", "prid", "promoid", "sdid", "pss", "campaignid"];
          let mktoTreatmentId = window?.mcz_marketoForm_pref?.profile?.cgen;
          if (mktoTreatmentId === null || mktoTreatmentId === undefined || mktoTreatmentId === "") {
            mktoTreatmentId = "";
          }

          let TID = mktoFrmsGetValueByName("TID");
          let cgen_param = {
            trackingid: "",
            sdid: "",
            promoid: "",
            prid: "",
            pss: "",
            campaignid: "",
          };
          var cgen_cookie = {
            trackingid: "",
            sdid: "",
            promoid: "",
          };
          if (TID.indexOf("-") > -1) {
            let split_cgen = mktoTreatmentId.split("-");
            if (split_cgen.length > 2) {
              cgen_cookie.trackingid = split_cgen[0];
              cgen_cookie.sdid = split_cgen[1];
              cgen_cookie.promoid = split_cgen[2];
            }
          }
          for (let i = 0; i < cgen_sparams.length; i++) {
            let paramValue = mktoFrmsGetValueByName(cgen_sparams[i]);
            if (paramValue !== "" && paramValue !== null && paramValue !== undefined) {
              cgen_param[cgen_sparams[i]] = paramValue;
            }
          }
          let cgen_keys = Object.keys(cgen_param);
          let cgen_active = [];
          for (let i = 0; i < cgen_keys.length; i++) {
            let keyName = cgen_keys[i];
            let paranval = cgen_param[cgen_keys[i]];
            if (paranval !== "" && paranval !== null && paranval !== undefined) {
              cgen_active.push(paranval);
              if (mktoTreatmentId == "") {
                mktoTreatmentId = paranval;
              }
              addUniqueParam(keyName, paranval);
            }
          }
          if (mktoTreatmentId !== "" && mktoTreatmentId !== null && mktoTreatmentId !== undefined) {
            window.mcz_marketoForm_pref.profile["cgen"] = mktoTreatmentId;
            uFFld(form, "mktoTreatmentId", mktoTreatmentId);
          }
          if (cgen_active.length > 0) {
            form.addHiddenFields({
              sessionCGEN: cgen_active.join("-"),
            });
          }
          let gclid = window?.mcz_marketoForm_pref?.program?.campaignids?.gclid;
          if (gclid == "" || gclid == null || gclid == undefined) {
            gclid = mktoFrmsGetValueByName("gclid");
          }
          if (gclid) {
            if (window?.mcz_marketoForm_pref?.program?.campaignids !== undefined) {
              window.mcz_marketoForm_pref.program.campaignids["gclid"] = gclid;
            }
            uFFld(form, "mktoGoogleClickId", gclid);
          }

          const keys = Object.keys(attrMapping);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let value;
            if (window.mcz_marketoForm_pref?.program?.campaignids?.hasOwnProperty(key)) {
              if (window.mcz_marketoForm_pref?.program?.campaignids[key] != "") {
                value = window.mcz_marketoForm_pref?.program?.campaignids[key];
              }
            }
            if (value == "" || value == null || value == undefined) {
              let valcheck = mktoFrmsGetValueByName(attrMapping[key].queryParam);
              if (valcheck) {
                value = valcheck;
              } else {
                if (
                  attrMapping[key]?.cookie != "" &&
                  attrMapping[key]?.cookie != null &&
                  attrMapping[key]?.cookie != undefined
                ) {
                  let cookieVer = mktoFrmsGetValueByName(attrMapping[key].cookie);
                  if (cookieVer) {
                    mkf_c.log(attrMapping[key].cookie + " = " + cookieVer + " Sourced from cookie");
                    value = cookieVer;
                    addUniqueParam(attrMapping[key].queryParam, value);
                  }
                }
              }
            }
            if (value != "" && value != null && value != undefined) {
              let valid = true;
              if (attrMapping[key].starts_with) {
                valid = false;
                for (let j = 0; j < attrMapping[key].starts_with.length; j++) {
                  if (value.indexOf(attrMapping[key].starts_with[j]) == 0) {
                    valid = true;
                    break;
                  }
                }
                if (!valid) {
                  mkf_c.log(
                    "Invalid " +
                      attrMapping[key].field +
                      " value: " +
                      value +
                      " - does not start with " +
                      attrMapping[key].starts_with.join(", ")
                  );
                }
              }
              if (attrMapping[key].min_length && value.length > 0 && valid == true) {
                if (value.length < attrMapping[key].min_length) {
                  valid = false;
                  mkf_c.log(
                    "Invalid " + attrMapping[key].field + " value: " + value + " - too short"
                  );
                }
                if (attrMapping[key].max_length) {
                  if (value.length > attrMapping[key].max_length) {
                    valid = false;
                    mkf_c.log(
                      "Invalid " + attrMapping[key].field + " value: " + value + " - too long"
                    );
                  }
                }
              }
              if (valid) {
                uFFld(form, attrMapping[key].field, value, attrMapping[key].critical);
                if (attrMapping[key].status) {
                  uFFld(form, attrMapping[key].status, "Responded", attrMapping[key].critical);
                }
              } else {
                uFFld(form, attrMapping[key].field, "", attrMapping[key].critical);
              }
              addUniqueParam(attrMapping[key].queryParam, value);
            }
          }
        } catch (error) {
          mkf_c.warn("Error in attribute setup process: ", error);
        }

        if (window.mcz_marketoForm_pref?.profile?.privacy_optin !== undefined) {
          if (window.mcz_marketoForm_pref?.profile?.privacy_optin == "explicit") {
            form.addHiddenFields({
              mktoOKtoEmail: "N",
              mktoOKtoCall: "N",
            });
          } else {
            form.addHiddenFields({
              mktoOKtoEmail: "Y",
              mktoOKtoCall: "Y",
            });
          }
        }

        //confirm privacy values if field exists on form.
        if (document.querySelector('[name="mktokoreaEmailOptin"]')) {
          if (document.querySelector('[name="mktokoreaEmailOptin"]').offsetParent !== null) {
            if (document.querySelector('[name="mktokoreaEmailOptin"]').checked) {
              form.addHiddenFields({
                mktoOKtoEmail: "Y",
              });
            } else {
              form.addHiddenFields({
                mktoOKtoEmail: "N",
              });
            }
          } else {
            form.addHiddenFields({
              mktoOKtoEmail: "U",
            });
          }
        }

        if (document.querySelector('[name="mktokoreaPhoneOptin"]')) {
          if (document.querySelector('[name="mktokoreaPhoneOptin"]').offsetParent !== null) {
            if (document.querySelector('[name="mktokoreaPhoneOptin"]').checked) {
              form.addHiddenFields({
                mktoOKtoCall: "Y",
              });
            } else {
              form.addHiddenFields({
                mktoOKtoCall: "N",
              });
            }
          } else {
            form.addHiddenFields({
              mktoOKtoCall: "U",
            });
          }
        }

        if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]')) {
          if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]').offsetParent !== null) {
            if (document.querySelector('[name="mktoKoreaPrivacyThirdParty"]').checked) {
              form.addHiddenFields({
                mktoOKtoEmail: "Y",
                mktoOKtoCall: "Y",
              });
            } else {
              form.addHiddenFields({
                mktoOKtoEmail: "N",
                mktoOKtoCall: "N",
              });
            }
          } else {
            form.addHiddenFields({
              mktoOKtoEmail: "U",
              mktoOKtoCall: "U",
            });
          }
        }

        let mktoCoPartnerPermissionValue = document.querySelector(
          '.mktoFormRow [name="mktoCoPartnerPermissionValue"]'
        );
        if (mktoCoPartnerPermissionValue) {
          if (mktoCoPartnerPermissionValue.type == "checkbox") {
            if (mktoCoPartnerPermissionValue.checked) {
              form.setValues({ mktoCoPartnerPermissionValue: true });
            } else {
              form.setValues({ mktoCoPartnerPermissionValue: false });
            }
          } else {
            mktoCoPartnerPermissionValue.value = mktoCoPartnerPermissionValue.value
              .trim()
              .toLowerCase();
            if (mktoCoPartnerPermissionValue.value.indexOf("true") > -1) {
              form.setValues({ mktoCoPartnerPermissionValue: true });
            } else {
              form.setValues({ mktoCoPartnerPermissionValue: false });
            }
          }
        } else {
          form.setValues({ mktoCoPartnerPermissionValue: false, mktoCoPartnerConsentNotice: "" });
        }

        let pElemts = document.querySelectorAll(
          ".adobe-privacy .mktoHtmlText.mktoVisible:not(.privacy-subscription)"
        );
        let privactText = Array.from(pElemts)
          .map((item) => {
            return item.textContent;
          })
          .join(" ");

        let mktoInstantInquiry = false;
        let mktoformSubtype = mcz_marketoForm_pref?.form?.subtype;
        let mktoFormsTemplate = mcz_marketoForm_pref?.form?.template;
        if (
          mcz_marketoForm_pref?.form?.mktoInstantInquiry !== undefined &&
          typeof mcz_marketoForm_pref?.form?.mktoInstantInquiry === "object"
        ) {
          let chk_ia = mcz_marketoForm_pref?.form?.mktoInstantInquiry;
          if (chk_ia !== null) {
            if (chk_ia[mktoformSubtype] === true) {
              mktoInstantInquiry = true;
            }
          }
        }

        if (mcz_marketoForm_pref?.profile?.known_visitor == true) {
          form.addHiddenFields({
            mktoOKtoMail: "U",
            mktoOKtoEmail: "U",
            mktoOKtoCall: "U",
            mktoMPSPermissionsFlag: true,
            mktoOKtoShare: false,
            autosubmit: true,
            mktoInstantInquiry: mktoInstantInquiry,
          });
        } else {
          form.addHiddenFields({
            mktoOKtoMail: "U",
            mktoMPSPermissionsFlag: true,
            autosubmit: false,
            mktoInstantInquiry: mktoInstantInquiry,
          });
        }
        mcz_marketoForm_pref.profile["mktoInstantInquiry"] = mktoInstantInquiry;

        uFFld(form, "mktoformType", mcz_marketoForm_pref?.form?.type, true);
        uFFld(form, "mktoformSubtype", mktoformSubtype, true);
        uFFld(form, "languagePref", mcz_marketoForm_pref?.profile?.segLangCode, true);
        uFFld(form, "mktoConsentURL", mcz_marketoForm_pref?.program?.url, true);
        uFFld(form, "mktoFormsPrimaryProductInterest", mcz_marketoForm_pref?.program?.poi, true);

        let d = new Date();
        let year = d.getFullYear();
        let month = (d.getMonth() + 1).toString().padStart(2, "0");
        let day = d.getDate().toString().padStart(2, "0");
        let hours = d.getHours().toString().padStart(2, "0");
        let minutes = d.getMinutes().toString().padStart(2, "0");
        let seconds = d.getSeconds().toString().padStart(2, "0");
        let datetime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

        form.addHiddenFields({
          mktoFormsTemplate: mktoFormsTemplate,
          mktoLastUnsubscribeDate: datetime,
          unique_id: unique_id,
          submissionID: unique_id,
          MktoSessionSubmissionID: unique_id
        });

        let subID = window?.mcz_marketoForm_pref?.program?.subscription?.id || "";
        subID = subID.trim();
        if (subID !== undefined && subID !== null && subID !== "") {
          mkf_c.log("SubID: " + subID + ".");
          form.addHiddenFields({
            mktoOKtoMail: "U",
            mktoOKtoEmail: "U",
            mktoOKtoCall: "U",
            mktoOPContentSubscriptionConsentNotice: privactText,
            mktoOPContentSubscriptionName: subID,
            mktoSessionSubscriptionID: subID,
            mktoOPContentSubscriptionPermissionValue: "Y",
          });
        }

        if (activeCookie == true) {
          try {
            if (window?.adobeIMS?.isSignedInUser())
              if (typeof _satellite.getVisitorId().getCustomerIDs().adobeid == "object") {
                if (typeof _satellite.getVisitorId().getCustomerIDs().adobeid.id == "string") {
                  s_guid = _satellite.getVisitorId().getCustomerIDs().adobeid.id;
                  if (s_guid != "") {
                    if (window.mcz_marketoForm_pref?.profile !== undefined) {
                      window.mcz_marketoForm_pref.profile.guid = s_guid;
                    }

                    form.addHiddenFields({
                      sessionGUID: s_guid,
                    });
                  }
                }
              }
          } catch (err) {}
          if (document.cookie.indexOf("MCMID%7C") > 0 && document.cookie.indexOf("MCAAMLH-") > 0) {
            var mcmid = /MCMID%7C([^%|;]+)/.exec(document.cookie);
            var mcaamlh = /MCAAMLH-[^%|;]+%7C([0-9]+)/.exec(document.cookie);
            if (mcmid && mcaamlh && mcmid.length > 1 && mcaamlh.length > 1) {
              s_ecid = mcaamlh[1] + ":" + mcmid[1];
              if (s_ecid.length > 10) {
                if (window.mcz_marketoForm_pref?.profile !== undefined) {
                  window.mcz_marketoForm_pref.profile.ecid = s_ecid;
                }
                form.addHiddenFields({
                  sessionECID: s_ecid,
                });
                if (s_ecid.indexOf(":") > -1) {
                  let temp_mcid = s_ecid.split(":")[1];
                  if (temp_mcid.length > 5) {
                    form.addHiddenFields({
                      mktoMcid: temp_mcid,
                    });
                  }
                }
              }
            }
          }
          if (document.cookie.indexOf("TID=") > 0) {
            s_cgen = /TID=([^%|;]+)/.exec(document.cookie)[1];
            if (s_cgen.length > 5) {
              if (window.mcz_marketoForm_pref?.profile !== undefined) {
                window.mcz_marketoForm_pref.profile.cgen = s_cgen;
              }
            }
          }
        } else {
          mkf_c.log("No Marketo Cookie found");
        }

        if (typeof window.Demandbase != "undefined") {
          if (typeof window?.Demandbase?.Connectors?.WebForm?.fieldMap != "undefined") {
            let dataSource = window.Demandbase.Connectors.WebForm.dataSource;
            let detectedAudience = window.Demandbase.Connectors.WebForm.detectedAudience;
            let detectedAudienceSegment =
              window.Demandbase.Connectors.WebForm.detectedAudienceSegment;

            let fieldMap = window?.Demandbase?.Connectors?.WebForm?.fieldMap;
            let fieldDBdata = window?.Demandbase?.Connectors?.WebForm?.CompanyProfile;
            if (typeof fieldDBdata != "undefined") {
              let fieldMapData = {};
              for (let key in fieldMap) {
                if (fieldMap.hasOwnProperty(key)) {
                  if (fieldDBdata.hasOwnProperty(key)) {
                    fieldMapData[fieldMap[key]] = fieldDBdata[key];
                  }
                }
              }
              let fieldMapData_onForm = {};
              for (let key in fieldMapData) {
                if (fieldMapData.hasOwnProperty(key)) {
                  if (document.querySelector('[name="' + key + '"]')) {
                    fieldMapData_onForm[key] = fieldMapData[key];
                  }
                }
              }

              let fieldMapData_non = {};
              mcz_marketoForm_pref.demandbaseInfo = mcz_marketoForm_pref.demandbaseInfo || {};
              for (let key in fieldDBdata) {
                if (fieldDBdata.hasOwnProperty(key)) {
                  mcz_marketoForm_pref.demandbaseInfo[key] = fieldDBdata[key];
                  if (!fieldMap.hasOwnProperty(key)) {
                    fieldMapData_non[key] = fieldDBdata[key];
                  }
                }
              }

              var group_label = "Demandbase";
              mkf_c.group(group_label);
              mkf_c.info("Data Source: " + dataSource);
              mkf_c.info("Detected Audience: " + detectedAudience);
              mkf_c.info("Detected Audience Segment: " + detectedAudienceSegment);
              mkf_c.table("Mapped Fields");
              mkf_c.table(fieldMapData);
              mkf_c.table("Mapped Fields on this Form");
              mkf_c.table(fieldMapData_onForm);
              mkf_c.table("Non-Mapped Fields");
              mkf_c.table(fieldMapData_non);
              mkf_c.groupEnd(group_label);
            }
          }
        }
        fData = form.getValues();
        var group_label = "Marketo Submit Validation";
        var group_append = "";
        if (testRecord) {
          group_append = " - Test Record";
        }
        mkf_c.group(group_label);
        mkf_c.log("%cForm Valid:" + valid, consStyl);
        let ne = new Date();
        mkf_c.log("%cForm Data: @" + ne.toLocaleString(), consStyl);

        let poi_warn = fData["mktoFormsPrimaryProductInterest"];
        if (poi_warn == "") {
          mkf_c.log("%cPrimary Product Interest is empty - Critical Field", consStyl);
        } else {
          mkf_c.log("%cPrimary Product Interest: " + poi_warn, consStyl);
        }

        let mktoProductionCampaignId_warn = fData["mktoProductionCampaignId"];
        if (mktoProductionCampaignId_warn == "") {
          mkf_c.log("%cProduction Campaign ID is empty - Critical Field", consStyl);
        } else {
          mkf_c.log("%cProduction Campaign ID: " + mktoProductionCampaignId_warn, consStyl);
        }

        mkf_c.table("Required Fields" + group_append);
        mkf_c.table(requiredFieldsData);
        mkf_c.table("All Fields" + group_append);
        mkf_c.table(fData);

        mkf_c.groupEnd(group_label);

        let errorDiv = document.querySelector('div[data-mkto_vis_src="msg-error"]');
        if (!valid) {
          form.submittable(valid);
          let mktoSubmitButton = document.querySelectorAll("#mktoForm_" + formId + " button");
          if (mktoSubmitButton) {
            for (let i = 0; i < mktoSubmitButton.length; i++) {
              mktoSubmitButton[i].removeAttribute("disabled");
              if (mktoSubmitButton[i].getAttribute("data-mkto-btn-text")) {
                mktoSubmitButton[i].textContent =
                  mktoSubmitButton[i].getAttribute("data-mkto-btn-text");
              }
            }
          }

          if (typeof aaInteraction === "function") {
            aaInteraction("Marketo Form Error", "formError", formId, null);
          }
          if (errorDiv) {
            errorDiv.style.display = "contents";
          }
        } else {
          if (errorDiv) {
            errorDiv.style.display = "none";
          }

          form.submittable(valid);
        }
        return valid;
      });

      window.mktoDoSubmit = function (formId) {
        let validForm = MktoForms2.getForm(formId).validate();
        let submittable = MktoForms2.getForm(formId).submittable();
        if (submittable) {
          let canSubmit = true;
          if (canSubmit && validForm) {
            let testRecord = isTestRecord();
            if (testRecord == "test_no_submit") {
              mkf_c.log("%c" + "Test Record Detected - Emulating Marketo Submission", consStyl);

              mcz_marketoForm_pref.form.success.confirm = true;
              if (aaInteractionsActive == true && aaInteraction != undefined) {
                let delay = 5000;
                aaInteraction("Marketo Form Submission", "formSubmission", formId, null);
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

                window.mktoFormConfirm = setTimeout(function () {
                  if (typeof MktoForms_onSuccess === "function") {
                    MktoForms_onSuccess();
                  } else {
                    mkf_c.error("MktoForms_onSuccess is not defined");
                  }
                }, delay);
              } else {
                MktoForms_onSuccess();
                mkf_c.log("aaInteractionsActive is false");
              }
            } else {
              const mktoSubmitButton = document.querySelector(
                "#mktoForm_" + formId + " button[type='submit']"
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
        const mktoButtonWrap = document.querySelector("#mktoForm_" + formId + " .mktoButtonWrap");
        if (mktoButtonWrap) {
          let primaryBTN = mktoButtonWrap.querySelector("[type='submit']");
          if (primaryBTN) {
            const mktoButtonContainer = document.createElement("div");
            mktoButtonContainer.className = "mktoButtonContainer";
            mktoButtonWrap.parentNode.insertBefore(mktoButtonContainer, mktoButtonWrap);
            mktoButtonContainer.appendChild(mktoButtonWrap);

            const newButton = document.createElement("button");
            newButton.type = "button";
            newButton.id = "mktoButton_new";
            if (primaryBTN?.className) {
              newButton.className = primaryBTN.className;
            }
            if (primaryBTN.style) {
              newButton.style = primaryBTN.style;
              primaryBTN.style.display = "none";
            }
            if (primaryBTN.classList) {
              primaryBTN.classList.add("mktoHidden");
            }
            if (primaryBTN.getAttribute("data-mkto-btn-pleasewait")) {
              newButton.setAttribute(
                "data-mkto-btn-pleasewait",
                primaryBTN.getAttribute("data-mkto-btn-pleasewait")
              );
            }

            let primaryBTNtext = primaryBTN.textContent;
            let subtypeRules = mcz_marketoForm_pref?.form?.subtypeRules;
            let subtype = mcz_marketoForm_pref?.form?.subtype;
            let language = mcz_marketoForm_pref?.profile?.prefLanguage;
            if (subtype) {
              if (subtypeRules && subtypeRules !== null) {
                let subtypeRule = subtypeRules[subtype];
                if (subtypeRule) {
                  let translatedSubmit = translateFormElems[subtypeRule];
                  if (translatedSubmit) {
                    translatedSubmit =
                      translatedSubmit[language] ||
                      translatedSubmit[language.substring(0, 2)] ||
                      null;
                    if (translatedSubmit === null) {
                      translatedSubmit = translatedSubmit[subtypeRule];
                      for (var key in translatedSubmit) {
                        if (key.substring(0, 2) === language.substring(0, 2)) {
                          translatedSubmit = translatedSubmit[key];
                          break;
                        }
                      }
                    }

                    if (translatedSubmit) {
                      primaryBTNtext = translatedSubmit;
                    } else {
                      mkf_c.log(
                        "Check General_Translations, No translated '" +
                          subtypeRule +
                          "' text found for language: " +
                          language
                      );
                    }
                  } else {
                    mkf_c.log(
                      "Check General_Translations, No translated submit text found for button subtype: " +
                        subtypeRule
                    );
                  }
                }
              }
            }

            primaryBTN.setAttribute("mkto-form-original", formId);
            newButton.innerHTML = primaryBTNtext;
            newButton.setAttribute("mkto-form-src", formId);

            const newButtonWrap = document.createElement("span");
            newButtonWrap.className = "mktoButtonWrap mktoNative";
            newButtonWrap.appendChild(newButton);
            mktoButtonContainer.insertBefore(newButtonWrap, mktoButtonWrap);

            newButton.addEventListener("click", function (event) {
              let formId = event.target.getAttribute("mkto-form-src");
              if (formId) {
                event.target.disabled = true;

                //if this has a data-mkto-btn-pleasewait set the text to it
                let pleaseWaitText = event.target.getAttribute("data-mkto-btn-pleasewait");
                if (pleaseWaitText) {
                  event.target.setAttribute("data-mkto-btn-text", event.target.textContent);
                  event.target.innerHTML = pleaseWaitText;
                }

                setTimeout(function () {
                  event.target.disabled = false;
                  let buttonText = event.target.getAttribute("data-mkto-btn-text");
                  if (buttonText) {
                    event.target.innerHTML = buttonText;
                  }
                }, 10000);

                mktoDoSubmit(formId);
              }
            });
          } else {
            setTimeout(function () {
              window.doBTNUpdate(formId);
            }, 25);
          }
        }
      };

      setTimeout(function () {
        window.doBTNUpdate(formId);
      }, 25);

      if (translateFormElems?.pleasewait) {
        let language = mcz_marketoForm_pref?.profile?.prefLanguage;
        let translatedSubmit = translateFormElems.pleasewait["en_us"]; // Default to English

        if (language) {
          translatedSubmit =
            translateFormElems.pleasewait[language] ||
            translateFormElems.pleasewait[language.substring(0, 2)] ||
            null;

          if (translatedSubmit === null) {
            for (var key in translateFormElems.pleasewait) {
              if (key.substring(0, 2) === language.substring(0, 2)) {
                translatedSubmit = translateFormElems.pleasewait[key];
                break;
              }
            }
          }

          if (translatedSubmit === null) {
            mkf_c.log(
              `Check General_Translations, No translated 'pleasewait' text found for language: ${language}`
            );
          }
        }

        if (!translatedSubmit.endsWith("...")) {
          translatedSubmit += "...";
        }

        translateFormElems.pleasewait = translatedSubmit;

        document.querySelectorAll(".mktoButton").forEach((button) => {
          button.setAttribute("data-mkto-btn-pleasewait", translatedSubmit);
        });
      }

      MktoForms2.getForm(formId).onSuccess(function (values, followUpUrl) {
        mcz_marketoForm_pref.form.success.confirm = true;
        if (aaInteractionsActive == true && aaInteraction != undefined) {
          aaInteraction("Marketo Form Submission", "formSubmission", formId, null);
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
          if (window.mktoFormConfirm != undefined) {
            clearTimeout(window.mktoFormConfirm);
          }
          window.mktoFormConfirm = setTimeout(function () {
            if (typeof MktoForms_onSuccess === "function") {
              MktoForms_onSuccess();
            } else {
              mkf_c.error("MktoForms_onSuccess is not defined");
            }
          }, delay);
        } else {
          mkf_c.log("aaInteractionsActive is false");
          if (typeof MktoForms_onSuccess === "function") {
            MktoForms_onSuccess();
          } else {
            mkf_c.error("MktoForms_onSuccess is not defined");
          }
        }
        return false;
      });

      mkf_c.groupEnd(group_label);
    }
    // ##
    // ##
    // ##
    // ##
    window.MktoForms_onSuccess = function () {
      if (window.mktoFormConfirm !== undefined) {
        clearTimeout(window.mktoFormConfirm);
      }
      var group_label = "Marketo Submit Success";
      mkf_c.group(group_label);
      function logSuccess(message) {
        mkf_c.log("%c" + message, consStyl);
      }

      if (window?.mcz_marketoForm_pref?.profile?.testing == true) {
        logSuccess("Form Submitted - Test Record");
      } else {
        logSuccess("Form Submitted");
      }

      function MktoFormsValidUrl(url) {
        try {
          new URL(url);
          return true;
        } catch (_) {
          return false;
        }
      }

      let ty_content = "" + mcz_marketoForm_pref?.form?.success?.content;
      ty_content = ty_content.trim();

      if (mcz_marketoForm_pref?.form?.success?.type == undefined) {
        mcz_marketoForm_pref.form.success.type = "redirect";
        logSuccess("Form Success Type not defined, defaulting to redirect");
      }

      if (ty_content != "" && ty_content != "null" && ty_content != "undefined") {
        if (MktoFormsValidUrl(ty_content) == true) {
          logSuccess("TY URL");
          if (ty_content.indexOf("http") == -1) {
            logSuccess("TY relative URL");
            if (ty_content.indexOf("/") == 0) {
              ty_content = ty_content.substring(1);
            }
            ty_content = window.location.origin + "/" + ty_url;
          }
          logSuccess("TY is a valid URL: " + ty_content);
        } else {
          logSuccess("URL=X >> message.");
          mcz_marketoForm_pref.form.success.type = "message";
        }
      } else {
        logSuccess("TY=X for lang");

        if (translateFormElems?.thankyou) {
          let language = mcz_marketoForm_pref?.profile?.prefLanguage;
          let tyFallback = "Thank you.";
          let translatedTY =
            Object.entries(translateFormElems.thankyou).find(([key]) =>
              key.toLowerCase().startsWith("en")
            )?.[1] || "Thank you for your submission.";

          if (language) {
            const langCode = language.substring(0, 2).toLowerCase();
            translatedTY =
              translateFormElems.thankyou[language] ||
              translateFormElems.thankyou[langCode] ||
              Object.entries(translateFormElems.thankyou).find(([key]) =>
                key.toLowerCase().startsWith(langCode)
              )?.[1] ||
              null;

            if (translatedTY === null) {
              mkf_c.log(`No language: ${language}`);
            } else {
              mkf_c.log(`language: ${language}`);
            }
          }

          if (translatedTY === null) {
            translatedTY = tyFallback;
            mkf_c.log(`No language: ${language}`);
          }
          ty_content = translatedTY;
        }
      }

      let ne = new Date();
      mkf_c.log("%cForm Data: @" + ne.toLocaleString(), consStyl);
      logSuccess("Form Submit Date: " + ne.toLocaleString());
      logSuccess("Form Submit Unique ID: " + window?.mcz_marketoForm_pref?.profile?.unique_id);

      mkf_c.groupEnd(group_label);

      if (mcz_marketoForm_pref?.form?.success?.type == "redirect") {
        if (ty_content != "" && ty_content != null && ty_content != undefined) {
          try {
            if (ty_content.indexOf("submissionid") == -1) {
              let unique_id = window?.mcz_marketoForm_pref?.profile?.unique_id;
              if (unique_id) {
                let url = new URL(ty_content);
                url.searchParams.set("submissionid", unique_id);
                ty_content = url.toString();
              }
            }
          } catch (e) {
            mkf_c.log("Failed to add submissionid", e);
          }

          window.location.href = ty_content;
        }
      } else {
        if (ty_content == "" || ty_content == "null" || ty_content == "undefined") {
          ty_content = "Thank you for your submission.";
        }

        let form = document.getElementById("mktoForm_" + mcz_marketoForm_pref?.form?.id);
        let formWrapper = document.createElement("div");
        formWrapper.classList.add("mktoForm-wrap");

        let formMessageContent = document.createElement("p");
        formMessageContent.classList.add("ty-message");
        formMessageContent.innerHTML = ty_content;
        formWrapper.appendChild(formMessageContent);
        form.parentNode.insertBefore(formWrapper, form);
        form.style.opacity = "0";
        form.style.visibility = "hidden";
        form.reset();

        setTimeout(function () {
          formMessageContent.style.opacity = "1";
          formMessageContent.style.visibility = "visible";
        }, 100);
      }
    };

    mkto_buildForm();
  }

  mkf_c.log("Marketo Form Setup - End");
}

// ##
// ##
// ]]>