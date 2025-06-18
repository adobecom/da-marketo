// <![CDATA[
// ##
// ## Updated 20250218T201303
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
      }
    };
  }

  window.mktoFrmLog = mktoFrmLog;
  window.mkf_c = mkf_c;

  const currentUrl = window.location.href;
  if (window.location.href.toLowerCase().indexOf("preview=1") > -1) {
    window.mktoFrmLog = true;
    mkf_c.log(
      `%cTesting Detected - Logging Enabled`,
      "font-size: 1.2em; color: purple; font-weight: bold; "
    );
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
      fldStepPref: {
        1: ["FirstName", "LastName", "Email", "Phone", "Company", "Country", "State", "PostalCode"],
        2: [
          "mktoFormsJobTitle",
          "mktoFormsCompany",
          "mktoFormsFunctionalArea",
          "mktoFormsRevenue",
          "mktoFormsEmployeeRange",
        ],
        3: ["mktoFormsPrimaryProductInterest", "mktoFormsComments", "mktoRequestProductDemo"],
      },
      logging: {
        enabled: true,
      },
      baseSite: "https://business.adobe.com",
      version: "24.06.06a",
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
// ]]>