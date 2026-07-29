// ##
// ## Updated 20260720T183306
// ##
// ##
// ##  90_build/global.js - 20260720T183306
// ##

if (typeof window?.mkto_checkAdobePrivacy == "undefined") {
  var adobeOrg = "";
  if (window?.imsOrgId) {
    adobeOrg = "AMCV_" + encodeURIComponent(window?.imsOrgId) + ";";
  }

  window.mkto_checkAdobePrivacy = function () {
    if (typeof window?.adobePrivacy?.hasUserProvidedConsent === "function") {
      if (window?.adobePrivacy?.hasUserProvidedConsent()) {
        mkf_c.log("adobePrivacy: Consent granted.");
        return true;
      } else {
        mkf_c.log("adobePrivacy: Consent not granted.");
        return false;
      }
    } else {
      mkf_c.log("adobePrivacy: is not available, assuming consent granted by default.");
      return true;
    }
  };

  window.mkto_isTestRecord = function () {
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
  };

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

  window.MktoForms_tyMsg = function (ty_content = "") {
    if (ty_content == "") {
      mkf_c.log("TY content is empty, setting to default");
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
      mkf_c.log("Setting TY message content opacity and visibility");
      formMessageContent.style.opacity = "1";
      formMessageContent.style.visibility = "visible";
    }, 100);
  };

  window.MktoFormsValidUrl = function (url) {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  window.mktoFrmsGetValueByName = function (name) {
    if (!name || typeof name !== "string") {
      return "";
    }
    const consentCheck = typeof mkto_checkAdobePrivacy === "function" && mkto_checkAdobePrivacy();
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
  };

  window.translateButtons = function (translationKey) {
    let append = "";
    let language = mcz_marketoForm_pref?.profile?.prefLanguage;
    let translatedText = translateFormElems?.[translationKey]?.["en_us"] || null;
    let current = "";

    if (translatedText === null) {
      mkf_c.log(
        `Check General_Translations, No translated '${translationKey}' text found for language: ${language}`
      );
      return;
    }
    current = translatedText;
    if (translatedText.indexOf("...") > 0) {
      append = "...";
    }
    if (language) {
      translatedText =
        translateFormElems[translationKey][language] ||
        translateFormElems[translationKey][language.substring(0, 2)] ||
        null;
      if (translatedText === null) {
        for (var key in translateFormElems[translationKey]) {
          if (key.substring(0, 2) === language.substring(0, 2)) {
            translatedText = translateFormElems[translationKey][key];
            break;
          }
        }
      }
    }
    if (translatedText === null) {
      mkf_c.log(
        `Check General_Translations, No translated '${translationKey}' text found for language: ${language}`
      );
    } else {
      document
        .querySelectorAll(".mktoButtonRow button, .mktoButtonRow .mkto-step00of99")
        .forEach((button) => {
          if (button.textContent?.toLowerCase().trim() === current.toLowerCase().trim()) {
            button.setAttribute("data-mkto-btn-" + translationKey, translatedText + append);
            button.textContent = translatedText + append;
          }
          let alt_translationKey = button.getAttribute("data-translationKey") || null;
          if (button.getAttribute("data-translationKey") !== null) {
            if (alt_translationKey !== translationKey) {
              translateButtons(alt_translationKey);
            }
          }
        });
    }
  };

  window.mkto_checkCookie = function (incMunchkin = true) {
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

  window.stripUrlParams = function (paramsToStrip) {
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      let wasModified = false;
      paramsToStrip.forEach((param) => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          wasModified = true;
        }
      });
      if (wasModified) {
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  };

  window.mkto_getMktToken = function () {
    if (window?.__mktTokVal?.length > 0) {
      return window.__mktTokVal;
    }

    const storageKey = "mkt_tok";
    let mktToken = "";

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(storageKey)) {
      mktToken = urlParams.get(storageKey);
      try {
        localStorage.setItem(storageKey, mktToken);
      } catch (e) {
        mkf_c.warn(`Could not save ${storageKey} to localStorage`, e);
      }
    } else {
      mktToken = localStorage.getItem(storageKey) || "";
    }
    if (mktToken) {
      window.stripUrlParams([storageKey]);
      window.__mktTokVal = mktToken;
      window.mcz_marketoForm_pref.profile = window.mcz_marketoForm_pref.profile || {};
      window.mcz_marketoForm_pref.profile.mktTok = mktToken;
    }
    return mktToken;
  };

  window.mkto_prefillControl = async function () {
    const formId = window.mcz_marketoForm_pref?.form?.id;
    const prefillFields = window.mktoPreFillFields;
    if (!formId || !prefillFields) {
      return [];
    }

    const scheduleFrame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame.bind(window)
        : (cb) => setTimeout(cb, 16);

    const queueChangeEvent = (field) =>
      new Promise((resolve) => {
        scheduleFrame(() => {
          const changeEvt = new Event("change", { bubbles: true });
          field.dispatchEvent(changeEvt);
          scheduleFrame(() => resolve(field.getAttribute("name") || ""));
        });
      });

    let attemptCount = 1;
    let timeoutHere = 25;
    const waitForObserver = () =>
      new Promise((resolve) => {
        const checkObserver = () => {
          const observer = document.querySelector(
            `form.mktoForm[id="mktoForm_${formId}"] .fnc_field_observer_country`
          );
          if (observer) {
            if (attemptCount > 1) {
              mkf_c.log(
                `Form ready for prefill after ${Math.round(
                  (attemptCount * timeoutHere) / 1000,
                  2
                )} seconds.`
              );
            }
            resolve(true);
            return;
          }
          attemptCount++;
          if (attemptCount < 200) {
            setTimeout(checkObserver, timeoutHere);
          } else {
            resolve(false);
          }
        };
        checkObserver();
      });

    const observerReady = await waitForObserver();
    if (!observerReady) {
      mkf_c.log(
        `Prefill: Form not ready after ${Math.round(
          (attemptCount * timeoutHere) / 1000,
          2
        )} seconds, skipping prefill.`
      );
      return [];
    }

    const visibleFields = {};
    const processedFields = new Set();
    const changeDispatches = [];
    const awaitQueuedChanges = async () => {
      if (changeDispatches.length === 0) {
        return;
      }
      const pendingChanges = [...changeDispatches];
      changeDispatches.length = 0;
      await Promise.all(pendingChanges);
    };
    const dependences = window.mcz_marketoForm_pref?.value_setup?.field_dependance || {};
    const formFieldSelector = (name) =>
      `form.mktoForm[id="mktoForm_${formId}"] .mktoFormRowTop [name="${name}"]`;

    const collectPrefillCandidate = (fieldName, providedValue = null) => {
      const field = document.querySelector(formFieldSelector(fieldName));
      if (!field) {
        return null;
      }

      const fieldRows = document.querySelectorAll(formFieldSelector(fieldName)).length;
      const fieldHidden = document.querySelectorAll(
        `form.mktoForm[id="mktoForm_${formId}"] .mktoFormRowTop.mktoHidden [name="${fieldName}"]`
      ).length;

      if (fieldRows === 0 || fieldHidden !== 0) {
        return null;
      }

      const currentValue = field.value || "";
      let currentPrefillValue = (providedValue ?? prefillFields[fieldName]) || "";
      if (currentValue !== "" || currentPrefillValue === "") {
        return null;
      }

      if (field.tagName === "SELECT") {
        let selectedOption = field.querySelector(`option[value="${currentPrefillValue}"]`);
        if (!selectedOption) {
          const normalizedPrefill = currentPrefillValue.trim().toLowerCase();
          selectedOption = Array.from(field.options || []).find((option) => {
            const optionText = (option.textContent || "").trim().toLowerCase();
            return optionText === normalizedPrefill;
          });
        }
        if (selectedOption) {
          currentPrefillValue = selectedOption.value;
        }
      }

      field.classList.add("mktoPrefill");
      return currentPrefillValue !== "" ? { fld: field, val: currentPrefillValue } : null;
    };

    Object.keys(prefillFields).forEach((fieldName) => {
      const fieldOutput = collectPrefillCandidate(fieldName, prefillFields[fieldName]);
      if (fieldOutput !== null) {
        visibleFields[fieldName] = fieldOutput.val;
        window.MktoForms2.getForm(formId).setValuesCoerced({ [fieldName]: fieldOutput.val });
        fieldOutput.fld.classList.add("mktoPrefilled");
        changeDispatches.push(queueChangeEvent(fieldOutput.fld));
        processedFields.add(fieldName);
      }
    });

    await awaitQueuedChanges();

    if (Object.keys(visibleFields).length === 0) {
      const staleFields = document.querySelectorAll(".mktoPrefill");
      staleFields.forEach((field) => {
        field.classList.remove("mktoPrefill");
        field.classList.remove("mktoPrefilled");
      });
      return [];
    }

    const depFields = {};
    Object.keys(visibleFields).forEach((fieldName) => {
      const field = document.querySelector(formFieldSelector(fieldName));
      if (field) {
        Object.keys(dependences).forEach((dep) => {
          if (dependences[dep] === fieldName && window.mktoPreFillFields[dep]) {
            const depFieldOutput = collectPrefillCandidate(dep, window.mktoPreFillFields[dep]);
            if (depFieldOutput !== null) {
              depFields[dep] = depFieldOutput.val;
              window.MktoForms2.getForm(formId).setValuesCoerced({ [dep]: depFieldOutput.val });
              depFieldOutput.fld.classList.add("mktoPrefilled");
              changeDispatches.push(queueChangeEvent(depFieldOutput.fld));
              processedFields.add(dep);
            }
          }
        });
      }
    });

    if (Object.keys(depFields).length > 0) {
      mkf_c.log(`Processing dependent fields:\n${JSON.stringify(depFields)}`);
      await awaitQueuedChanges();
    }

    const cleanupFields = document.querySelectorAll(".mktoPrefill");
    cleanupFields.forEach((field) => {
      field.classList.remove("mktoPrefill");
      field.classList.remove("mktoPrefilled");
    });
    return Array.from(processedFields);
  };

  window.mkto_prefillInit = async function () {
    const waitForNextFrame = () =>
      new Promise((resolve) => {
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => resolve());
        } else {
          setTimeout(resolve, 16);
        }
      });

    const runPrefillSequence = async (maxPasses = 5) => {
      if (window.__mktoPrefillSequenceRunning) {
        mkf_c.log("Prefill sequence already running, skipping re-entry.");
        return window.__mktoPrefillSequenceRunning;
      }

      const sequencePromise = (async () => {
        const allUpdatedFields = new Set();
        try {
          for (let pass = 0; pass < maxPasses; pass++) {
            const updatedFields = (await window.mkto_prefillControl()) || [];
            if (!Array.isArray(updatedFields) || updatedFields.length === 0) {
              break;
            }
            updatedFields.forEach((field) => allUpdatedFields.add(field));
            mkf_c.log(`Prefill iteration ${pass + 1} updated fields: ${updatedFields.join(", ")}`);
            if (pass < maxPasses - 1) {
              await waitForNextFrame();
            }
          }
        } catch (error) {
          mkf_c.error("Prefill sequence error", error);
          throw error;
        } finally {
          window.__mktoPrefillSequenceRunning = null;
        }
        return Array.from(allUpdatedFields);
      })();

      window.__mktoPrefillSequenceRunning = sequencePromise;
      return sequencePromise;
    };

    const result = await runPrefillSequence();
    return result;
  };

  window.mkto_getUniqueID = function (formValues = {}, bypass = false) {
    if (!window.mcz_marketoForm_pref) {
      window.mcz_marketoForm_pref = {};
    }
    if (!window.mcz_marketoForm_pref.profile) {
      window.mcz_marketoForm_pref.profile = {};
    }
    const profile = window.mcz_marketoForm_pref.profile;
    const toStringSafe = (value) => {
      if (value === undefined || value === null) {
        return "";
      }
      return String(value);
    };
    const cleanUniqueId = (value) => toStringSafe(value).replace(/null|undefined/g, "");
    let programId = toStringSafe(window?.mcz_marketoForm_pref?.program?.id || "");
    programId = programId.replace(/[^0-9]/g, "").substring(0, 10);
    let leadId = toStringSafe(profile?.lead_id || "");
    leadId = leadId.replace(/[^0-9]/g, "").substring(0, 10);
    let munchkinId = toStringSafe(formValues?.munchkinId || "");
    if (!munchkinId) {
      const munchkinField = document.querySelector(".mktoForm[id] input[name='munchkinId']");
      if (munchkinField) {
        munchkinId = toStringSafe(munchkinField.value);
      }
    }
    munchkinId = munchkinId.trim();
    let formId = toStringSafe(formValues?.formid || window?.mcz_marketoForm_pref?.form?.id || "");
    formId = formId.trim();
    const buildBaseUniqueId = () => {
      let base = "#m:" + (munchkinId || "");
      base += "#f:" + (formId || "");
      if (programId) {
        base += "#p:" + programId;
      }
      base += "#t:" + Date.now();
      return cleanUniqueId(base);
    };
    const consentGranted =
      typeof mkto_checkAdobePrivacy === "function" ? mkto_checkAdobePrivacy() : true;
    let baseUniqueId;
    if (bypass) {
      baseUniqueId = buildBaseUniqueId();
    } else {
      baseUniqueId = profile.unique_id_b;
      if (!baseUniqueId) {
        baseUniqueId = buildBaseUniqueId();
        profile.unique_id_b = baseUniqueId;
      }
    }
    if (consentGranted) {
      const cookieSuffix = mkto_checkCookie(true) || "";
      const cookieIndicator = cookieSuffix || mkto_checkCookie(false) || "";
      profile.activeCookie = cookieIndicator !== "";
      let personalUniqueId = baseUniqueId;
      if (leadId) {
        personalUniqueId += "#l:" + leadId;
      }
      if (cookieSuffix) {
        personalUniqueId += cookieSuffix;
      }
      personalUniqueId = cleanUniqueId(personalUniqueId);
      if (!bypass) {
        profile.unique_id_a = personalUniqueId;
        profile.unique_id = personalUniqueId;
      }
      return personalUniqueId;
    } else {
      profile.activeCookie = false;
      if (!bypass) {
        profile.unique_id = baseUniqueId;
        if (!profile.unique_id_b) {
          profile.unique_id_b = baseUniqueId;
        }
      }
      return baseUniqueId;
    }
  };

  window.mkto_applyRuleToFields = function (ruleFields, fields, fieldName = "") {
    if (!fields) {
      return;
    }
    let matches_Y = "";
    let matches_N = "";
    Object.entries(ruleFields).forEach(function (entry) {
      var key = entry[0];
      var ruleArray = entry[1];
      var ruleValue = ruleArray[0].split(":")[0];
      let thisV = " - '" + key + "' is set as '" + fields[key] + "', Rule is '" + ruleValue + "'";
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
    return matches_Y + matches_N;
  };

  window.mkto_print_DL = function (json) {
    var group_label = "Form Setup | Primary DataLayer";
    mkf_c.group(group_label);

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
        mkf_c.group("Form Setup | " + (nodeName ? `${nodeName}` : "Configuration"));
      } else {
        mkf_c.groupCollapsed("Form Setup | " + (nodeName ? `${nodeName}` : "Configuration"));
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
  };

  window.mkto_checkAdobeIMS = async function () {
    try {
      const profile =
        window.mcz_marketoForm_pref.profile || (window.mcz_marketoForm_pref.profile = {});
      let currentIMSProfile = profile.ims_profile || {};
      const firstNameCached = currentIMSProfile?.first_name || "";
      if (firstNameCached !== "") {
        return true;
      }

      const ims = window?.adobeIMS;
      const hasIsSignedIn = typeof ims?.isSignedInUser === "function";
      if (!hasIsSignedIn) {
        mkf_c.info("IMS isSignedInUser is not ready");
        return false;
      }

      if (ims.isSignedInUser() !== true) {
        mkf_c.info("Not signed in to Adobe IMS");
        return false;
      }

      if (typeof ims.getProfile !== "function") {
        mkf_c.info("adobeIMS.getProfile is not available");
        return false;
      }

      try {
        currentIMSProfile = (await ims.getProfile()) || {};
      } catch (error) {
        mkf_c.warn("Unable to retrieve Adobe IMS profile", error);
        return false;
      }

      const firstName = currentIMSProfile?.first_name || "";
      if (firstName === "") {
        mkf_c.info("Adobe IMS profile missing first name");
        return false;
      }

      window.mcz_marketoForm_pref.profile.ims_profile = currentIMSProfile;

      const verifiedValue = currentIMSProfile?.emailVerified;
      const isEmailVerified =
        verifiedValue === true ||
        verifiedValue === "true" ||
        (typeof verifiedValue === "string" && verifiedValue.toLowerCase() === "true");
      if (!isEmailVerified) {
        mkf_c.info("Adobe IMS profile email is not verified.");
        return false;
      }

      const email = currentIMSProfile?.email || "";
      if (email === "") {
        mkf_c.info("Adobe IMS profile missing email.");
        return false;
      }

      const currentPrefill = window.mktoPreFillFields || (window.mktoPreFillFields = {});
      const verifiedFields = [];
      const assignIfEmpty = (field, value) => {
        if (!value) {
          return;
        }
        const existing = currentPrefill?.[field];
        if (!existing || existing.length === 0) {
          currentPrefill[field] = value;
          verifiedFields.push(field);
        }
      };

      assignIfEmpty("FirstName", currentIMSProfile?.first_name || "");
      assignIfEmpty("LastName", currentIMSProfile?.last_name || "");
      assignIfEmpty("Email", email);
      assignIfEmpty("Country", currentIMSProfile?.countryCode || "");
      assignIfEmpty("Phone", currentIMSProfile?.phoneNumber || "");

      if (verifiedFields.length > 0) {
        mkf_c.info("Prefilled fields from Adobe IMS: " + verifiedFields.join(", "));
      }

      window.mktoPreFillFields = currentPrefill;
      return true;
    } catch (error) {
      mkf_c.error("mkto_checkAdobeIMS encountered an error", error);
      return false;
    }
  };

  window.mkto_checkTemplate = function (src = "DataLayer") {
    let templateLog = "";
    let enforceRules = true;
    function aTLg(log) {
      if (log === undefined || log === null) {
        return;
      }
      if (log == "---") {
        templateLog += "-----------------------------------\n";
        return;
      }
      templateLog += log + "\n";
    }

    if (src === "PP") {
      src = "Progressive Controller";
    } else {
      src = "DataLayer";
    }

    let groupLBL = "Form Setup | Template Processing";
    mkf_c.group(groupLBL);

    const mczPrefs = window.mcz_marketoForm_pref;
    if (!mczPrefs) {
      mkf_c.warn("DL not defined.");
      mkf_c.groupEnd(groupLBL);
      return;
    }
    if (!mczPrefs.form) {
      mkf_c.warn("form not defined.");
      mkf_c.groupEnd(groupLBL);
      return;
    }
    if (!mczPrefs.form.template) {
      mkf_c.warn("form.template not defined.");
      mkf_c.groupEnd(groupLBL);
      return;
    }

    let programId = mczPrefs.program.id || "";
    let programIdSetBy = "";

    let templateTemp = mczPrefs.form.template || "";
    let templateSetBy = "";

    if (templateTemp.trim().length > 0) {
      templateSetBy = "DataLayer";
    }

    if (programId.trim().length > 0) {
      programIdSetBy = "DataLayer";
    }

    if (templateTemp.indexOf("flex") > -1) {
      enforceRules = false;
      aTLg("\nThis is a Flex Template, rules will be relaxed.");
    }

    if (!mczPrefs?.flags?.templateSetByQS && mktoFrmParams.get("template") && src === "DataLayer") {
      let templateQS = mktoFrmParams.get("template");
      templateQS = templateQS.trim();
      templateQS = templateQS.substring(0, 32);
      if (templateQS.length > 0) {
        templateTemp = templateQS;
        mczPrefs.flags = mczPrefs.flags || {};
        mczPrefs.flags.templateSetByQS = true;
        templateSetBy = "Query String";
        enforceRules = true;
        aTLg(
          `\nTemplate rules will be enforced because it was set by: Query String from ${src}.\n`
        );
        aTLg("---");
      }
    }

    let prefill;
    let prefillSetBy = "";
    if (
      !mczPrefs?.flags?.prefillSetByDataLayer &&
      window.mktoPreFillFields &&
      Object.keys(window.mktoPreFillFields).length > 0 &&
      prefillSetBy === ""
    ) {
      mczPrefs.flags = mczPrefs.flags || {};
      mczPrefs.flags.prefillSetByDataLayer = true;
      prefill = window.mktoPreFillFields;
      prefillSetBy = "Window";
    }
    if (
      !mczPrefs?.flags?.prefillSetBySS &&
      sessionStorage.getItem("mktoPreFillFields") &&
      prefillSetBy === ""
    ) {
      try {
        let mktoPreFillFieldsSS = sessionStorage.getItem("mktoPreFillFields") || "";
        if (mktoPreFillFieldsSS !== "") {
          mktoPreFillFieldsSS = JSON.parse(mktoPreFillFieldsSS);
          mczPrefs.flags = mczPrefs.flags || {};
          mczPrefs.flags.prefillSetBySS = true;
          prefill = mktoPreFillFieldsSS;
          prefillSetBy = "Session Storage";
        }
      } catch (e) {
        mkf_c.warn("Error parsing mktoPreFillFields", e);
      }
    }
    if (
      !mczPrefs?.flags?.prefillSetByProfile &&
      mczPrefs?.profile?.prefill &&
      Object.keys(mczPrefs?.profile?.prefill).length > 0 &&
      prefillSetBy === ""
    ) {
      mczPrefs.flags = mczPrefs.flags || {};
      mczPrefs.flags.prefillSetByProfile = true;
      prefill = mczPrefs?.profile?.prefill || {};
      prefillSetBy = "Profile";
    }
    if (prefillSetBy !== "") {
      window.mktoPreFillFields = prefill;
      mczPrefs.profile.prefill = prefill;
      mkf_c.log(`Prefill Set By: ${prefillSetBy}.`);
    }

    const templates = window?.templateRules;

    let templateName = mczPrefs?.form?.template || "";
    if (templateTemp !== templateName) {
      templateName = templateTemp;
      templateSetBy = "DataLayer";
      aTLg(`\nTemplate: "${templateName}" was set by: ${templateSetBy} from ${src}.\n`);
      aTLg("---");
    }

    if (!templateName || !Array.isArray(templates)) {
      mkf_c.log("Template not found.");
      mkf_c.groupEnd(groupLBL);
      return;
    }

    const templateRule = templates.find((template) => template.hasOwnProperty(templateName));
    if (!templateRule) {
      mkf_c.log(`Template no rule: '${templateName}'`);
      mkf_c.groupEnd(groupLBL);
      return;
    }

    const rule = templateRule[templateName];
    if (!rule) {
      mkf_c.log(`Template has no rules: '${templateName}'`);
      mkf_c.groupEnd(groupLBL);
      return;
    }

    //check the rule has a parameter called program_id
    if (!rule?.hasOwnProperty("program_id")) {
      mkf_c.warn(
        "Template rule has no program_id parameter, check the template rule is correct.",
        JSON.stringify(rule, null, 2)
      );
      mkf_c.groupEnd(groupLBL);
      return;
    }

    mczPrefs.form.template = templateName;
    aTLg(`\nTemplate: "${templateName}" was set by: ${templateSetBy} from ${src}.\n`);
    aTLg("---");

    //Program ID
    if (!mczPrefs?.flags?.programIdSetByTemplate && src === "DataLayer") {
      let programIdTemp = rule?.program_id || "";
      if (programIdTemp && programIdTemp?.length > 0) {
        programIdTemp = programIdTemp.replace(/[^0-9]/g, "");
        programIdTemp = programIdTemp.substring(0, 10);
        if (programIdTemp.length > 0) {
          programId = programIdTemp;
          programIdSetBy = "Template";
          mczPrefs.flags = mczPrefs.flags || {};
          mczPrefs.flags.programIdSetByTemplate = true;
          aTLg("---");
        }
      }
    }
    if (!mczPrefs?.flags?.programIdSetByQS && src === "DataLayer") {
      let programIdQS = mktoFrmParams.get("mktfrm_pid") || "";
      programIdQS = programIdQS.replace(/[^0-9]/g, "");
      programIdQS = programIdQS.substring(0, 10);
      if (programIdQS.length > 0) {
        programId = programIdQS;
        mczPrefs.flags = mczPrefs.flags || {};
        mczPrefs.flags.programIdSetByQS = true;
        programIdSetBy = "Query String";
      }
    }
    if (programId.length > 0) {
      mczPrefs.form.programId = programId;
      mczPrefs.program.id = programId;
      mczPrefs.program.event = mczPrefs.program.event || {};
      mczPrefs.program.event.id = programId;

      aTLg(`\nProgram ID: "${programId}" was set by: ${programIdSetBy} from ${src}.\n`);
      aTLg("---");
    }

    //Template Processing Rules
    if (enforceRules === false) {
      aTLg(`\nTemplate Rules are not enforced from "${src}".`);
      // Flex templates: author field visibility wins; the template default only
      // fills fields the author left unset. (MWPW-198019)
      if (rule.field_visibility) {
        const authored = mczPrefs.field_visibility || {};
        Object.keys(rule.field_visibility).forEach((key) => {
          const templateDefault = rule.field_visibility[key][0].split(":")[0];
          mczPrefs.form.field_visibility[key] =
            authored[key] && authored[key] !== "" ? authored[key] : templateDefault;
        });
        aTLg("Flex: author field visibility applied; template defaults fill gaps.");
      }
 if (rule.field_filters) {
        mczPrefs.form.field_filters = mczPrefs.form.field_filters || {};
        const authored = mczPrefs.field_filters || {};
        Object.keys(rule.field_filters).forEach((key) => {
          const templateDefault = rule.field_filters[key][0].split(":")[0];
          mczPrefs.form.field_filters[key] =
            authored[key] && authored[key] !== "" ? authored[key] : templateDefault;
        });
        aTLg("Flex: author field filters applied; template defaults fill gaps.");
      }
      aTLg("---");
    } else {
      aTLg(`\nTemplate Processing Rules Enforced from "${src}".`);
      if (rule.field_visibility) {
        aTLg("\nVisibility Rules");
        let matches = window.mkto_applyRuleToFields(
          rule.field_visibility,
          mczPrefs.form.field_visibility,
          "field_visibility"
        );
        aTLg(matches);
      }
      if (rule.field_filters) {
        aTLg("\nField DropDown Filters");
        let matches = window.mkto_applyRuleToFields(
          rule.field_filters,
          mczPrefs.form.field_filters,
          "field_filters"
        );
        aTLg(matches);
      }
      if (rule?.progressive && (rule?.progressive === true || rule?.progressive === "true")) {
        aTLg("Progressive Controller is enabled");
        mczPrefs.form.progressive = true;
      }
      if (rule?.multi_step && (rule?.multi_step === true || rule?.multi_step === "true")) {
        aTLg("Multi-Step is enabled");
        mczPrefs.form.multi_step = true;
      }
      if (rule?.polling && (rule?.polling === true || rule?.polling === "true")) {
        aTLg("Event Polling is enabled");
        mczPrefs.form.polling = true;
      }
      if (rule?.autoSuccess && (rule?.autoSuccess === true || rule?.autoSuccess === "true")) {
        aTLg("Auto Success is enabled");
        mczPrefs.form.autoSuccess = true;
        mczPrefs.form.autoSuccessTimeFrameDays = rule?.autoSuccessTimeFrameDays || 30;
      }
      if (rule?.known_visitor && (rule?.known_visitor === true || rule?.known_visitor === "true")) {
        aTLg("Prefill is enabled");
        mczPrefs.form.known_visitor = true;
      }
    }

    //Template Versioning Rules
    if (mczPrefs.form.templateVersions) {
      if (mczPrefs.form.templateVersions.hasOwnProperty(mczPrefs.form.template)) {
        let originalTemplateVersion = mczPrefs.form.template;
        mczPrefs.form.template = mczPrefs.form.templateVersions[mczPrefs.form.template];
        if (originalTemplateVersion != mczPrefs.form.template) {
          //allows to convert legacy templates to updated templates
          aTLg(
            `For template version "${originalTemplateVersion}" Marketo will receive the template value "${mczPrefs.form.template}".`
          );
        }
      }
    }

    if (mczPrefs.form.subtypeTemplate) {
      if (mczPrefs.form.subtypeTemplate.hasOwnProperty(mczPrefs.form.template)) {
        let originalSubtype = mczPrefs.form.subtype;
        mczPrefs.form.subtype = mczPrefs.form.subtypeTemplate[mczPrefs.form.template];
        if (originalSubtype != mczPrefs.form.subtype) {
          aTLg(`Subtype "${originalSubtype}" changed to "${mczPrefs.form.subtype}".`);
        }
      }
    }
    aTLg("---");
    let poi = mczPrefs?.program?.poi || "";
    let poiHide = mczPrefs?.program?.hidePoi || "";
    let poiSetBy = "";

    if (poi.length > 2) {
      poiSetBy = "DataLayer";
      aTLg(`POI: "${poi}", Set By: ${poiSetBy}.`);
    }

    let poiQS = mktoFrmParams.get("mktfrm_poi") || "";
    if (poiQS && !mczPrefs?.flags?.poiSetByQS && poiSetBy === "DataLayer") {
      if (poiQS.length > 2) {
        mczPrefs.flags = mczPrefs.flags || {};
        mczPrefs.flags.poiSetByQS = true;
        poiSetBy = "Query String";
        poi = poiQS;
        poiHide = "true";
        aTLg(`POI Query String: "${poiQS}", Set By: ${poiSetBy}.`);
      }
    }

    const hash = window.location.hash;
    if (
      hash &&
      hash.includes("#poi") &&
      !mczPrefs?.flags?.poiSetByQSHash &&
      poiSetBy === "DataLayer"
    ) {
      let poiHash = hash.replace("#poi", "");
      poiHash = poiHash.trim();
      if (poiHash.length > 0) {
        mczPrefs.flags = mczPrefs.flags || {};
        mczPrefs.flags.poiSetByQSHash = true;
        poi = poiHash;
        poiSetBy = "Query String Hash";
        poiHide = "true";
        aTLg(`POI Query String Hash: "${poiHash}", Set By: ${poiSetBy}.`);
      }
    }

    if (poi.length > 2) {
      poi = poi
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+$/, "")
        .toUpperCase();

      mczPrefs.program.poi = poi;
      aTLg(`POI: "${poi}", Set By: ${poiSetBy}.`);

      if (
        poiHide?.toLowerCase().trim() === "true" ||
        mczPrefs?.flags?.poiSetByQSHash === true ||
        mczPrefs?.flags?.poiSetByQS === true ||
        !mczPrefs.field_filters?.products
      ) {
        mczPrefs.field_filters = mczPrefs.field_filters || {};
        mczPrefs.field_filters.products = "hidden";
        aTLg(`POI Hide: "true", Products Hidden by POI. Set By: ${poiSetBy}.`);
      }
    }

    aTLg("Subtypes Verbs");
    aTLg("---");
    aTLg(JSON.stringify(mczPrefs.form.subtypeRules, null, 2));
    aTLg("\nSubtypes Enforced:");
    aTLg(JSON.stringify(mczPrefs.form.subtypeTemplate, null, 2));

    aTLg("---");
    mkf_c.log(templateLog);
    mkf_c.groupEnd(groupLBL);
  };

  window.mkto_addCSS = async function (mktoForm) {
    if (!mktoForm.classList.contains("mktoForm--styles-added")) {
      const baseCss = `
      .starting_fieldset fieldset{
          opacity: 0;
          visibility: hidden;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      form.mktoForm {
          display: none;
      }
      form.mktoForm.mktoForm--fade-in {
          display: block;
      }
      .mktoForm--fade-in fieldset{
          opacity: 1;
          visibility: visible;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      .mktoHidden,
      .mktoFormRow .mktoClear,
      .mktoFormRow .mktoError,
      .mktoFormRow .mktoInstruction,
      .mktoFormRow .mktoOffset,
      .mktoFormRow .mktoOffset,
      .mktoFormRow legend,
      .mktoFormRow label:empty {
          display: none !important;
      }
      .mktoForm #db_data_container{
          display: none !important;
      }
      .mktoFormRow > fieldset > 
      .mktoFormRow > .mktoPlaceholder:empty{
          display: none;
      }
      .mktoFormRow fieldset { 
          padding: 0
      }
      .mktoFormRow {
          height: auto;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      form.mktoForm--fade-in {
          visibility: hidden;
          opacity: 0;
      }
      form.mktoForm--fade-in.mktoVisible {
          visibility: visible;
          opacity: 1;
          height: auto;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      .mktoForm--fade-in .mktoFieldDescriptor {
          visibility: hidden;
          opacity: 0;
          height: 0;
      }
      .mktoForm--fade-in .mktoFieldDescriptor.mktoVisible:not([style]) {
          visibility: visible;
          opacity: 1;
          height: auto;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }            
      div[data-mktofield="mktoQuestionComments"] fieldset {
          width: 100% !important;
      }
      .mktoForm-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1;
          display: block;
          text-align: center;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      .ty-message {
          padding: 20px;
          opacity: 0; /* on submit */
          visibility: hidden; /* on submit */
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      .mktoNotYou{
          cursor: pointer;
      }    
      .mktoForm--fade-in fieldset.mktoFormCol {
          display: none;
      }
      .mktoForm--fade-in fieldset.mktoFormCol.mktoVisible {
          display: block;
      }
      .mktoForm--fade-in .mktoHtmlText[style] {
          opacity: 0;
          visibility: hidden;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }
      .mktoForm--fade-in .mktoHtmlText:not([style]) {
          opacity: 1;
          visibility: visible;
          -webkit-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          -moz-transition: opacity 0.1s ease-in, height 0.1s ease-in;
          transition: opacity 0.1s ease-in, height 0.1s ease-in;
      }   

      form.mktoForm {
          max-height: 0;
          overflow: hidden;
          -webkit-transition: max-height 1s ease-in;
          -moz-transition: max-height 1s ease-in;
          transition: max-height 1s ease-in;
      }
      .mktoForm--fade-in .mktoPrefill {
          color: transparent;
          transition: color 0.3s ease-in;
          -webkit-transition: color 0.3s ease-in;
          -moz-transition: color 0.3s ease-in;
      }
      .mktoForm--fade-in .mktoPrefill.mktoPrefilled {
            color: inherit;

      }
          
      form.mktoForm.mktoVisible {
          max-height: 10000px;
          overflow: visible;
      }
      `;

      let head = document.head || document.getElementsByTagName("head")[0];
      let style = document.createElement("style");
      head.appendChild(style);
      style.appendChild(document.createTextNode(baseCss));

      mktoForm.classList.add("mktoForm--styles-added");
    }
  };
}

// ##
// ##

//# sourceURL=global.js
