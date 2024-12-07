// ##
// ## Updated 20241118T184439
// ##
// ##
// ## Template Rules
// ##
// ##
if (typeof templateRules == "undefined") {
  var templateRules = [
    {
      request_for_information: {
        formVersion: [
          "2277: MCZ Production(2277)",
          // 1723:MCZ Staging (1723),
          // 2277: MCZ Production(2277),
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
      },
    },
    {
      trial: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      content_evaluate: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      webinar_virtual: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      strategy_webinar: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      content_explore: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      content_discover: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      subscribe: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      flex_contact: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      flex_event: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
      flex_content: {
        formVersion: ["2277: MCZ Production(2277)"],
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
      },
    },
    {
        subscription: {
          formVersion: ["2277: MCZ Production(2277)"],
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
        },
      },
  ];

  mkf_c.log("Template Rules - Loaded");
}

// ##
// ##