// <![CDATA[
// ##
// ## Updated 20240606T172942
// ##
// ##
// ##
// ## Adobe Analytics - Form Interactions
// ##
// ##
// ##

if (typeof aaInteraction != "function") {
  mkf_c.log("Adobe Analytics - Triggered");

  window.addEventListener("alloy_sendEvent", function (ev) {
    if (
      ev.detail?.event?.data?.web?.webInteraction?.name === "Marketo Form Submission" ||
      ev.detail?.event?.data?.web?.webInteraction?.name === "Marketo Form Prefill"
    ) {
      mkf_c.log("formSubmission event was received");
      MktoForms_onSuccess();
    }
  });
  var markerNo = 0;
  var aaInteractionsActive = false;
  window.aaInteraction = async function (eventName, eventAction, formid, currentTime = 0) {
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

    mkf_c.groupCollapsed(`${consoleLabel} - ${eventName}`);
    if (typeof mcz_marketoForm_pref != "object") {
      mkf_c.log("AA ERROR >> mcz_marketoForm_pref is not found.");
      error_aa = true;
    }
    if (!window.marketingtech || !window.marketingtech.adobe || !window.marketingtech.adobe.alloy) {
      mkf_c.log("AA ERROR >> alloy is not found.");
      error_aa = true;
    }
    if (mcz_marketoForm_pref && mcz_marketoForm_pref.form && mcz_marketoForm_pref.form.subtype) {
      formType = mcz_marketoForm_pref.form.subtype;
    }
    if (!window.alloy) {
      error_aa = true;
      mkf_c.log("AA ERROR >> primary alloy is not found.");
    }
    if (!window.alloy_all) {
      error_aa = true;
      mkf_c.log("AA ERROR >> primary alloy_all is not found.");
    }
    if (!window.digitalData) {
      error_aa = true;
      mkf_c.log("AA ERROR >> digitalData DL is not found.");
    }

    if (error_aa == true) {
      if (testRecord == false) {
        mkf_c.log(`${consoleLabel} - error`);
        mkf_c.groupEnd();
        return;
      } else {
        mkf_c.log(`${consoleLabel} - error, but will continue to build aa event record.`);
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
      if (
        currentTime == 0 ||
        currentTime == undefined ||
        currentTime == null ||
        isNaN(currentTime)
      ) {
        currentTime = Math.round(entry.duration);
      }
      currentTimeBucket = Math.round(currentTime / 500) * 500;
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
                //Interaction ID unique to each form load on the page
                interactionID: unique_id,
                interactionType: eventAction,
                interactionName: eventName,

                //Form Version, Form Type
                frmID: mkto_formID, //form type
                frmType: window?.mcz_marketoForm_pref?.form?.subtype, //form type
                frmTemplate: window?.mcz_marketoForm_pref?.form?.template, //form template
                frmVersion: window?.mcz_marketoForm_pref?.form?.version, //form version
                frmTriggerIA: window?.mcz_marketoForm_pref?.profile?.mktoInstantInquiry, //instant inquiry

                //LandingPage
                lpType: window?.mcz_marketoForm_pref?.landingPage?.type, //landing page type
                lpVersion: window?.mcz_marketoForm_pref?.landingPage?.version, //landing page version

                //Form Fields Count, Required Fields Count, First Field Focus Interaction
                fldsCount: formfieldsVis,
                fldsCountReq: formfieldsVisReq,
                fldsFirstAction: window?.mcz_marketoForm_pref?.profile?.first_field,

                //Field Visibility Settings
                fldName: window?.mcz_marketoForm_pref?.field_visibility?.name,
                fldCompany: window?.mcz_marketoForm_pref?.field_visibility?.company,
                fldPhone: window?.mcz_marketoForm_pref?.field_visibility?.phone,
                fldComments: window?.mcz_marketoForm_pref?.field_visibility?.comments,
                fldDemo: window?.mcz_marketoForm_pref?.field_visibility?.demo,
                fldState: window?.mcz_marketoForm_pref?.field_visibility?.state,
                fldPostCode: window?.mcz_marketoForm_pref?.field_visibility?.postcode,
                fldCompanySize: window?.mcz_marketoForm_pref?.field_visibility?.company_size,
                fldWebsite: window?.mcz_marketoForm_pref?.field_visibility?.website,

                //Form Field Value Filters
                fldFilterProductInterest: window?.mcz_marketoForm_pref?.field_filters?.products,
                fldFilterIndustry: window?.mcz_marketoForm_pref?.field_filters?.industry,
                fldFilterJobRole: window?.mcz_marketoForm_pref?.field_filters?.job_role,
                fldFilterFunctionalArea:
                  window?.mcz_marketoForm_pref?.field_filters?.functional_area,

                //Campaign IDs and Positions specific to the form
                coFunnelPos: "unknown",
                coProductInterest: window?.mcz_marketoForm_pref?.program?.poi,
                coIdSFDC: window?.mcz_marketoForm_pref?.program?.campaignids?.sfdc, //Salesforce Campaign ID
                coIdExternal: window?.mcz_marketoForm_pref?.program?.campaignids?.external, //External Campaign ID
                coIdRetouch: window?.mcz_marketoForm_pref?.program?.campaignids?.retouch, //Retouch Campaign ID
                coIdOnsite: window?.mcz_marketoForm_pref?.program?.campaignids?.onsite, //Onsite Campaign ID
                coIdCGEN: window?.mcz_marketoForm_pref?.program?.campaignids?.cgen, //CGEN ID
                coIdCUID: window?.mcz_marketoForm_pref?.program?.campaignids?.cuid, //CUID ID
                coIdGCLID: window?.mcz_marketoForm_pref?.program?.campaignids?.gclid, //GCLID ID

                //Profile & Session specific data
                prfGUID: window?.mcz_marketoForm_pref?.profile?.guid, //Adobe GUID
                prfECID: window?.mcz_marketoForm_pref?.profile?.ecid, //Adobe Experience ECID
                prfCGEN: window?.mcz_marketoForm_pref?.profile?.cgen, //CGEN IDs on Session
                prfLeadID: window?.mcz_marketoForm_pref?.profile?.lead_id, //Marketo Lead ID
                prfScoreData: window?.mcz_marketoForm_pref?.profile?.scores?.data, //Marketo Data Score
                prfCOAID: window?.mcz_marketoForm_pref?.profile?.acc?.coaid, //Marketo Account Segment Name
                prfIndustry: window?.mcz_marketoForm_pref?.profile?.acc?.industry, //Marketo Account industry Segment Name
                prfCreated: window?.mcz_marketoForm_pref?.profile?.created, //Profile Created Date
                prfLang: window?.mcz_marketoForm_pref?.profile?.prefLanguage, //preferred language
                prfKnown: window?.mcz_marketoForm_pref?.profile?.known_visitor, //known visitor to Marketo
                prfOrigin: window?.mcz_marketoForm_pref?.profile?.origin, //origin of the visitor
                prfPrivacyID: window?.mcz_marketoForm_pref?.profile?.privacy?.code, //privacy text ID
                prfPrivacyStyle: window?.mcz_marketoForm_pref?.profile?.privacy_optin, //privacy style
                prfTest: window?.mcz_marketoForm_pref?.profile?.testing, //Test Record

                //Timecodes, current ms since page load, bucketed to 500ms
                tMS: window?.mcz_marketoForm_pref?.performance?.currentTime,
                tB500: window?.mcz_marketoForm_pref?.performance?.currentTimeBucket,
                tDateTime: new Date().toISOString(),
              },
            },
          },
        },
      },
    };

    const setResponse = (name, value) => {
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
      eventSnapShot.data._adobe_corpnew.digitalData.form.response[name] = value;
    };

    let demandbaseTracker =
      formValues.mktodemandbaseTracker === "success"
        ? "yes"
        : formValues.mktodemandbaseTracker === "failure"
        ? "no"
        : "No Value";

    let emailDomain =
      formValues.Email && formValues.Email.includes("@")
        ? formValues.Email.substring(formValues.Email.lastIndexOf("@") + 1)
        : "";

    const responseItems = [
      {
        key: "interactionID",
        value: unique_id,
        pii: false,
      },
      {
        key: "domain",
        value: emailDomain,
        pii: true,
      },
      {
        key: "organizationName",
        value: formValues.mktoFormsCompany,
        pii: true,
      },
      {
        key: "website",
        value: formValues.mktodemandbaseWebsite,
        pii: true,
      },
      {
        key: "jobTitle",
        value: formValues.mktoFormsJobTitle,
        pii: true,
      },
      {
        key: "industry",
        value: formValues.mktodemandbaseIndustry,
        pii: false,
      },
      {
        key: "functionalArea",
        value: formValues.mktoFormsFunctionalArea,
        pii: false,
      },
      {
        key: "orgType",
        value: formValues.mktoFormsCompanyType,
        pii: false,
      },
      {
        key: "productInterest",
        value: formValues.mktoFormsPrimaryProductInterest,
        pii: false,
      },
      {
        key: "isProductDemoChecked",
        value: formValues.mktoRequestProductDemo,
        pii: false,
      },
      {
        key: "isDemandBaseWidgetLoaded",
        value: demandbaseTracker,
        pii: false,
      },
    ];
    if (eventAction === "formSubmission") {
      responseItems.push({
        key: "submissionID",
        value: unique_id,
        pii: false,
      });
    }
    for (let item of responseItems) {
      if ((item.pii === true && activeCookie == true) || item.pii === false) {
        setResponse(item.key, item.value || "No Value");
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
        mkf_c.info(`${consoleLabel} - would have sent...`);
        mkf_c.info(JSON.stringify(eventSnapShot, undefined, 4));
        mkf_c.groupEnd();
        return;
      } else {
        mkf_c.info(`${consoleLabel} - sending`);
        mkf_c.info(JSON.stringify(eventSnapShot, undefined, 4));
      }
    } else {
      mkf_c.log(`${consoleLabel} - snapshot is empty`);
    }

    try {
      _satellite.track("event", eventSnapShot);
    } catch (error) {
      mkf_c.log(`${consoleLabel} - error`, error);
    }
    mkf_c.groupEnd();
  };
}

// ##
// ##
// ]]>