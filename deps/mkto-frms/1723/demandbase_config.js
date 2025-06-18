// <![CDATA[
// ##
// ## Updated 20250407T151931
// ##
(async function () {
  //
  // Demandbase Module Config.
  //
  let serviceName = "DEMANDBASE";
  if (
    window?.mcz_marketoForm_pref?.form?.enrichment?.[serviceName]?.setup?.apiKey
  ) {
    mkf_c.info(`${serviceName}: Already defined. Finished.`);
    return;
  }
  mkf_c.info(`${serviceName} Module Config.`);

  let config = {
    setup: {
      apiKey: "LDHxBA8hUB2yNQphwwEfblkR6cHtp1tmrI2XGG2s", //L1UK2I3ab4x73BaQuQCNbIoPEUegd310qpmKin4h < old version?
      clientId: "179983c41a6e349c",
      // API URLs for each type of query.
      apiUrl: {
        ip: "https://api.company-target.com/api/v3/ip.json",
        domain: "https://api.company-target.com/api/v3/domain.json",
        company: "https://api.company-target.com/autocomplete",
      },
      //
      // AutoComplete Settings.
      //
      autoComplete: {
        session: new Date().getTime() + "" + Math.random(),
        //This is max limit defined by DB.
        recordCount: 100,
        recordShow: 10,
        // The order is determined by the number.
        // Example: "Adobe, US, San Jose, CA"
        //           1.     2.  3.        4.
        autocompleteLabel: {
          marketing_alias: 1,
          country: 2,
          city: 3,
          state: 4,
        },
        // Features used to help improve suggestions provided to the user.
        fieldSuggestionImprovements: [
          //
          // These will use push suggestions to the top of the list.
          "company_name",
          // that matches the domain of the email.
          "domain",
          // When company is located in the same country as the user.
          "country",
          // and if state is known include that in the location match.
          "state",
          // Suggestions will be sorted by annual sales value.
          "annual_sales",
          // Suggestions will be sorted by employee count.
          "employee_count",
        ],
        //
        // The name of the session variable that contains the locale.
        localeSessionVar: "akamaiLocale",
        // Marketo field name values for important fields used to build the suggestion features.
        emailInputName: "Email",
        companyInputName: "mktoFormsCompany",
        stateInputName: "State",
      },
      priorityMap: {
        ip: 1,
        company: 2,
        domain: 3,
      },
      // Detail returned for each type of query.
      information_level: {
        ip: "Detailed",
        domain: "Detailed",
        company: "Detailed",
      },
      // DB Fields are mapped to the Marketo Form Fields,
      fieldMap: {
        company_id: "mktoDemandbaseCompanyID",
        marketing_alias: "mktoFormsCompany",
        company_name: "mktodemandbasePublicCompanyName",
        sub_industry: "mktodemandbaseIndustry",
        primary_sic: "mktodemandbaseSICCode",
        street_address: "Address",
        city: "City",
        state: "State",
        zip: "PostalCode",
        country: "Country",
        phone: "mktodemandbasephone",
        web_site: "mktodemandbaseWebsite",
        annual_sales: "mktodemandbaseAnnualRevenue",
        employee_count: "mktoDemandbaseEmployeeRange",
        employee_count: "mktodemandbaseNumberofEmployees",
      },
      nullFields: {
        mktodemandbasePublicCompanyName: true,
        mktodemandbaseIndustry: true,
        mktodemandbaseSICCode: true,
        mktodemandbasephone: true,
        mktodemandbaseWebsite: true,
        mktodemandbaseAnnualRevenue: true,
        mktoDemandbaseEmployeeRange: true,
        mktodemandbaseNumberofEmployees: true,
      },
    },
    rawData: null,
    performance: {
      requestSRC: null,
      totalWaitMS: null,
      averageWaitMS: null,
      lowestWaitMS: null,
      highestWaitMS: null,
      totalRequests: 0,
      fld_mktoFormsEnrichmentPerformance: "mktoFormsEnrichmentPerformance",
      fld_mktoFormsEnrichmentFlatData: "mktoFormsEnrichmentFlatData",
    },
  };

  //
  // Don't change below code.
  //
  let mcz_marketoForm_pref = window?.mcz_marketoForm_pref || {};
  mcz_marketoForm_pref.form = window?.mcz_marketoForm_pref?.form || {};
  mcz_marketoForm_pref.form.enrichment =
    window.mcz_marketoForm_pref?.form?.enrichment || {};
  mcz_marketoForm_pref.form.enrichment[serviceName] =
    window.mcz_marketoForm_pref?.form?.enrichment[serviceName] || {};
  mcz_marketoForm_pref.form.enrichment[serviceName] = config;
})();

// ##
// ##
// ]]>