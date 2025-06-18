// <![CDATA[
// ##
// ## Updated 20230919T211600
// ##
// ########################################################
// ########################################################
// ##
// ##
// ##  Marketo Form Setup
// ##
// ##  This is the default data layer that will be used
// ##  if the data layer is not found or is incomplete
// ##
// ##
if (typeof mkto_buildForm != "function") {
  console.log("Marketo Form Setup - Loaded");
  window.mcz_marketoForm_pref_exmaple = window.mcz_marketoForm_pref_exmaple || [];
  window.mcz_marketoForm_pref_exmaple = {
    profile: {
      //Profile Settings
      prefLanguage: "", //Preferred Language from browser
      segLangCode: "", //Markto Segmentation Language
      known_visitor: false, //X,A,B,C - known visitor level
    },
    form: {
      //form settings
      type: "marketo_form", //This is a Marketo Form default value
      subtype: "webinar", //see subtypeRules for examples
      success: {
        //success handling
        type: "", //redirect, msg, none
        content: "", //redirect url, message, none
        delay: 5000, //delay in ms to wait for Marketo before fallback redirect
        confirm: false, //true,false - form is is ready for redirect
      },
      subtypeRules: {
        seminar: "register", // Online/Live Events
        nurture: "submit", // Nurturing Leads
        whitepaper_form: "download", // Whitepaper Download
        webinar: "register",
        strategy_webinar: "register", // Strategy Webinar
        demo: "submit",
        trial_download: "download", // Trial Download
        request_for_information: "submit", // Request for Information
        quote: "submit", // Quotation Request
        event_registration: "register", // Event Registration
        event_attendance: "register", // Event Activities
      },
      version: "23.9.19a",
    },
    program: {
      //Marketo Program Settings
      additional_form_id: "", //Additional Form ID to pull values from
      poi: "", //MARKETOENGAGEMENTPLATFORM - hardcoded product poi will be hidden
      copartnernames: "", //Partner1, Partner2
      campaignids: {
        //Campaign IDs
        sfdc: "", //Salesforce Campaign ID
        external: "", //External Campaign ID
        retouch: "", //Retouch Campaign ID
        onsite: "", //Onsite Campaign ID
        cgen: "", //CGEN ID
        cuid: "", //CUID ID
      },
      content: {
        //Content Definition
        type: "", //pdf, video, audio, none
        content_id: "", //pdf id, video id, none
      },
    },
    field_visibility: {
      //These fields will be hidden or visible
      name: "required", //visible, required
      company: "hidden", //visible, hidden, required
      phone: "hidden", //visible, hidden, required
      comments: "hidden", //visible, hidden
      demo: "hidden", //visible, hidden,
      state: "hidden", //visible, hidden, required
      postcode: "hidden", //visible, hidden, required
      company_size: "hidden", //visible, hidden, required
      website: "hidden", //visible, hidden, required
    },
    field_filters: {
      //filter terms used to display or hide field options
      products: "POI-Dxonly", //POI-Dxonly, hidden, all
      job_role: "", //Job Role-HiLevel, hidden, all
      industry: "", //Industry-Manufacturing, hidden, all
      functional_area: "", //Functional Area-DX, hidden, all
    },
    value_setup: {
      field_mapping: {
        //field_visibility to Marketo Form Field Names
        name: "FirstName",
        company: "mktoFormsCompany",
        comments: "mktoQuestionComments",
        demo: "mktoRequestProductDemo",
        phone: "Phone",
        state: "State",
        postcode: "PostalCode",
        company_size: "mktoDemandbaseEmployeeRange",
        website: "mktodemandbaseWebsite",
      },
      field_mapping_dl: {
        //Marketo Form Field Names to Data Layer positions
        mktoFormsPrimaryProductInterest: "program.poi",
        mktoCoPartnerName: "program.copartnernames",
        mktoProductionCampaignId: "program.campaignids.sfdc",
        mktoExternalCampaignId: "program.campaignids.external",
        mktoRetouchCampaignId: "program.campaignids.retouch",
        mktoOnsiteCampaignId: "program.campaignids.onsite",
        sessionCGEN: "program.campaignids.cgen",
      },
      field_dependance: {
        //fields connected to other fields
        state: "Country",
        postcode: "Country",
      },
    },
  };
  // ##
  // ##
  // ##
  // ##
  // ##
  // ##
  // ##
  // ##

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
  if (typeof mcz_marketoForm_pref != "object") {
    console.log("Marketo Form DataLayer - Not Found, using default values");
    window.mcz_marketoForm_pref = window.mcz_marketoForm_pref || [];
    window.mcz_marketoForm_pref = window.mcz_marketoForm_pref_exmaple;
  } else {
    console.log("mcz_marketoForm_pref is defined, check quality");

    checkAndAddProperties(window.mcz_marketoForm_pref, window.mcz_marketoForm_pref_exmaple, false);
  }

  if (window.location.href.indexOf("mkto_test") > -1) {
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("mkto_test") == "active") {
      if (localStorage.getItem("mkto_test_dl")) {
        if (localStorage.getItem("mkto_test") != "active") {
          localStorage.setItem("mkto_test", "active");
        }
        console.log("Marketo Form DataLayer - Test Data Layer Found");
        try {
          mcz_marketoForm_pref_test = JSON.parse(localStorage.getItem("mkto_test_dl"));
          console.log("current data layer", window.mcz_marketoForm_pref);
          console.log("test data layer", mcz_marketoForm_pref_test);
          checkAndAddProperties(window.mcz_marketoForm_pref, mcz_marketoForm_pref_test, true);
        } catch (error) {
          console.log("ERROR: unable to parse test data layer");
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
        console.log("Testing is active, redirecting to test version");
        let url = new URL(window.location.href);
        url.searchParams.set("mkto_test", "active");
        window.location.href = url.href;
      }
    }
  }

  let mktoForm = document.querySelector(".mktoForm");
  mktoForm.setAttribute("style", "opacity:0");
  mktoForm.classList.add("starting_fieldset");
  function getMktoFormID() {
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
        window.mcz_marketoForm_pref.form.id = formId;
        return formId;
      } else {
        console.log("ERROR: unable to get form ID");
        window.mcz_marketoForm_pref.form.id = null;
        return null;
      }
    } else {
      console.log("ERROR: no Marketo form found");
      window.mcz_marketoForm_pref.form.id = null;
      return null;
    }
  }

  var unique_id = "";
  var activeCookie = false;
  function getUniqueID(formValues, bypass) {
    let unique_id_temp = "";
    if (bypass == undefined) {
      bypass = false;
    }

    if (bypass == false && unique_id != "") {
      if (unique_id.indexOf("v:") > -1) {
        return unique_id;
        //
        //
      } else {
        let checkNew = getUniqueID(formValues, true);
        if (checkNew.indexOf("v:") > -1) {
          unique_id = checkNew;
          return checkNew;
          //
          //
        } else {
          return unique_id;
          //
          //
        }
      }
    }
    if (activeCookie == true && unique_id != "" && bypass !== true) {
      //check that marketo cookie is still active
      if (
        document.cookie.match(/_mkto_trk=([^;]+)/) &&
        document.cookie.match(/_mkto_trk=([^;]+)/)[1]
      ) {
        activeCookie = true;
      } else {
        unique_id_temp = "";
        if (
          typeof window.adobePrivacy != "undefined" &&
          typeof window.adobePrivacy.hasUserProvidedConsent == "function" &&
          window.adobePrivacy.hasUserProvidedConsent()
        ) {
          activeCookie = true;
        } else {
          activeCookie = false;
        }
      }
    }
    if (
      typeof window.adobePrivacy != "undefined" &&
      typeof window.adobePrivacy.hasUserProvidedConsent == "function"
    ) {
      if (window.adobePrivacy.hasUserProvidedConsent()) {
        activeCookie = true;
      } else {
        activeCookie = false;
      }
    } else {
      if (
        document.cookie.match(/_mkto_trk=([^;]+)/) &&
        document.cookie.match(/_mkto_trk=([^;]+)/)[1]
      ) {
        activeCookie = true;
      }
    }
    let munchkinId = "";
    if (formValues && formValues.munchkinId) {
      munchkinId = formValues.munchkinId;
    } else {
      let munchkinIdField = document.querySelector("input[name='munchkinId']");
      if (munchkinIdField) {
        munchkinId = munchkinIdField.value;
      }
    }
    unique_id_temp = document.cookie.match(/_mkto_trk=([^;]+)/)
      ? document.cookie.match(/_mkto_trk=([^;]+)/)[1]
      : "id:" + munchkinId;
    unique_id_temp += "&fid:" + formValues.formid;
    unique_id_temp += "&t:" + new Date().getTime();

    //new cleanup
    unique_id_temp.replace(/id:(\d+-\w+-\d+)/, "m:$1");
    unique_id_temp = unique_id_temp.replace(/token:.+-(\d\d\d+)-(\d\d\d+)/, "c:$1&v:$2");
    unique_id_temp = unique_id_temp.replace(/fid:(\d+)/, "f:$1");
    unique_id_temp = "#" + unique_id_temp.replace(/&/g, "#");

    if (bypass == true) {
      return unique_id_temp;
    } else {
      unique_id = unique_id_temp;
      return unique_id;
    }
  }

  const mktoPerformanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      let loadTimeRounded = Math.round(entry.duration);
      let currentTimeBucket = Math.round(loadTimeRounded / 500) * 500;
      if (entry.name === "MarketoFormVisible" && entry.entryType === "measure") {
        if (
          mcz_marketoForm_pref?.performance?.loadTime == null ||
          mcz_marketoForm_pref?.performance?.loadTime === undefined
        ) {
          mcz_marketoForm_pref.performance = {
            loadTime: loadTimeRounded,
            loadTimeBucket: currentTimeBucket,
            currentTime: loadTimeRounded,
            currentTimeBucket: currentTimeBucket,
          };
        }
        mkto_buildForm();
      }
    }
  });

  function isTestRecord() {
    let testRecord = "not_test";
    let email_fld = document.querySelector('.mktoForm[id] [name="Email"]');
    if (email_fld) {
      if (email_fld.value.includes("@adobetest.com")) {
        testRecord = "test_submit";
      }
      if (email_fld.value.includes("privacytest")) {
        testRecord = "test_no_submit";
      }
    }
    if (/https:\/\/app-[a-zA-Z0-9]+\.marketo\.com/.test("" + window.location.href)) {
      testRecord = "test_no_submit";
    }
    if (window?.mcz_marketoForm_pref?.profile !== undefined) {
      if (testRecord == "not_test") {
        window.mcz_marketoForm_pref.profile.testing = false;
      } else {
        window.mcz_marketoForm_pref.profile.testing = true;
      }
    }
    return testRecord;
  }

  var mkto_formsLoaded = {};
  function mkto_buildForm() {
    let formId = getMktoFormID();
    if (mkto_formsLoaded[formId] == undefined) {
      mkto_formsLoaded[formId] = true;
    } else if (mkto_formsLoaded[formId] == true) {
      console.log("Form [" + formId + "] already loaded");
      return;
    }

    //################################################
    //##
    //## Console read out
    //##
    var group_label = "Marketo Form Setup";
    console.group(group_label);
    function print_niceDL(json) {
      const friendlyNames = {
        field_visibility: "Field Visibility Preferences",
        field_filters: "Select Field Value Filters",
        subtypeRules: "Form Type Submit Verbs",
        profile: "Visitor Preferences",
        form: "Form Type & Version",
        subType: "Form Type",
        type: "Application",
        program: "Marketo Program Settings",
        campaignids: "Campaign IDs",
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
        if (depth === 0 || nodeName == "Form Type & Version") {
          console.group(nodeName ? `${nodeName}` : "Marketo Form Setup");
        } else {
          console.groupCollapsed(nodeName ? `${nodeName}` : "Marketo Form Setup");
        }
        let simpleKeys = Object.keys(node).filter(
          (key) => !(typeof node[key] === "object" && node[key] !== null)
        );
        let maxKeyLength = Math.max(...simpleKeys.map((key) => key.length));
        for (let key of simpleKeys) {
          let value = node[key];
          let adjustedKey = key + " ".repeat(maxKeyLength - key.length);
          console.log(`${adjustedKey} : ${value}`);
        }
        for (let key in node) {
          let value = node[key];
          if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
            logNode(value, key, depth + 1); // Increase the depth as we go deeper
          }
        }
        console.groupEnd();
      }
      function logJson(json) {
        logNode(json);
      }
      logJson(json);
    }
    print_niceDL(mcz_marketoForm_pref);

    isTestRecord();

    console.log(
      `%cForm load time: ${window?.mcz_marketoForm_pref?.performance?.loadTime}ms, bucket: ${window?.mcz_marketoForm_pref?.performance?.loadTimeBucket}ms`,
      "font-size: 1.2em; color: purple; font-weight: bold; "
    );
    if (typeof aaInteraction === "function") {
      aaInteraction("Marketo Form View", "formView", formId, null);
      aaInteraction(
        `Marketo Form Ready - ${window?.mcz_marketoForm_pref?.performance?.loadTimeBucket}ms`,
        "formPerformance",
        formId,
        null
      );
    }

    MktoForms2.getForm(formId).onValidate(function (valid) {
      let formId = getMktoFormID();
      let form = MktoForms2.getForm(formId);
      let formData = form.getValues();
      let unique_id = getUniqueID(formData);
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
          if (formData.hasOwnProperty(fieldName)) {
            requiredFieldsData[fieldName] = formData[fieldName];
          }
        }
      }
      for (let key in formData) {
        if (formData.hasOwnProperty(key)) {
          let review = "" + formData[key];
          review = review.trim();
          if (review.indexOf("{{my.") > -1) {
            form.setValues({
              [key]: "",
            });
          }
          if (requiredFieldsData.hasOwnProperty(key)) {
            if (review == "") {
              requiredFieldsFilled = false;
            }
          }
        }
      }

      if (requiredFieldsFilled) {
        valid = true;
      }

      function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(window.location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
      }

      var params = ["trackingid", "prid", "promoid", "sdid", "pss", "campaignid"];
      var mktoTreatmentId = null;
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        if (getParameterByName(param)) {
          mktoTreatmentId = getParameterByName(param);
          break;
        }
      }
      if (mktoTreatmentId == null) {
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          const match = RegExp(`(?:^|;)\s*${param}=([^;]+?)(?:;|$)`).exec(document.cookie);
          if (match && match[1]) {
            mktoTreatmentId = match[1];
            break;
          }
        }
      }
      if (mktoTreatmentId) {
        console.log("Treatment ID: " + mktoTreatmentId);
        if (document.querySelector(`[name="mktoTreatmentId"]`)) {
          form.setValues({
            mktoTreatmentId: mcid,
          });
        } else {
          form.addHiddenFields({ mktoTreatmentId: mktoTreatmentId });
        }
      }

      var gclid = getParameterByName("gclid");
      if (gclid) {
        console.log("Google Click ID: " + gclid);
        if (window?.mcz_marketoForm_pref?.program?.campaignids !== undefined) {
          window.mcz_marketoForm_pref.program.campaignids.gclid = gclid;
        }
        form.addHiddenFields({
          mktoGoogleClickId: gclid,
        });
      }

      const mapping = {
        sfdc: {
          field: "mktoProductionCampaignId",
          status: "internal_Prod_Camp_Status",
          queryParam: "s_iid",
        },
        external: {
          field: "mktoExternalCampaignId",
          status: "External_Camp_Status",
          queryParam: "s_cid",
        },
        retouch: {
          field: "mktoRetouchCampaignId",
          status: "Retouch_Camp_Status",
          queryParam: "s_rtid",
        },
        onsite: {
          field: "mktoOnsiteCampaignId",
          status: "Onsite_Camp_Status",
          queryParam: "s_osc",
        },
      };

      const keys = Object.keys(mapping);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        let value;
        if (window.mcz_marketoForm_pref?.program?.campaignids?.hasOwnProperty(key)) {
          if (window.mcz_marketoForm_pref?.program?.campaignids[key] != "") {
            value = window.mcz_marketoForm_pref?.program?.campaignids[key];
          }
        } else {
          let valcheck = getParameterByName(mapping[key].queryParam);
          if (valcheck != "") {
            value = valcheck;
            //save this to a cookie for 30 days
          }
        }

        if (value) {
          if (document.querySelector(`[name="${mapping[key].field}"]`)) {
            form.setValues({
              [mapping[key].field]: value,
            });
            form.addHiddenFields({
              [mapping[key].status]: "Responded",
            });
          } else {
            form.addHiddenFields({
              [mapping[key].field]: value,
              [mapping[key].status]: "Responded",
            });
          }
        }
      }

      if (window.mcz_marketoForm_pref?.profile?.privacy_optin !== undefined) {
        if (window.mcz_marketoForm_pref?.profile?.privacy_optin == true) {
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
      if (document.querySelector(`[name="mktokoreaEmailOptin"]`)) {
        if (document.querySelector(`[name="mktokoreaEmailOptin"]`).offsetParent !== null) {
          if (document.querySelector(`[name="mktokoreaEmailOptin"]`).checked) {
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

      if (document.querySelector(`[name="mktokoreaPhoneOptin"]`)) {
        if (document.querySelector(`[name="mktokoreaPhoneOptin"]`).offsetParent !== null) {
          if (document.querySelector(`[name="mktokoreaPhoneOptin"]`).checked) {
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

      //need to set this rather than use the checkbox value
      let mktoCoPartnerPermissionValue = document.querySelector(
        '.mktoFormRow [name="mktoCoPartnerPermissionValue"]'
      );
      //capture the consent notice and pop it in mktoConsentNotice as hidden field.
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

      if (mcz_marketoForm_pref?.profile?.known_visitor == true) {
        form.addHiddenFields({
          mktoOKtoMail: "U",
          mktoOKtoEmail: "U",
          mktoOKtoCall: "U",
          mktoMPSPermissionsFlag: true,
          mktoOKtoShare: false,
          autosubmit: true,
        });
      } else {
        form.addHiddenFields({
          mktoOKtoMail: "U",
          mktoMPSPermissionsFlag: true,
          autosubmit: false,
        });
      }
      form.addHiddenFields({
        mktoformType: mcz_marketoForm_pref?.form?.type,
        mktoformSubtype: mcz_marketoForm_pref?.form?.subtype,
        languagePref: mcz_marketoForm_pref?.profile?.segLangCode,
        mktoConsentURL: window.location.href,
        mktoFormsPrimaryProductInterest: mcz_marketoForm_pref?.program?.poi,
      });

      let d = new Date();
      let datetime = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;

      form.addHiddenFields({ mktoLastUnsubscribeDate: datetime });
      form.addHiddenFields({ unique_id: unique_id });
      form.addHiddenFields({ submissionID: unique_id });

      if (activeCookie == true) {
        try {
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
        } catch (err) {
          //  console.log("Error getting GUID: " + err);
        }

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
            }
          }
        }
        if (document.cookie.indexOf("TID=") > 0) {
          s_cgen = /TID=([^%|;]+)/.exec(document.cookie)[1];
          if (s_cgen.length > 5) {
            if (window.mcz_marketoForm_pref?.profile !== undefined) {
              window.mcz_marketoForm_pref.profile.cgen = s_cgen;
            }
            form.addHiddenFields({
              sessionCGEN: s_cgen,
            });
          }
        }
      } else {
        console.log("No Marketo Cookie found");
      }

      // check if this is active window?.Demandbase?.IP?.CompanyProfile
      if (typeof window.Demandbase != "undefined") {
        //get Demandbase.Connectors.WebForm.fieldMap if it exists
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
                if (document.querySelector(`[name="${key}"]`)) {
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
            console.group(group_label);
            console.info("Data Source: " + dataSource);
            console.info("Detected Audience: " + detectedAudience);
            console.info("Detected Audience Segment: " + detectedAudienceSegment);
            console.table("Mapped Fields");
            console.table(fieldMapData);
            console.table("Mapped Fields on this Form");
            console.table(fieldMapData_onForm);
            console.table("Non-Mapped Fields");
            console.table(fieldMapData_non);
            console.groupEnd(group_label);
          }
        }
      }
      formData = form.getValues();
      var group_label = "Marketo Submit Validation";
      var group_append = "";
      if (testRecord) {
        group_append = " - Test Record";
      }
      console.group(group_label);
      console.log(`%cForm Valid: ${valid}`, "font-size: 1.2em; color: purple; font-weight: bold; ");
      let ne = new Date();
      console.log(
        `%cForm Data: @` + ne.toLocaleString(),
        "font-size: 1.2em; color: purple; font-weight: bold; "
      );
      console.table("Required Fields" + group_append);
      console.table(requiredFieldsData);
      console.table("All Fields" + group_append);
      console.table(formData);
      console.groupEnd(group_label);
      //    console.info("Data submittable: " + valid);
      let errorDiv = document.querySelector(`div[data-mkto_vis_src="msg-error"]`);
      if (!valid) {
        form.submittable(valid);
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

    function mktoDoSubmit(formId) {
      let validForm = MktoForms2.getForm(formId).validate();
      let submittable = MktoForms2.getForm(formId).submittable();
      if (submittable) {
        let canSubmit = true;
        if (canSubmit) {
          let testRecord = isTestRecord();
          if (testRecord == "test_no_submit") {
            console.log("Test record detected, form will not submit.");
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
    }

    const mktoButtonWrap = document.querySelector("#mktoForm_" + formId + " .mktoButtonWrap");
    if (mktoButtonWrap) {
      let primaryBTN = mktoButtonWrap.querySelector("[type='submit']");

      const mktoButtonContainer = document.createElement("div");
      mktoButtonContainer.className = "mktoButtonContainer";
      mktoButtonWrap.parentNode.insertBefore(mktoButtonContainer, mktoButtonWrap);
      mktoButtonContainer.appendChild(mktoButtonWrap);

      const newButton = document.createElement("button");
      newButton.type = "button";
      newButton.id = "mktoButton_new";
      newButton.className = primaryBTN.className;
      newButton.style = primaryBTN.style;
      primaryBTN.classList.add("mktoHidden");
      primaryBTN.style.display = "none";
      primaryBTN.setAttribute("mkto-form-original", formId);
      newButton.textContent = primaryBTN.textContent;
      newButton.setAttribute("mkto-form-src", formId);

      const newButtonWrap = document.createElement("span");
      newButtonWrap.className = "mktoButtonWrap mktoNative";
      newButtonWrap.appendChild(newButton);
      mktoButtonContainer.insertBefore(newButtonWrap, mktoButtonWrap);

      newButton.addEventListener("click", function (event) {
        let formId = event.target.getAttribute("mkto-form-src");
        if (formId) {
          mktoDoSubmit(formId);
        }
      });
    }

    MktoForms2.getForm(formId).onSubmit(function (form) {
      if (translateFormElems?.pleasewait) {
        let mktoButton = document.querySelector(".mktoButton");
        if (mktoButton) {
          if (mktoButton.innerHTML.toLowerCase().indexOf("...") > -1) {
            mktoButton.innerHTML = translateFormElems?.pleasewait;
          }
        }
      }
    });

    MktoForms2.getForm(formId).onSuccess(function (values, followUpUrl) {
      mcz_marketoForm_pref.form.success.confirm = true;
      if (aaInteractionsActive == true && aaInteraction != undefined) {
        aaInteraction("Marketo Form Submission", "formSubmission", formId, null);
        if (mcz_marketoForm_pref?.form?.success?.delay) {
          let delay = parseInt(mcz_marketoForm_pref.form.success.delay);
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
        successConfirm = setTimeout(function () {
          MktoForms_onSuccess();
        }, mcz_marketoForm_pref.form.success.delay);
      } else {
        MktoForms_onSuccess();
        console.log("aaInteractionsActive is false");
      }
      return false;
    });
  }

  // ##
  // ##
  // ##
  // ##
  function MktoForms_onSuccess() {
    clearTimeout(successConfirm);
    var group_label = "Marketo Submit Success";
    console.group(group_label);
    function logSuccess(message) {
      console.log(`%c${message}`, "font-size: 1.2em; color: purple; font-weight: bold; ");
    }
    logSuccess("Form Submitted");

    function validateUrl(url) {
      try {
        new URL(url);
        return true;
      } catch (_) {
        return false;
      }
    }

    let ty_content = mcz_marketoForm_pref?.form?.success?.content;
    if (mcz_marketoForm_pref?.form?.success?.type == undefined) {
      mcz_marketoForm_pref.form.success.type = "redirect";
      logSuccess("Form Success Type not defined, defaulting to redirect");
    }
    if (ty_content != "" && ty_content != null && ty_content != undefined) {
      if (validateUrl(ty_content) == true) {
        logSuccess("Form Success Content is a URL");
        if (ty_content.indexOf("http") == -1) {
          logSuccess("Form Success Content is a relative URL");
          if (ty_content.indexOf("/") == 0) {
            ty_content = ty_content.substring(1);
          }
          ty_content = window.location.origin + "/" + ty_url;
        }
        logSuccess("Form Success Content is a valid URL: " + ty_content);
      } else {
        logSuccess("URL is not valid, defaulting to message.");
        mcz_marketoForm_pref.form.success.type = "message";
      }
    } else {
      logSuccess("Form Success Content is not defined!!");
    }

    let ne = new Date();
    console.log(
      `%cForm Data: @` + ne.toLocaleString(),
      "font-size: 1.2em; color: purple; font-weight: bold; "
    );
    logSuccess("Form Submit Date: " + ne.toLocaleString());
    logSuccess("Form Submit Unique ID: " + unique_id);

    console.groupEnd(group_label);

    if (mcz_marketoForm_pref?.form?.success?.type == "redirect") {
      if (ty_content != "" && ty_content != null && ty_content != undefined) {
        window.location.href = ty_content;
      }
    } else if (mcz_marketoForm_pref.form.success.type == "message") {
      if (ty_content != "" && ty_content != null && ty_content != undefined) {
        ty_content = "thank you.";
      }

      let form = document.getElementById("mktoForm_" + formId);
      let formWrapper = document.createElement("div");
      formWrapper.classList.add("mktoForm-wrap");

      let formMessageContent = document.createElement("p");
      formMessageContent.classList.add("ty-message");
      formMessageContent.innerHTML = ty_content;
      formWrapper.appendChild(formMessageContent);
      form.parentNode.insertBefore(formWrapper, form);
      form.style.opacity = "0";
      form.style.visibility = "hidden";
      setTimeout(function () {
        formMessageContent.style.opacity = "1";
        formMessageContent.style.visibility = "visible";
      }, 100);
    }
  }

  mktoPerformanceObserver.observe({ entryTypes: ["measure"] });
  performance.mark("MarketoFormStart");
}

// ##
// ##
// ]]>