// <![CDATA[
// ##
// ## Updated 20250523T151657
// ##
// ##
// ##  Marketo Form Setup
// ##
// ##  This is the default data layer that will be used
// ##  if the data layer is not found or is incomplete
// ##
// ##

if (typeof window.mcz_marketoForm_pref_example == "undefined") {
  var mktoFrmLog = false;
  var mktoFrmLanaLogMasterSwitch = false; // Master switch for auto-Lana logging (warns/errors) via URL param.
  const mktoFrmLogLanaMethods = ["log", "info", "error", "warn"]; // Methods that can trigger Lana logging.
  const originalConsole = {
    log: console.log,
    info: console.info,
    table: console.table,
    error: console.error,
    warn: console.warn,
    group: console.group,
    groupEnd: console.groupEnd,
    groupCollapsed: console.groupCollapsed,
  };

  const mkf_c = {};
  const methods = ["log", "info", "table", "error", "warn", "group", "groupEnd", "groupCollapsed"];
  for (let method of methods) {
    mkf_c[method] = (...args) => {
      if (window.mktoFrmLog) {
        originalConsole[method].bind(console, ...args)();

        if (mktoFrmLogLanaMethods.includes(method)) {
          if (typeof window?.lana?.log === "function") {
            let lanaMessageParts = [];
            let lanaPayload = {};
            let this_method_lc = method.toLowerCase();

            args.forEach((arg) => {
              try {
                if (typeof arg === "string") {
                  lanaMessageParts.push(arg);
                } else if (arg instanceof Error && !lanaPayload.error) {
                  lanaPayload.error = arg;
                } else {
                  if (!lanaPayload.additionalData) {
                    lanaPayload.additionalData = [];
                  }
                  lanaPayload.additionalData.push(arg);
                }
              } catch (e) {
                originalConsole.warn("Error processing argument for Lana logging:", e, arg);
              }
            });

            let fullLanaMessage = lanaMessageParts.join(", ");

            // If master switch is on, auto-add #ll to warns/errors if not present.
            if (mktoFrmLanaLogMasterSwitch) {
              if (!fullLanaMessage.toLowerCase().includes("#ll")) {
                if (this_method_lc === "warn" || this_method_lc === "error") {
                  fullLanaMessage = fullLanaMessage + " #ll";
                }
              }
            }

            if (fullLanaMessage.toLowerCase().includes("#ll")) {
              if (typeof window?.mcz_marketoForm_pref?.logging !== "undefined") {
                window.mcz_marketoForm_pref.logging.lana_logging = true;
              }

              //Lana Log
              const lanaErrorType = method;
              let messageForLana = fullLanaMessage.replace(/#ll/gi, ""); // Remove #ll trigger tag.
              let tagComponents = new Set(["mktFrms"]);
              const extractedTagsRegex = /#\w+(-\w+)?/g;
              const tagsFound = messageForLana.match(extractedTagsRegex);
              if (tagsFound) {
                const cleanedExtractedTags = tagsFound.map((tag) => tag.replace("#", ""));
                cleanedExtractedTags.forEach((tag) => tagComponents.add(tag));
              }
              let lanaTags = Array.from(tagComponents).join(", ");
              messageForLana = messageForLana.replace(extractedTagsRegex, ""); // Remove content tags.
              messageForLana = messageForLana.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
              messageForLana = messageForLana.replace(/\s+/g, " ").trim();
              messageForLana = messageForLana.replace(/("|'|`)/g, "");
              let consoleLanaMessage = `%cMktoForm LanaLog: %c${messageForLana}`;
              originalConsole.groupCollapsed(
                consoleLanaMessage,
                "color: purple; font-weight: bold;",
                "color: black; font-weight: normal;"
              );
              originalConsole.log("Tags:", lanaTags);
              originalConsole.log("Payload:", lanaPayload);
              originalConsole.groupEnd();

              setTimeout(() => {
                try {
                  window.lana.log({
                    lanaPayload,
                    message: messageForLana,
                    tags: lanaTags,
                    errorType: lanaErrorType,
                  });
                } catch (e) {
                  originalConsole.warn("Error calling window.lana.log:", e);
                }
              }, 0);
            }
          }
        }
      }
    };
  }

  window.mktoFrmLog = mktoFrmLog;
  window.mkf_c = mkf_c;

  const currentUrl = window.location.href.toLowerCase();
  if (currentUrl.includes("preview=1")) {
    window.mktoFrmLog = true;
    if (currentUrl.includes("lana=1")) {
      mktoFrmLanaLogMasterSwitch = true;
      mkf_c.log(
        `%cTesting Detected - Logging Enabled with Lana Log (All Warns/Errors to Lana)`,
        "font-size: 1.2em; color: purple; font-weight: bold; "
      );
    } else {
      mkf_c.log(
        `%cTesting Detected - Logging Enabled. Add '&lana=1' to URL to send all Warns/Errors to Lana Log.`,
        "font-size: 1.2em; color: purple; font-weight: bold; "
      );
    }
  }
  //QA Form
  if (window?.mcz_marketoForm_pref?.form?.id == 1723) {
    window.mktoFrmLog = true;
    mkf_c.log(
      `%cQA Form Detected: ${window?.mcz_marketoForm_pref?.form?.id} - Logging Enabled`,
      "font-size: 1.2em; color: purple; font-weight: bold; "
    );
  }

  mkf_c.log("MCZ: Marketo Form Setup - Default Data Layer");

  window.mcz_marketoForm_pref_example = window.mcz_marketoForm_pref_example || [];
  window.mcz_marketoForm_pref_example = {
    performance: {
      currentTime: 0,
      currentTimeBucket: 0,
    },
    profile: {
      //Profile Settings
      prefLanguage: "", //Preferred Language from browser
      segLangCode: "", //Markto Segmentation Language
      known_visitor: false, //X,A,B,C - known visitor level
      unique_id: "", //Unique ID
      origin: "", //Origin of the Visitor
      scores: {
        data: "",
      },
    },
    form: {
      //form settings
      template: "content_discover",
      type: "marketo_form", //This is a Marketo Form default value
      subtype: "request_for_information", //see subtypeRules for examples
      success: {
        //success handling
        type: "", //redirect, message, none
        content: "", //redirect url, message, none
        delay: 5000, //delay in ms to wait for Marketo before fallback redirect
        confirm: false, //true,false - form is is ready for redirect
      },
      validation: {
        //see setup_process for more details
        cgen: {
          params: ["trackingid", "prid", "promoid", "sdid", "pss", "campaignid"],
          cookie: ["trackingid", "sdid", "promoid"],
        },
        //campaign specific field associations and value rules
        campaignid: {
          sfdc: {
            field: "mktoProductionCampaignId",
            status: "internal_Prod_Camp_Status",
            queryParam: "s_iid",
            cookie: "s_iid",
            critical: true,
            starts_with: ["7015", "7011", "701K"],
            min_length: 18,
            max_length: 18,
          },
          external: {
            field: "mktoExternalCampaignId",
            status: "External_Camp_Status",
            queryParam: "s_cid",
            cookie: "s_cid",
            critical: false,
            starts_with: ["7015", "7011", "701K"],
            min_length: 18,
            max_length: 18,
          },
          retouch: {
            field: "mktoRetouchCampaignId",
            status: "Retouch_Camp_Status",
            queryParam: "s_rtid",
            cookie: "s_rtid",
            critical: false,
            starts_with: ["7015", "7011", "701K"],
            min_length: 18,
            max_length: 18,
          },
          onsite: {
            field: "mktoOnsiteCampaignId",
            status: "Onsite_Camp_Status",
            queryParam: "s_osc",
            cookie: "s_osc",
            critical: false,
            starts_with: ["7015", "7011", "701K"],
            min_length: 18,
            max_length: 18,
          },
        },
      },
      subtypeRules: {
        //submit button verbs
        seminar: "register", // Online/Live Events
        nurture: "submit", // Nurturing Leads
        whitepaper_form: "submit", // Whitepaper Download
        webinar: "register",
        strategy_webinar: "register", // Strategy Webinar.
        demo: "submit",
        trial_download: "download", // Trial Download
        trial: "download", // Trial Download
        request_for_information: "submit", // Request for Information
        quote: "submit", // Quotation Request
        event_registration: "register", // Event Registration
        event_attendance: "register", // Event Activities
        content_explore: "submit", // Nurturing Leads
        content_discover: "submit", // Nurturing Leads
        content_evaluate: "submit", // Nurturing Leads
        flex_contact: "submit", //Request for Information
        flex_content: "submit", //Whitepaper Download
        flex_event: "register", //Strategy Webinar
        email: "join", // Subscriptions
      },
      templateVersions: {
        dme_flex_contact: "flex_contact",
        dme_flex_content: "flex_content",
        dme_flex_event: "flex_event",
        comb_flex_contact: "flex_contact",
        comb_flex_content: "flex_content",
        comb_flex_event: "flex_event",
      },
      subtypeTemplate: {
        //subtypes assigned to templates
        flex_contact: "request_for_information", //Request for Information
        flex_content: "whitepaper_form", //Whitepaper Download
        flex_event: "strategy_webinar", //Strategy Webinar
        content_explore: "whitepaper_form", // Nurturing Leads
        content_discover: "whitepaper_form", // Nurturing Leads
        content_evaluate: "whitepaper_form", // Nurturing Leads
        subscription: "email", //Subscriptions
      },
      mktoInstantInquiry: {
        //Trigger Inquiry from Person Activity Log (defaults to true)
        request_for_information: true,
        strategy_webinar: true,
        whitepaper_form: true,
        quote: true,
        demo: true,
        seminar: true,
        nurture: true,
        webinar: true,
        trial_download: true,
        trial: true,
        event_registration: true,
        event_attendance: true,
        content_explore: true,
        content_discover: true,
        content_evaluate: true,
      },
      logging: {
        enabled: true,
        lana_logging: false,
      },
      cta: {
        override: "", //will override all verbs for submit for all languages.
      },
      baseSite: "https://business.adobe.com",
      version: "25.05.23a",
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
        id: "",
        topics: [],
        segmentId: "",
        tags: [],
      },
      subscription: {
        //Subscription Definition
        type: "",
        name: "",
        id: "",
        topics: [],
        segmentId: "",
        tags: [],
      },
      marketo_asset: {
        name: "",
        id: "",
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
      products: "POI-Dxonly-area", //POI-Dxonly, hidden, all
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
        mktoOPContentSubscriptionName: "program.subscription.name",
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
      field_mapping_ac: {
        // Mkto field names to autocomplete tokens
        Email: "email",
        FirstName: "given-name",
        LastName: "family-name",
        Phone: "tel",
        mktoFormsJobTitle: "organization-title",
        mktoFormsCompany: "organization",
        Country: "country",
        State: "address-level1",
        PostalCode: "postal-code",
      },
    },
  };
}
// ##
// ##

// ##
// ##
// ]]>