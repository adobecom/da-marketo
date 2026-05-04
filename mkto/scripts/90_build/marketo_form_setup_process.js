// ##
// ## Updated 20251125T133842
// ##
// ##
// ## 90_build/marketo_form_setup_process.js - 20251125T133842
// ##
var mkto_formsLoaded = mkto_formsLoaded || {};
var mktoFrmParams = new URLSearchParams(window.location.search);
var mktoForm = document.querySelector(".mktoForm");
mktoForm.setAttribute("style", "opacity:0");
mktoForm.classList.add("starting_fieldset");
var consStyl = "font-size: 1.2em; color: green; font-weight: bold; ";

if (typeof mktoPerformanceObserver == "undefined") {
  mkf_c.log("Form - Begin");

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

  performance.mark("MarketoFormStart");

  function marketoFormSetup(lvl = "") {
    var group_label = "Marketo Form Setup " + lvl;
    mkf_c.group(group_label);
    mkf_c.log("Marketo Form Setup - Triggered " + lvl);

    if (lvl == "stage1") {
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

      if (typeof window.mcz_marketoForm_pref_test === "object") {
        mkf_c.log("test data layer found, merging with current data layer");
        mkf_c.log("current data layer", window.mcz_marketoForm_pref);
        mkf_c.log("test data layer", mcz_marketoForm_pref_test);
        checkAndAddProperties(window.mcz_marketoForm_pref, mcz_marketoForm_pref_test, true);
      }

      if (window.mcz_marketoForm_pref?.form?.field_visibility) {
        mkf_c.log("v2 form object found.");
      } else if (window.mcz_marketoForm_pref?.field_visibility) {
        mkf_c.log("Upgrading form object to v2");
        window.mcz_marketoForm_pref.form.field_visibility =
          window.mcz_marketoForm_pref.field_visibility;

        window.mcz_marketoForm_pref.form.field_filters = window.mcz_marketoForm_pref?.field_filters;

        window.mcz_marketoForm_pref.form.field_exclusions =
          window.mcz_marketoForm_pref?.field_exclusions;
      }

      if (typeof window?.mkto_checkAdobeIMS === "function") {
        window.mkto_checkAdobeIMS();
      }

      if (typeof window.mkto_getMktToken === "function") {
        window.mkto_getMktToken();
      }

      if (typeof window.mkto_checkTemplate === "function") {
        window.mkto_checkTemplate();
      }

      window.mkto_checkAutoSuccess = async function (src = "") {
        let programId = window?.mcz_marketoForm_pref?.program?.id || "";
        if (programId && programId?.length > 0) {
          programId = programId.replace(/[^0-9]/g, "");
          programId = programId.substring(0, 10);
        }
        window.mcz_marketoForm_pref.flags = window.mcz_marketoForm_pref.flags || {};
        if (window.mcz_marketoForm_pref?.flags?.autoSuccessReviewed === true) {
          return;
        }

        let groupLabel = "Checking Auto Success - " + src;
        mkf_c.group(groupLabel);
        if (typeof window.MktoForms_onSuccess === "function") {
          if (window.mcz_marketoForm_pref?.form?.autoSuccess === true) {
            mkf_c.log("Auto Success: enabled");
            let lastSubmission =
              window.mcz_marketoForm_pref?.profile?.prefill?.mktoLastUnsubscribeDate || "";

            if (lastSubmission && lastSubmission == "") {
              mkf_c.log(
                "Auto Success: No last submission found from prefill, checking localStorage."
              );
              const mktoFrmLastID_p = localStorage.getItem("mktoFrmLastID_p" + programId) || "";
              const mktoFrmLastID = localStorage.getItem("mktoFrmLastID") || "";
              const deriveSubmissionDate = (value) => {
                if (!value || typeof value !== "string") {
                  return "";
                }
                const timestampMatch = value.match(/#t:(\d{10,})/);
                if (!timestampMatch || !timestampMatch[1]) {
                  return "";
                }
                const timestamp = parseInt(timestampMatch[1], 10);
                if (Number.isNaN(timestamp) || timestamp <= 0) {
                  return "";
                }
                return new Date(timestamp).toISOString();
              };
              const programSubmission = deriveSubmissionDate(mktoFrmLastID_p);
              const globalSubmission = deriveSubmissionDate(mktoFrmLastID);
              if (programSubmission) {
                lastSubmission = programSubmission;
                mkf_c.log(
                  "Auto Success: Program submission found via localStorage.",
                  programSubmission
                );
              } else if (globalSubmission) {
                // lastSubmission = globalSubmission;
                mkf_c.log(
                  "NOT USED: Auto Success: Global submission found via localStorage.",
                  globalSubmission
                );
              }
            }

            if (lastSubmission && lastSubmission !== "") {
              let okToAutoSuccess = false;
              mkf_c.log(`Auto Success: Last Submission: ${lastSubmission}`);
              try {
                window.mcz_marketoForm_pref.flags.autoSuccessReviewed = true;
                const timeFrameDays =
                  window.mcz_marketoForm_pref?.form?.autoSuccessTimeFrameDays || 30;
                const timeFrameMillis = timeFrameDays * 24 * 60 * 60 * 1000;
                let timeDifference = new Date() - new Date(lastSubmission);
                let timeDifferenceDays = timeDifference / (24 * 60 * 60 * 1000);
                timeDifferenceDays = Math.round(timeDifferenceDays);
                okToAutoSuccess = timeDifferenceDays <= timeFrameDays;
                mkf_c.log(
                  `Auto Success: Time Difference: ${timeDifferenceDays} days, okToAutoSuccess: ${okToAutoSuccess}`
                );
              } catch (error) {
                window.mcz_marketoForm_pref.flags.autoSuccessReviewed = false;
                mkf_c.error("Auto Success: Error calculating time difference", error);
                okToAutoSuccess = false;
              }
              if (okToAutoSuccess) {
                mkf_c.groupEnd(groupLabel);
                window.MktoForms_onSuccess();
                return;
              }
            } else {
              mkf_c.log("Auto Success: No last submission found.");
            }
          }
        }
        if (typeof window?.renderingReview === "function") {
          mkf_c.groupEnd(groupLabel);
          window.renderingReview("AutoSuccess - " + src);
        }
      };

      if (typeof window?.mkto_PrgrsCtrlr?.init === "function") {
        mkf_c.log("Progressive Controller is available");
      } else {
        mkf_c.warn("Progressive Controller is not available, falling back to standard form setup");
        programId = "";
      }
      let programId = window?.mcz_marketoForm_pref?.program?.id || "";
      if (programId && programId?.length > 0) {
        programId = programId.replace(/[^0-9]/g, "");
        programId = programId.substring(0, 10);
      }
      if (programId && programId !== "") {
        mkf_c.log(`Program ID Provided: ${programId}, syncing with Progressive Controller`);
        window.mkto_PrgrsCtrlr.init({
          programId: programId,
          callback: () => {
            mkf_c.log("Progressive Controller Initialized, sourcing program data.");
            window.mkto_checkTemplate("PP");

            if (typeof window?.mkto_checkAutoSuccess === "function") {
              window.mkto_checkAutoSuccess("PP");
              return;
            } else {
              if (typeof window?.renderingReview === "function") {
                window.renderingReview("PP - No AutoSuccess");
                return;
              }
            }
          },
        });
      } else {
        mkf_c.log("standard form setup");
        if (typeof window?.mkto_checkAutoSuccess === "function") {
          window.mkto_checkAutoSuccess("Standard");
          return;
        } else {
          if (typeof window?.renderingReview === "function") {
            window.renderingReview("Standard - No AutoSuccess");
            return;
          } else {
            mkf_c.error("FATAL ERROR: renderingReview function is not available");
          }
        }
      }

      mkf_c.groupEnd(group_label);
      return;
    }

    function mkto_buildForm() {
      var group_label = "mkto_buildForm";
      mkf_c.group(group_label);

      let formId = window.getMktoFormID();
      //check the size of the cookie for this session
      if (document.cookie.length > 4096) {
        mkf_c.warn(`Cookie size > 4k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
      } else if (document.cookie.length > 8192) {
        mkf_c.error(`Cookie size > 8k, ${document.cookie.length}, formId: ${formId} #ll #cookie`);
      }

      if (typeof formId === "undefined" || formId === null) {
        mkf_c.log(`Form ID is undefined or null, formId: ${formId}`);
        mkf_c.groupEnd(group_label);
        return;
      }
      if (!mkto_formsLoaded[formId]) {
        mkto_formsLoaded[formId] = true;
      } else {
        mkf_c.log(`Form [${formId}] already loaded`);
        mkf_c.groupEnd(group_label);
        return;
      }

      window.mkto_print_DL(mcz_marketoForm_pref);
      let checkTestRecord = window.mkto_isTestRecord();
      mkf_c.log(`Test Record: ${checkTestRecord}`);

      MktoForms2.getForm(formId).onValidate(async function (valid) {
        let formId = window.getMktoFormID();
        let form = MktoForms2.getForm(formId);
        let fData = form.getValues();
        let unique_id = window.mkto_getUniqueID(fData);
        let activeCookie = window?.mcz_marketoForm_pref?.profile?.activeCookie || false;
        let requiredFields = document.querySelectorAll(`#mktoForm_${formId} .mktoRequired`);
        let requiredFieldsData = {};
        let requiredFieldsFilled = true;
        let testRecord = false;

        window.mkto_isTestRecord();
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
                mkf_c.log(`Required Field Missing: '${key}'`);
              }
            }
          }
        }
        let countryField = document.querySelector(`#mktoForm_${formId} [name="Country"]`);
        if (countryField) {
          if (countryField.value == "") {
            let options = countryField.querySelectorAll("option");
            if (options && options.length > 0) {
              countryField.value = options[0].value;
            }
          }
        }

        let mktoInvalid_nonreq = document.querySelectorAll(
          `#mktoForm_${formId} .mktoInvalid:not(.mktoRequired)`
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
          let eFld = document.querySelector(`#mktoForm_${formId} [name="Email"]`);
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
          //ignore mkt_tok
          if (cleanName.toLowerCase() === "mkt_tok") {
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
          let attrMapping = window?.mcz_marketoForm_pref?.form?.validation?.campaignid;
          let cgen_sparams = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.params;
          let cgen_cookie_params = window?.mcz_marketoForm_pref?.form?.validation?.cgen?.cookie;

          let mktoTreatmentId = window?.mcz_marketoForm_pref?.profile?.cgen;
          if (mktoTreatmentId === null || mktoTreatmentId === undefined || mktoTreatmentId === "") {
            mktoTreatmentId = "";
          }

          let TID = window.mktoFrmsGetValueByName("TID");
          let cgen_param = {};
          for (let i = 0; i < cgen_sparams.length; i++) {
            cgen_param[cgen_sparams[i]] = "";
          }
          let cgen_cookie = {};
          for (let i = 0; i < cgen_cookie_params.length; i++) {
            cgen_cookie[cgen_cookie_params[i]] = "";
          }

          if (TID.indexOf("-") > -1) {
            let split_cgen = mktoTreatmentId.split("-");
            if (split_cgen.length > 2) {
              cgen_cookie.trackingid = split_cgen[0];
              cgen_cookie.sdid = split_cgen[1];
              cgen_cookie.promoid = split_cgen[2];
            }
          }
          for (let i = 0; i < cgen_sparams.length; i++) {
            let paramValue = window.mktoFrmsGetValueByName(cgen_sparams[i]);
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
            gclid = window.mktoFrmsGetValueByName("gclid");
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
              let valcheck = window.mktoFrmsGetValueByName(attrMapping[key].queryParam);
              if (valcheck) {
                value = valcheck;
              } else {
                if (
                  attrMapping[key]?.cookie != "" &&
                  attrMapping[key]?.cookie != null &&
                  attrMapping[key]?.cookie != undefined
                ) {
                  let cookieVer = window.mktoFrmsGetValueByName(attrMapping[key].cookie);
                  if (cookieVer) {
                    mkf_c.log(`${attrMapping[key].cookie} = ${cookieVer} Sourced from cookie`);
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
                    `Invalid ${
                      attrMapping[key].field
                    } value: ${value} - does not start with ${attrMapping[key].starts_with.join(
                      ", "
                    )}`
                  );
                }
              }
              if (attrMapping[key].min_length && value.length > 0 && valid == true) {
                if (value.length < attrMapping[key].min_length) {
                  valid = false;
                  mkf_c.log(`Invalid ${attrMapping[key].field} value: ${value} - too short`);
                }
                if (attrMapping[key].max_length) {
                  if (value.length > attrMapping[key].max_length) {
                    valid = false;
                    mkf_c.log(`Invalid ${attrMapping[key].field} value: ${value} - too long`);
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
          form.setValues({
            mktoCoPartnerPermissionValue: false,
            mktoCoPartnerConsentNotice: "",
          });
        }

        let pElemts = document.querySelectorAll(
          ".adobe-privacy .mktoHtmlText.mktoVisible:not(.privacy-subscription)"
        );
        let privactText = Array.from(pElemts)
          .map((item) => {
            return item.textContent;
          })
          .join(" ");

        let mktoInstantInquiry = true;
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

        addUniqueParam("inquiry", mktoInstantInquiry ? "true" : "false");
        form.addHiddenFields({
          mktoOKtoMail: "U",
          mktoMPSPermissionsFlag: true,
          autosubmit: false,
          mktoInstantInquiry: mktoInstantInquiry,
        });
        mcz_marketoForm_pref.profile["mktoInstantInquiry"] = mktoInstantInquiry;

        uFFld(form, "mktoformType", mcz_marketoForm_pref?.form?.type, true);
        uFFld(form, "mktoformSubtype", mktoformSubtype, true);
        uFFld(form, "languagePref", mcz_marketoForm_pref?.profile?.segLangCode, true);
        uFFld(form, "mktoConsentURL", mcz_marketoForm_pref?.program?.url, true);
        uFFld(form, "mktoFormsPrimaryProductInterest", mcz_marketoForm_pref?.program?.poi, true);
        addUniqueParam(
          "poi",
          (mcz_marketoForm_pref?.program?.poi || "").trim().toLowerCase() || ""
        );
        let programId = mcz_marketoForm_pref?.program?.id || "";
        programId = String(programId)?.trim() || "";
        if (programId !== "") {
          addUniqueParam("programid", programId);
        }

        let mktoFormId = mcz_marketoForm_pref?.form?.id || "";
        mktoFormId = String(mktoFormId)?.trim() || "";
        if (mktoFormId !== "") {
          addUniqueParam("mktoFormId", mktoFormId);
        }

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
          MktoSessionSubmissionID: unique_id,
        });

        let subID = window?.mcz_marketoForm_pref?.program?.subscription?.id || "";
        subID = subID.trim();
        if (subID !== undefined && subID !== null && subID !== "") {
          mkf_c.log(`SubID: ${subID}.`);
          form.addHiddenFields({
            mktoOKtoMail: "U",
            mktoOKtoEmail: "U",
            mktoOKtoCall: "U",
            mktoOPContentSubscriptionConsentNotice: privactText,
            mktoOPContentSubscriptionName: subID,
            mktoSessionSubscriptionID: subID,
            mktoOPContentSubscriptionPermissionValue: "Y",
          });
          addUniqueParam("subid", subID);
        }

        window.mcz_marketoForm_pref.profile = window.mcz_marketoForm_pref?.profile || {};

        //ECID
        let current_ecid = window.mcz_marketoForm_pref?.profile?.ecid || "";
        if (current_ecid !== "") {
          form.addHiddenFields({
            sessionECID: current_ecid,
          });
        } else {
          let mcmid = document.cookie.match(/MCMID%7C([^%|;]+)/)?.[1]?.trim() || "";
          let mcaamlh = document.cookie.match(/MCAAMLH-[^%|;]+%7C([0-9]+)/)?.[1]?.trim() || "";
          if (mcmid !== "" && mcaamlh !== "") {
            let s_ecid = `${mcaamlh}:${mcmid}`;
            if (s_ecid.length > 10) {
              window.mcz_marketoForm_pref.profile.ecid = s_ecid;
              window.mcz_marketoForm_pref.profile.mcmid = mcmid;
              form.addHiddenFields({
                sessionECID: s_ecid,
                mktoMcid: mcmid,
              });
            }
          }
        }

        //GUID
        let current_guid = window.mcz_marketoForm_pref?.profile?.guid || "";
        if (current_guid !== "") {
          form.addHiddenFields({
            sessionGUID: current_guid,
          });
        } else {
          if (
            typeof window?.adobeIMS?.isSignedInUser() === "boolean" &&
            window?.adobeIMS?.isSignedInUser() === true
          ) {
            if (
              typeof window?.adobeIMS?.getProfile() === "object" &&
              window?.adobeIMS?.getProfile() !== null
            ) {
              let ims_profile = (await window.adobeIMS?.getProfile()) || null;
              if (ims_profile && ims_profile !== null) {
                window.mcz_marketoForm_pref.profile.ims_profile = ims_profile;
                if (ims_profile?.userId && ims_profile?.userId !== "") {
                  current_guid = ims_profile?.userId?.split("@")?.[0]?.trim() || "";
                  if (current_guid !== "") {
                    window.mcz_marketoForm_pref.profile.guid = current_guid;
                    form.addHiddenFields({
                      sessionGUID: current_guid,
                    });
                  }
                }
              }
            }
          } else {
            mkf_c.warn("Not signed in to Adobe IMS");
          }
        }

        if (typeof window?.Demandbase !== "undefined") {
          if (typeof window?.Demandbase?.Config?.data_ip !== "undefined") {
            let fieldDBdata = window?.Demandbase?.Config?.data_ip || {};
            if (Object.keys(fieldDBdata).length > 0) {
              let dataSource = "IP";
              let fieldMap = window?.Demandbase?.Config?.forms?.fieldMap;
              let detectedAudience = fieldDBdata?.audience || "";
              let detectedAudienceSegment = fieldDBdata?.audience_segment || "";
              let fieldMapData = {};

              for (let key in fieldMap) {
                if (fieldMap[key] && fieldMap[key] !== null && fieldMap[key] !== "") {
                  if (fieldDBdata[key] && fieldDBdata[key] !== null && fieldDBdata[key] !== "") {
                    fieldMapData[fieldMap[key]] = fieldDBdata[key];
                  }
                }
              }
              let fieldMapData_onForm = {};
              for (let key in fieldMapData) {
                if (fieldMapData[key] && fieldMapData[key] !== null && fieldMapData[key] !== "") {
                  if (document.querySelector(`[name="${key}"]`)) {
                    fieldMapData_onForm[key] = fieldMapData[key];
                  }
                }
              }

              let fieldMapData_offForm = {};
              mcz_marketoForm_pref.demandbaseInfo = mcz_marketoForm_pref.demandbaseInfo || {};
              for (let key in fieldDBdata) {
                if (fieldDBdata[key] && fieldDBdata[key] !== null && fieldDBdata[key] !== "") {
                  mcz_marketoForm_pref.demandbaseInfo[key] = fieldDBdata[key] || "";
                  if (!fieldMap[key] && fieldMap[key] !== null && fieldMap[key] !== "") {
                    fieldMapData_offForm[key] = fieldDBdata[key];
                  }
                }
              }
              mcz_marketoForm_pref.demandbaseInfo = mcz_marketoForm_pref.demandbaseInfo || {};
              mcz_marketoForm_pref.demandbaseInfo[dataSource] = {
                source_type: dataSource,
                audience: detectedAudience,
                audience_segment: detectedAudienceSegment,
                fieldMap: fieldMap || {},
                fieldMapData: fieldMapData || {},
                fieldMapData_onForm: fieldMapData_onForm || {},
                fieldMapData_offForm: fieldMapData_offForm || {},
              };

              var group_label = "Demandbase";
              mkf_c.group(group_label);
              mkf_c.info(
                `Data Source: ${dataSource}\nDetected Audience: ${detectedAudience}\nDetected Audience Segment: ${detectedAudienceSegment}`
              );
              mkf_c.info("Mapped Fields");
              mkf_c.table(fieldMapData);
              mkf_c.info("Mapped Fields on this Form");
              mkf_c.table(fieldMapData_onForm);
              mkf_c.info("Non-Mapped Fields");
              mkf_c.table(fieldMapData_offForm);
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
        mkf_c.log(`%cForm Valid: ${valid}`, consStyl);
        let ne = new Date();
        mkf_c.log("%cForm Data: @" + ne.toLocaleString(), consStyl);

        let poi_warn = fData["mktoFormsPrimaryProductInterest"];
        if (poi_warn == "") {
          mkf_c.log("%cPOI is empty - Critical Field", consStyl);
        } else {
          mkf_c.log(`%cPOI: ${poi_warn}`, consStyl);
        }

        let mktoProductionCampaignId_warn = fData["mktoProductionCampaignId"];
        if (mktoProductionCampaignId_warn == "") {
          mkf_c.log("%cProd Campaign ID is empty - Critical Field", consStyl);
        } else {
          mkf_c.log(`%cProd Campaign ID: ${mktoProductionCampaignId_warn}`, consStyl);
        }

        mkf_c.table(`Required Fields${group_append}`);
        mkf_c.table(requiredFieldsData);
        mkf_c.table(`All Fields${group_append}`);
        mkf_c.table(fData);

        mkf_c.groupEnd(group_label);

        let errorDiv = document.querySelector('div[data-mkto_vis_src="msg-error"]');
        if (!valid) {
          form.submittable(valid);
          let mktoSubmitButton = document.querySelectorAll(`#mktoForm_${formId} button`);
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

          if (window.mcz_marketoForm_pref?.profile) {
            let currentPrefill = window.mcz_marketoForm_pref.profile.prefill || {};
            let updatedPrefill = { ...currentPrefill };
            const mktoFormSelector = `form.mktoForm[id="mktoForm_${window.mcz_marketoForm_pref.form.id}"]`;
            const allowedTextInputTypes = new Set(["text", "email", "tel", "number"]);
            const normalizeFieldValue = (value) => {
              if (Array.isArray(value)) {
                return value.filter(
                  (item) => item !== null && item !== undefined && ("" + item).trim() !== ""
                );
              }
              if (typeof value === "string") {
                return value.trim();
              }
              return value;
            };
            const isVisibleTextInputOrDropdown = (fieldName) => {
              const fieldElements = document.querySelectorAll(
                `${mktoFormSelector} [name="${fieldName}"]`
              );
              if (!fieldElements || fieldElements.length === 0) {
                return false;
              }
              for (let i = 0; i < fieldElements.length; i++) {
                const element = fieldElements[i];
                const rowTop =
                  typeof element.closest === "function" ? element.closest(".mktoFormRowTop") : null;
                if (rowTop && rowTop.classList.contains("mktoHidden")) {
                  continue;
                }
                const isVisible =
                  element.offsetWidth > 0 ||
                  element.offsetHeight > 0 ||
                  element.getClientRects().length > 0;
                if (!isVisible) {
                  continue;
                }
                const tagName = (element.tagName || "").toUpperCase();
                if (tagName === "SELECT") {
                  return true;
                }
                if (tagName === "INPUT") {
                  const type = (element.getAttribute("type") || "text").toLowerCase();
                  if (allowedTextInputTypes.has(type) || type === "") {
                    return true;
                  }
                }
              }
              return false;
            };
            for (const key in fData) {
              let fieldName = key.trim();
              let fieldValue = fData[key];
              let alwaysUpdate = false;
              let alwaysUpdateFields =
                window.mcz_marketoForm_pref?.value_setup?.always_update_fields || [];
              if (alwaysUpdateFields.length > 0 && alwaysUpdateFields.includes(fieldName)) {
                alwaysUpdate = true;
              }
              const normalizedValue = normalizeFieldValue(fieldValue);
              const hasValue =
                normalizedValue !== "" &&
                normalizedValue !== null &&
                typeof normalizedValue !== "undefined" &&
                (!Array.isArray(normalizedValue) || normalizedValue.length > 0);
              if (
                (hasValue && alwaysUpdate) ||
                (hasValue && isVisibleTextInputOrDropdown(fieldName))
              ) {
                updatedPrefill[fieldName] = fieldValue;
              }
            }
            window.mcz_marketoForm_pref.profile.prefill = updatedPrefill;
            window.mktoPreFillFields = updatedPrefill;
            try {
              sessionStorage.setItem("mktoPreFillFields", JSON.stringify(updatedPrefill));
              localStorage.setItem("mktoFrmLastID", unique_id);
              localStorage.setItem("mktoFrmLastID_p" + programId, unique_id);
            } catch (e) {
              mkf_c.warn("Error setting sessionStorage.mktoPreFillFields", e);
              mkf_c.warn("Error setting localStorage.mktoFrmLastID", e);
            }
          }
          if (typeof mkto_PrgrsCtrlr?.storageManager?.saveData === "function") {
            const coreObjects = ["program", "form", "profile", "program_profile", "event"];
            coreObjects.forEach((key) => {
              if (window.mcz_marketoForm_pref[key]) {
                mkto_PrgrsCtrlr.storageManager.saveData(window.mcz_marketoForm_pref[key]);
              }
            });
          }
        }
        return valid;
      });

      window.mktoDoSubmit = function (formId) {
        let validForm = MktoForms2.getForm(formId).validate();
        let submittable = MktoForms2.getForm(formId).submittable();
        if (submittable) {
          let canSubmit = true;
          if (canSubmit && validForm) {
            let testRecord = window.mkto_isTestRecord();
            if (testRecord == "test_no_submit") {
              mkf_c.log(`%cTest Record Detected - Emulating Marketo Submission`, consStyl);

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
                  if (typeof window.MktoForms_onSuccess === "function") {
                    window.MktoForms_onSuccess();
                  } else {
                    mkf_c.error("MktoForms_onSuccess is not defined");
                  }
                }, delay);
              } else {
                window.MktoForms_onSuccess();
                mkf_c.log("aaInteractionsActive is false");
              }
            } else {
              const mktoSubmitButton = document.querySelector(
                `#mktoForm_${formId} button[type='submit']`
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
          let primaryBTN = mktoButtonWrap.querySelector("[type='submit']");
          if (primaryBTN) {
            const mktoButtonContainer = document.createElement("div");
            mktoButtonContainer.className = "mktoButtonContainer";
            mktoButtonWrap.parentNode.insertBefore(mktoButtonContainer, mktoButtonWrap);
            mktoButtonContainer.appendChild(mktoButtonWrap);

            const newButtonContainer = document.createElement("div");
            newButtonContainer.className = "mkto-step-container";

            const backBTN = document.createElement("button");
            backBTN.type = "button";
            backBTN.className = "mkto-step-back-btn";
            backBTN.innerHTML = "Back";

            //newButtonContainer.appendChild(backBTN);
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
            if (primaryBTN.getAttribute("data-mkto-btn-next")) {
              newButton.setAttribute(
                "data-mkto-btn-next",
                primaryBTN.getAttribute("data-mkto-btn-next")
              );
            }

            let primaryBTNtext = primaryBTN.textContent;
            let subtypeRule = mcz_marketoForm_pref?.form?.subtype;
            let subtypeRules = mcz_marketoForm_pref?.form?.subtypeRules;
            let subtype = mcz_marketoForm_pref?.form?.subtype;
            let language = mcz_marketoForm_pref?.profile?.prefLanguage;
            if (subtype) {
              if (subtypeRules && subtypeRules !== null) {
                subtypeRule = subtypeRules[subtype];
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
                        `Language: ${language} No button translated '${subtypeRule}' text found`
                      );
                    }
                  } else {
                    mkf_c.log(
                      `Language: ${language} No button translated '${subtypeRule}' text found`
                    );
                  }
                }
              }
            }
            primaryBTN.setAttribute("mkto-form-original", formId);
            newButton.innerHTML = primaryBTNtext;
            newButton.setAttribute("data-mkto-btn-text", primaryBTNtext);
            newButton.setAttribute("data-mkto-btn-submit", primaryBTNtext);
            newButton.setAttribute("data-translationKey", subtypeRule);
            newButton.setAttribute("mkto-form-src", formId);

            const newButtonWrap = document.createElement("span");
            newButtonWrap.className = "mktoButtonWrap mktoNative";
            newButtonWrap.appendChild(newButton);
            newButtonContainer.appendChild(newButtonWrap);

            const stepP = document.createElement("p");
            stepP.className = "mkto-step00of99";
            stepP.innerHTML = "";
            //newButtonContainer.appendChild(stepP);

            mktoButtonContainer.insertBefore(newButtonContainer, mktoButtonWrap);

            newButton.addEventListener("click", function (event) {
              let targetBtn = event.target.closest("button");
              if (!targetBtn) return;
              let formId = targetBtn.getAttribute("mkto-form-src");
              
              if (formId) {
                targetBtn.disabled = true;

                //if this has a data-mkto-btn-pleasewait set the text to it
                let pleaseWaitText = targetBtn.getAttribute("data-mkto-btn-pleasewait");
                if (pleaseWaitText) {
                  targetBtn.setAttribute("data-mkto-btn-text", targetBtn.textContent);
                  targetBtn.innerHTML = pleaseWaitText;
                }

                setTimeout(function () {
                  targetBtn.disabled = false;
                  let buttonText = targetBtn.getAttribute("data-mkto-btn-text");
                  if (buttonText) {
                    targetBtn.innerHTML = buttonText;
                  }
                }, 10000);
                mktoDoSubmit(formId);
              }
            });

            window.translateButtons("submit");
            window.translateButtons("pleasewait");
            window.translateButtons("next");
            window.translateButtons("back");
            window.translateButtons("step00of99");
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

      MktoForms2.getForm(formId).onSuccess(function (values, followUpUrl) {
        mcz_marketoForm_pref.form.success.confirm = true;

        let ty_type = "" + mcz_marketoForm_pref?.form?.success?.type;
        ty_type = ty_type.trim().toLowerCase();
        if (ty_type == "adobe_connect") {
          if (typeof window.MktoForms_onSuccess === "function") {
            window.MktoForms_onSuccess();
          } else {
            mkf_c.error("MktoForms_onSuccess is not defined");
          }
          return false;
        }

        if (aaInteractionsActive == true && window.aaInteraction != undefined) {
          window.aaInteraction("Marketo Form Submission", "formSubmission", formId, null);

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
            if (typeof window.MktoForms_onSuccess === "function") {
              window.MktoForms_onSuccess();
            } else {
              mkf_c.error("MktoForms_onSuccess is not defined");
            }
          }, delay);
        } else {
          mkf_c.log("aaInteractionsActive is false");
          if (typeof window.MktoForms_onSuccess === "function") {
            window.MktoForms_onSuccess();
          } else {
            mkf_c.error("MktoForms_onSuccess is not defined");
          }
        }
        return false;
      });

      mkf_c.groupEnd(group_label);
    }

    if (typeof window?.MktoForms_onSuccess !== "function") {
      window.MktoForms_onSuccess = function () {
        if (window?.mktoFormConfirm !== undefined) {
          clearTimeout(window.mktoFormConfirm);
        }
        var group_label = "Marketo Submit Success";
        mkf_c.group(group_label);
        function lS(message) {
          mkf_c.log(`%c${message}`, consStyl);
        }

        if (window?.mcz_marketoForm_pref?.profile?.testing == true) {
          lS("Form Submitted - Test Record");
        } else {
          lS("Form Submitted");
        }

        let ty_type = "" + mcz_marketoForm_pref?.form?.success?.type || "";
        ty_type = ty_type.trim().toLowerCase();
        let ty_content = "" + mcz_marketoForm_pref?.form?.success?.content || "";
        ty_content = ty_content.trim();

        if (ty_content == "" || ty_content.toLowerCase() == "null" || ty_content.toLowerCase() == "undefined") {
          ty_content = "";
        }
        if (ty_type == "" || ty_type == "null" || ty_type == "undefined") {
          ty_type = "redirect";
          lS("Form Success Type not defined, defaulting to redirect");
        }

        let ne = new Date();
        mkf_c.log(`%cForm Data: @${ne.toLocaleString()} ${ty_type}`, consStyl);
        lS(`Date: ${ne.toLocaleString()}`);
        lS(`Unique ID: ${window?.mcz_marketoForm_pref?.profile?.unique_id}`);

        mcz_marketoForm_pref.form.lastSubmission = new Date();

        if (typeof mkto_PrgrsCtrlr?.storageManager?.saveData === "function") {
          const coreObjects = ["program", "form", "profile", "program_profile", "event"];
          coreObjects.forEach((key) => {
            if (window.mcz_marketoForm_pref[key]) {
              mkto_PrgrsCtrlr.storageManager.saveData(window.mcz_marketoForm_pref[key]);
            }
          });
        }

        if (ty_type == "adobe_connect") {
          if (
            typeof window?.mkto_PrgrsCtrlr?.adobeConnectManager?.reviewAdobeConnect == "function"
          ) {
            window.mkto_PrgrsCtrlr.adobeConnectManager.reviewAdobeConnect();
            return;
          } else {
            mkf_c.log("reviewAdobeConnect function is not available, setting to message");
            ty_type = "redirect";
          }
        }

        mcz_marketoForm_pref.form.success.type = ty_type;

        if (ty_content != "") {
          if (window.MktoFormsValidUrl(ty_content) == true) {
            ty_type = "redirect";
            lS("TY URL");

            if (ty_content.indexOf("http") == -1) {
              lS("TY relative URL");
              if (ty_content.indexOf("/") == 0) {
                ty_content = ty_content.substring(1);
              }
              ty_content = window?.location?.origin + "/" + ty_content;
            }

            lS(`TY is a valid URL: ${ty_content}`);
          } else {
            lS(`URL=X >> message. ${ty_content}`);
            ty_type = "message";
          }
        }

        mcz_marketoForm_pref.form.success.type = ty_type;

        if (ty_content == "") {
          lS(`TY=X for language: ${mcz_marketoForm_pref?.profile?.prefLanguage}`);

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
                mkf_c.log(`language: ${language} Translated TY: ${translatedTY}`);
              }
            }

            if (translatedTY === null) {
              translatedTY = tyFallback;
              mkf_c.log(`No language: ${language}`);
            }
            ty_content = translatedTY;
          }
        }

        mcz_marketoForm_pref.form.success.type = ty_type;
        mcz_marketoForm_pref.form.success.content = ty_content;

        mkf_c.groupEnd(group_label);

        if (ty_type == "redirect") {
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
            mkf_c.log(`Failed to add submissionid to URL: ${ty_content}`, e);
          }

          window.location.href = ty_content;
        } else {
          window.MktoForms_tyMsg(ty_content);
        }
      };
    }

    mkto_buildForm();
  }

  mkf_c.log("Marketo Form Setup - End");
}

// ##
// ##
