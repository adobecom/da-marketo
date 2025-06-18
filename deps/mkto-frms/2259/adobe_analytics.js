// <![CDATA[
// ##
// ## Updated 20230919T200726
// ##
// ##
// ##
// ## Adobe Analytics - Form Interactions
// ##
// ##
// ##

if (typeof aaInteraction != "function") {
  console.log("Adobe Analytics - Loaded");

  window.addEventListener("alloy_sendEvent", function (ev) {
    if (
      ev.detail?.event?.data?.web?.webInteraction?.name === "Marketo Form Submission" ||
      ev.detail?.event?.data?.web?.webInteraction?.name === "Marketo Form Prefill"
    ) {
      console.log("formSubmission event was received");
      MktoForms_onSuccess();
    }
  });

  var markerNo = 0;
  var aaInteractionsActive = false;
  var aaInteraction = async (eventName, eventAction, formid, callback) => {
    const consoleLabel = "Adobe Analytics Form Interaction";
    const aaEventName = "Marketo Form Submission";
    const aaEventName_prefill = "Marketo Form Prefill";
    const aaEventName_prefill_action = "formPrefill";
    const aaType = "FormInteractions";
    let formType = "marketo-Offer";
    let formId;
    let error_aa = false;
    let testRecord = false;
    if (window?.mcz_marketoForm_pref?.profile?.testing !== undefined) {
      testRecord = window.mcz_marketoForm_pref.profile.testing;
      if (typeof testRecord !== "boolean") {
        testRecord = false;
      }
    }
    if (testRecord == true) {
      eventName = "TEST " + eventName;
    }

    console.groupCollapsed(`${consoleLabel} - ${eventName}`);
    if (typeof mcz_marketoForm_pref != "object") {
      console.log("AA ERROR >> mcz_marketoForm_pref is not found.");
      error_aa = true;
    }
    if (!window.marketingtech || !window.marketingtech.adobe || !window.marketingtech.adobe.alloy) {
      console.log("AA ERROR >> alloy is not found.");
      error_aa = true;
    }
    if (mcz_marketoForm_pref && mcz_marketoForm_pref.form && mcz_marketoForm_pref.form.subtype) {
      formType = mcz_marketoForm_pref.form.subtype;
    }
    if (!window.alloy) {
      error_aa = true;
      console.log("AA ERROR >> primary alloy is not found.");
    }
    if (!window.alloy_all) {
      error_aa = true;
      console.log("AA ERROR >> primary alloy_all is not found.");
    }
    if (!window.digitalData) {
      error_aa = true;
      console.log("AA ERROR >> digitalData DL is not found.");
    }

    if (error_aa == true) {
      if (testRecord == false) {
        console.log(`${consoleLabel} - error`);
        console.groupEnd();
        return;
      } else {
        console.log(`${consoleLabel} - error, but will continue to build aa event record.`);
      }
    }

    aaInteractionsActive = true;
    formId = !formid || MktoForms2.getForm(formid) === null ? getMktoFormID() : formid;

    markerNo = markerNo + 1;
    let performanceMarker = "aaInteraction-" + markerNo;
    performance.mark(performanceMarker);
    performance.measure("aaInteraction", "MarketoFormStart", performanceMarker);
    const measureEntries = performance.getEntriesByName("aaInteraction");
    const entry = measureEntries[measureEntries.length - 1];
    if (entry) {
      let currentTime = Math.round(entry.duration);
      let currentTimeBucket = Math.round(currentTime / 500) * 500;
      mcz_marketoForm_pref.performance.currentTime = currentTime;
      mcz_marketoForm_pref.performance.currentTimeBucket = currentTimeBucket;
    }

    let form = MktoForms2.getForm(formId);
    let formValues = form.getValues();
    let unique_id = getUniqueID(formValues);
    let mkto_formID = formValues.munchkinId + "_" + formValues.formid;
    let formfieldsVis = document.querySelectorAll(
      ".mktoFormRowTop:not(.mktoHidden) .mktoVisible.mktoField"
    ).length;
    let formfieldsVisReq = document.querySelectorAll(
      ".mktoFormRowTop:not(.mktoHidden) .mktoVisible.mktoField.mktoRequired"
    ).length;

    let eventSnapShot = {
      xdm: {},
      data: {
        web: {
          webInteraction: {
            name: eventName,
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: {
                eventAction: eventAction,
              },
            },
            form: {
              primaryForm: {
                formInfo: {
                  id: mkto_formID,
                  type: window?.mcz_marketoForm_pref?.form?.subtype,
                },
              },
              response: {},
              performance: {
                //Submission ID unique to each form load on the page
                submission_id: unique_id,

                //Form Version, Form Type
                frm_id: mkto_formID, //form type
                frm_type: window?.mcz_marketoForm_pref?.form?.subtype, //form type
                frm_version: window?.mcz_marketoForm_pref?.form?.version, //form version

                //Form Fields Count, Required Fields Count, First Field Focus Interaction
                flds_count: formfieldsVis,
                flds_count_req: formfieldsVisReq,
                flds_first_action: window?.mcz_marketoForm_pref?.profile?.first_field,

                //Field Visibility Settings
                fld_name: window?.mcz_marketoForm_pref?.field_visibility?.name,
                fld_company: window?.mcz_marketoForm_pref?.field_visibility?.company,
                fld_phone: window?.mcz_marketoForm_pref?.field_visibility?.phone,
                fld_comments: window?.mcz_marketoForm_pref?.field_visibility?.comments,
                fld_demo: window?.mcz_marketoForm_pref?.field_visibility?.demo,
                fld_state: window?.mcz_marketoForm_pref?.field_visibility?.state,
                fld_postcode: window?.mcz_marketoForm_pref?.field_visibility?.postcode,
                fld_company_size: window?.mcz_marketoForm_pref?.field_visibility?.company_size,
                fld_website: window?.mcz_marketoForm_pref?.field_visibility?.website,
                fld_poi: window?.mcz_marketoForm_pref?.program?.poi,

                //Form Field Value Filters
                fld_filter_products: window?.mcz_marketoForm_pref?.field_filters?.products,
                fld_filter_industry: window?.mcz_marketoForm_pref?.field_filters?.industry,
                fld_filter_job_role: window?.mcz_marketoForm_pref?.field_filters?.job_role,
                fld_filter_functional_area:
                  window?.mcz_marketoForm_pref?.field_filters?.functional_area,

                //Campaign IDs and Positions specific to the form
                co_funnel_pos: "top",
                co_id_sfdc: window?.mcz_marketoForm_pref?.program?.campaignids?.sfdc, //Salesforce Campaign ID
                co_id_external: window?.mcz_marketoForm_pref?.program?.campaignids?.external, //External Campaign ID
                co_id_retouch: window?.mcz_marketoForm_pref?.program?.campaignids?.retouch, //Retouch Campaign ID
                co_id_onsite: window?.mcz_marketoForm_pref?.program?.campaignids?.onsite, //Onsite Campaign ID
                co_id_cgen: window?.mcz_marketoForm_pref?.program?.campaignids?.cgen, //CGEN ID
                co_id_cuid: window?.mcz_marketoForm_pref?.program?.campaignids?.cuid, //CUID ID
                co_id_gclid: window?.mcz_marketoForm_pref?.program?.campaignids?.gclid, //GCLID ID

                //Profile & Session specific data
                prf_guid: window?.mcz_marketoForm_pref?.profile?.guid, //Adobe GUID
                prf_ecid: window?.mcz_marketoForm_pref?.profile?.ecid, //Adobe Experience ECID
                prf_cgen: window?.mcz_marketoForm_pref?.profile?.cgen, //CGEN IDs on Session
                prf_lang: window?.mcz_marketoForm_pref?.profile?.prefLanguage, //preferred language
                prf_known: window?.mcz_marketoForm_pref?.profile?.known_visitor, //known visitor to Marketo
                prf_privacy_id: window?.mcz_marketoForm_pref?.profile?.privacy, //privacy text ID
                prf_privacy_style: window?.mcz_marketoForm_pref?.profile?.privacy_optin, //privacy style

                //Timecodes, current ms since page load, bucketed to 500ms
                t_ms: window?.mcz_marketoForm_pref?.performance?.currentTime,
                t_b500: window?.mcz_marketoForm_pref?.performance?.currentTimeBucket,
                t_dateTime: new Date().toISOString(),
              },
            },
          },
        },
      },
    };

    const setResponse = (custom, id, name, value) => {
      if (!eventSnapShot?.data?._adobe_corpnew?.digitalData?.form?.response) {
        return;
      }
      if (!value) {
        value = "No Value";
      }
      if (value == "No Value") {
        return;
      }
      if (Array.isArray(value)) {
        value = value.join(",");
      }
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      eventSnapShot.data._adobe_corpnew.digitalData.form.response[custom] = value;
      eventSnapShot.data._adobe_corpnew.digitalData.form.response[id] = value;
      eventSnapShot.data._adobe_corpnew.digitalData.form.response[name] = value;
    };

    let demandbaseTracker =
      formValues.mktodemandbaseTracker === "success"
        ? "yes"
        : formValues.mktodemandbaseTracker === "failure"
        ? "no"
        : "No Value";

    let hashedEmail =
      window.md5 && window.md5(formValues.Email) ? window.md5(formValues.Email) : "";
    let emailDomain =
      formValues.Email && formValues.Email.includes("@")
        ? formValues.Email.substring(formValues.Email.lastIndexOf("@") + 1)
        : "";

    const responseItems = [
      {
        key: "submissionID",
        id: "submissionID",
        name: "Submission ID",
        value: unique_id,
        pii: false,
      },
      {
        key: "hashedEmail",
        id: "hashedEmail",
        name: "Hashed Email",
        value: hashedEmail,
        pii: true,
      },
      {
        key: "domain",
        id: "domain",
        name: "Email Domain",
        value: emailDomain,
        pii: true,
      },
      {
        key: "organizationName",
        id: "mktoFormsCompany",
        name: "Organization Name",
        value: formValues.mktoFormsCompany,
        pii: true,
      },
      {
        key: "website",
        id: "mktodemandbaseWebsite",
        name: "Website",
        value: formValues.mktodemandbaseWebsite,
        pii: true,
      },
      {
        key: "jobTitle",
        id: "mktoFormsJobTitle",
        name: "Job title or role",
        value: formValues.mktoFormsJobTitle,
        pii: true,
      },
      {
        key: "industry",
        id: "mktodemandbaseIndustry",
        name: "Industry",
        value: formValues.mktodemandbaseIndustry,
        pii: false,
      },
      {
        key: "functionalArea",
        id: "mktoFormsFunctionalArea",
        name: "Functional area/department",
        value: formValues.mktoFormsFunctionalArea,
        pii: false,
      },
      {
        key: "orgType",
        id: "mktoCompanyType",
        name: "Organization Type",
        value: formValues.mktoFormsCompanyType,
        pii: false,
      },
      {
        key: "productInterest",
        id: "mktoprimaryProductInterest",
        name: "Product of interest",
        value: formValues.mktoFormsPrimaryProductInterest,
        pii: false,
      },
      {
        key: "isProductDemoChecked",
        id: "mktoRequestProductDemo",
        name: "Product demo Checkbox status",
        value: formValues.mktoRequestProductDemo,
        pii: false,
      },
      {
        key: "isDemandBaseWidgetLoaded",
        id: "mktodemandbaseTracker",
        name: "Demandbase Widget Loaded",
        value: demandbaseTracker,
        pii: false,
      },
    ];

    for (let item of responseItems) {
      if (item.pii === true && activeCookie == true) {
        setResponse(item.key, item.id, item.name, item.value || "No Value");
      } else if (item.pii === false) {
        setResponse(item.key, item.id, item.name, item.value || "No Value");
      } else {
        setResponse(item.key, item.id, item.name, "No Value");
      }
    }
    if (eventSnapShot) {
      const performanceObj = eventSnapShot?.data?._adobe_corpnew?.digitalData?.form?.performance;
      if (performanceObj) {
        for (let key in performanceObj) {
          if (
            performanceObj[key] === undefined ||
            performanceObj[key] === null ||
            performanceObj[key] === ""
          ) {
            delete performanceObj[key];
          }
        }
      }
      if (testRecord == true) {
        console.info(`${consoleLabel} - would have sent...`);
        console.info(JSON.stringify(eventSnapShot, undefined, 4));
        console.groupEnd();
        return;
      } else {
        console.info(`${consoleLabel} - sending`);
        console.info(JSON.stringify(eventSnapShot, undefined, 4));
      }
    } else {
      console.log(`${consoleLabel} - snapshot is empty`);
    }

    try {
      _satellite.track("event", eventSnapShot);
    } catch (error) {
      console.log(`${consoleLabel} - error`, error);
    }
    console.groupEnd();
  };
}

// ##
// ##
// ]]>