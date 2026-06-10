// ##
// ## Updated 20251124T120556
// ##
// ##
// ##
// ## 20_template_manager/template_rules.js - 20251124T120556
// ##
// ##
if (typeof templateRules == "undefined") {
  //sets the default version of form to use for these templates
  const templateVersion = "1723:MCZ Staging (1723)";

  //not used yet.
  const AUTO_COMPLETE_FIELDS = [
    "Email",
    "FirstName",
    "LastName",
    "Phone",
    "mktoFormsJobTitle",
    "mktoFormsCompany",
    "Country",
    "State",
    "PostalCode",
  ];

  var templateRules = [
    {
      request_for_information: {
        formVersion: [
          templateVersion,
          // 3308:MCZ Staging (3308)- progressive testing

          // 1723:MCZ Staging (1723),
          // 2277:MCZ Production(2277),
          // 2259:MCZ Short Form (2259),
          //
        ],
        purpose: ["request_for_information:Request for Information (request_for_information)"],
        // whitepaper_form:Whitepaper Download (whitepaper_form),
        // nurture: Nurturing Leads(nurture),
        // strategy_webinar: Strategy Webinar(strategy_webinar),
        // seminar: Online / Live Events(seminar),
        // trial_download: Trial Download(trial_download),
        // request_for_information: Request for Information(request_for_information),
        // quote: Quotation Request(quote),
        // event_registration: Event Registration(event_registration),
        // event_attendance: Event Activities(event_attendance)
        //
        // content_discover
        // content_explore
        // content_evaluate
        //
        formSuccessType: ["redirect:redirect (redirect)"],
        // redirect:redirect (redirect),
        // message:message (message),
        // email:email (email),none:none (none)
        //
        //
        field_visibility: {
          name: ["required:Make Required (required)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          //
          phone: ["required:Make Required (required)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          company: ["required:Make Required (required)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          website: ["hidden:Hide Field (hidden)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          state: ["required:Make Required (required)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          postcode: ["required:Make Required (required)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          company_size: ["hidden:Hide Field (hidden)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          // required:Make Required (required)
          //
          comments: ["hidden:Hide Field (hidden)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          //
          demo: ["hidden:Hide Field (hidden)"],
          // hidden:Hide Field (hidden),
          // visible:Show Field (visible),
          //
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          // hidden:Hide Field (hidden),
          // all: Show All Options(all),
          // Functional Area- DX:
          // DX Specific Options(Functional Area- DX)
          //
          //
          products: ["POI-Dxonly:DX Products (POI-Dxonly)"],
          // hidden:Hide Field (hidden),
          // all:Show All Products (all),
          // POI-Dxonly:DX Products (POI-Dxonly),
          // POI-Dxonly-area:DX Products as Area of Interest (POI-Dxonly-area)
          //
          //
          industry: ["hidden:Hide Field (hidden)"],
          // hidden:Hide Field (hidden),
          // all:Show Field (all),
          // Industry-Gov-Edu:Gov Education (Industry-Gov-Edu),
          // Industry-Edu:Education (Industry-Edu),
          // Industry-Finance:Finance (Industry-Finance),
          // Industry-Manufacturing:Manufacturing (Industry-Manufacturing)
          //
          //
          job_role: ["DX:DX Specific Roles (DX)"],
          // hidden:Hide Field (hidden),
          // all:Show All Options (all),
          // DX:DX Specific Roles (DX),
          // Job Role-HiLevel:High Level Job Roles Only (Job Role-HiLevel),
          // DX-Gov:Government Roles (DX-Gov)
          //
          //
        },
        program_id: "", //default program id for program detail sync if one isn't provided
        auto_complete: AUTO_COMPLETE_FIELDS, //future controls
        progressive: true, //will sync program details prior to showing the form
        known_visitor: true, //pre-fills the form with the known profile from the session and Marketo known visitor
        polling: true, //syncs program membership status with Marketo
        autoSuccess: true, //if the form has been submitted it will automatically show the success message and fire analytics event
        autoSuccessTimeFrameDays: 30, //if the form with the program id was submiited within last days it will set to auto success
        multi_step: {
          active: false, //will put form fields on to step pages based on visibility and rules below.
          steps: [
            {
              step_lbl: "Step 1",
              description: "Contact Fields",
              fields: ["email", "country"],
            },
            {
              step_lbl: "Step 2",
              description: "Comnpany Fields",
              fields: ["name", "phone", "mktoFormsJobTitle", "mktoFormsFunctionalArea"],
            },
            {
              step_lbl: "Step 3",
              description: "Request Fields",
              fields: [
                "company",
                "state",
                "postcode",
                "mktoFormsPrimaryProductInterest",
                "mktoFormsCompanyType",
              ],
            },
          ],
        },
      },
    },
    {
      trial: {
        formVersion: [templateVersion],
        purpose: ["trial_download:Trial Download (trial_download)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      content_evaluate: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      webinar_virtual: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      strategy_webinar: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      content_explore: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      content_discover: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["hidden:Hide Field (hidden)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      subscribe: {
        formVersion: [templateVersion],
        purpose: ["subscribe:Subscribe"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["hidden:Hide Field (hidden)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      flex_contact: {
        formVersion: [templateVersion],
        purpose: ["request_for_information:Request for Information (request_for_information)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["POI-Dxonly:DX Products (POI-Dxonly)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "92815",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
      },
    },
    {
      flex_event: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DX:DX Specific Options (Functional Area-DX)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DX:DX Specific Roles (DX)"],
        },
        program_id: "92816",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      flex_content: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "92814",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: true,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      dme_flex_contact: {
        formVersion: [templateVersion],
        purpose: ["request_for_information:Request for Information (request_for_information)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DMe:DMe Specific Options (Functional Area-DMe)"],
          products: ["POI-DMe:DMe Products (POI-DMe)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DMe:DMe Specific Roles (DMe)"],
        },
        program_id: "92815",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
      },
    },
    {
      dme_flex_event: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["Functional Area-DMe:DMe Specific Options (Functional Area-DMe)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["DMe:DMe Specific Roles (DMe)"],
        },
        program_id: "92816",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      dme_flex_content: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "92814",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      comb_flex_contact: {
        formVersion: [templateVersion],
        purpose: ["request_for_information:Request for Information (request_for_information)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["required:Make Required (required)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["required:Make Required (required)"],
          postcode: ["required:Make Required (required)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: [
            "Functional Area-Combined:DMe & DX Combined Options (Functional Area-Combined)",
          ],
          products: ["POI-Combined:DMe & DX Combined Products (POI-Combined)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["Combined:DMe & DX Combined Roles (Combined)"],
        },
        program_id: "92815",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
      },
    },
    {
      comb_flex_event: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: [
            "Functional Area-Combined:DMe & DX Combined Options (Functional Area-Combined)",
          ],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["Combined:DMe & DX Combined Roles (Combined)"],
        },
        program_id: "92816",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      comb_flex_webinar: {
        formVersion: [templateVersion],
        purpose: ["strategy_webinar:Strategy Webinar (strategy_webinar)"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: [
            "Functional Area-Combined:DMe & DX Combined Options (Functional Area-Combined)",
          ],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["Combined:DMe & DX Combined Roles (Combined)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      comb_flex_content: {
        formVersion: [templateVersion],
        purpose: ["whitepaper_form:Whitepaper Download"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["required:Make Required (required)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "92814",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
    {
      subscription: {
        formVersion: [templateVersion],
        purpose: ["subscription:Subscription"],
        formSuccessType: ["redirect:redirect (redirect)"],
        field_visibility: {
          name: ["required:Make Required (required)"],
          phone: ["hidden:Hide Field (hidden)"],
          company: ["hidden:Hide Field (hidden)"],
          website: ["hidden:Hide Field (hidden)"],
          state: ["hidden:Hide Field (hidden)"],
          postcode: ["hidden:Hide Field (hidden)"],
          company_size: ["hidden:Hide Field (hidden)"],
          comments: ["hidden:Hide Field (hidden)"],
          demo: ["hidden:Hide Field (hidden)"],
        },
        field_filters: {
          functional_area: ["hidden:Hide Field (hidden)"],
          products: ["hidden:Hide Field (hidden)"],
          industry: ["hidden:Hide Field (hidden)"],
          job_role: ["hidden:Hide Field (hidden)"],
        },
        program_id: "",
        auto_complete: AUTO_COMPLETE_FIELDS,
        progressive: true,
        known_visitor: true,
        polling: true,
        autoSuccess: false,
        autoSuccessTimeFrameDays: 30,
      },
    },
  ];

  mkf_c.log("Template Rules - Loaded");
}

// ##
// ##
