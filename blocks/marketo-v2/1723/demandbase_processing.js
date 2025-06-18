// <![CDATA[
// ##
// ## Updated 20250508T212339
// ##
// ##
// ## Demandbase Module Processing
// ##
(async function () {
  //
  // Remove "//" before "return;" below to bypass Demandbase
  // return;
  //
  //
  //
  //
  //
  //
  //
  let serviceName = "DEMANDBASE";
  if (window?.mcz_marketoForm_pref?.form?.enrichment?.[serviceName]?.setup?.processing) {
    mkf_c.info(`${serviceName}: Already defined. Finished.`);
    return;
  }
  mkf_c.info(`${serviceName} Enrichment Processing Module.`);
  const serviceVersion = "1.0.0";
  const serviceAuthor = "MCZ";
  const serviceDescription = "Demandbase Module";

  let mcz_marketoForm_pref = window?.mcz_marketoForm_pref || {};
  mcz_marketoForm_pref.form = window?.mcz_marketoForm_pref?.form || {};
  mcz_marketoForm_pref.form.enrichment = window.mcz_marketoForm_pref?.form?.enrichment || {};
  mcz_marketoForm_pref.form.enrichment[serviceName] =
    mcz_marketoForm_pref?.form?.enrichment[serviceName] || {};
  mcz_marketoForm_pref.form.enrichment[serviceName].setup =
    mcz_marketoForm_pref?.form?.enrichment[serviceName]?.setup || {};
  mcz_marketoForm_pref.form.enrichment[serviceName].setup.processing = {
    version: serviceVersion,
    author: serviceAuthor,
    description: serviceDescription,
  };

  let iOSVersion = null;
  if (navigator.userAgent.match(/Safari/i)) {
    const iOSVersionMatch = navigator.userAgent.match(/Version\/(\d+)/i);
    if (iOSVersionMatch) {
      iOSVersion = +iOSVersionMatch[1];
    }

    if (iOSVersion > 0) {
      const formNode = document.querySelectorAll(".mktoForm");
      formNode.forEach((node) => {
        node.classList.add("mktofrm_ios", `mktofrm_ios${iOSVersion}`);
      });
    }
  }
  mkf_c.log(`${serviceName}: [iOSVersion]`, iOSVersion);

  let lastReqQuery = "";
  let domainLookups = {};
  let mcz_dl = mcz_marketoForm_pref.form.enrichment[serviceName];
  let moduleDB = (reqServicePref = "", reqQuery = "", provided = "", fillform = false) => {
    return new Promise((resolve, reject) => {
      let refreshData = false;
      if (reqQuery) {
        reqQuery = reqQuery.trim();
      }
      if (reqQuery && lastReqQuery != reqQuery) {
        refreshData = true;
      }
      try {
        let cachedData;
        if (provided && typeof provided === "object") {
          cachedData = JSON.stringify(provided);
          if (reqServicePref == "provided") {
            refreshData = false;
          }
        } else {
          if (reqServicePref == "provided") {
            refreshData = true;
            reqServicePref = "";
          }
          if (reqServicePref == "domain") {
            refreshData = true;
            reqQuery = reqQuery.trim();

            if (domainLookups[reqQuery]) {
              //mkf_c.log(
              //  `${serviceName}: Domain lookup already in progress, skipping`
              //);
              return;
            } else {
              domainLookups[reqQuery] = true;
            }
          }
        }
        if (refreshData == false) {
          let parsedData = null;

          if (!cachedData || cachedData.length == 0) {
            //mkf_c.log(
            //  `${serviceName}: No cached data found, checking localStorage`
            //);
            cachedData = localStorage.getItem(`MCZ_${serviceName}_DATA`);
            mcz_dl.performance.requestSRC = "LOCALSTORAGE";
            //mkf_c.log(`${serviceName}: LOCALSTORAGE data:`, cachedData);
          } else {
            //mkf_c.log(`${serviceName}: Cached data found, using cached data`);
            mcz_dl.performance.requestSRC = "SUGGESTED";
            //mkf_c.log(`${serviceName}: SUGGESTED data:`, cachedData);
          }
          if (cachedData && cachedData.length > 0) {
            parsedData = JSON.parse(cachedData);
          }
          if (parsedData) {
            mcz_dl.rawData = parsedData;
            const processed = moduleDbProcess(parsedData, fillform, reqServicePref);

            //mkf_c.log(
            //  `${serviceName}: Processed data (${mcz_dl.performance.requestSRC}):`,
            //  processed
            //);
            return;
          }
        }
      } catch (error) {
        mkf_c.warn(`${serviceName}: Error reading from localStorage:`, error);
        refreshData = true;
      }

      let servicePrefList = mcz_dl.setup?.priorityMap || [];

      if (!servicePrefList) {
        reject(new Error(`${serviceName}: No service preference defined`));
        return;
      }

      if (reqServicePref) {
        if (servicePrefList[reqServicePref.toLowerCase().trim()]) {
          if (reqServicePref == "domain") {
            if (reqQuery) {
              if (!reqQuery || reqQuery.length < 3) {
                mkf_c.info(
                  `${serviceName}: Domain query is less than 3 characters, defaulting to IP`
                );
                reqServicePref = "ip";
              }
            } else {
              mkf_c.info(`${serviceName}: Domain query is empty, defaulting to IP`);
              reqServicePref = "ip";
            }
          }
        }
      }
      if (!reqServicePref) {
        reject(new Error(`${serviceName}: No service preference defined`));
        return;
      }

      const random = Math.floor(Math.random() * 10000000);
      const callbackName = `demandbaseCallback_${random}`;
      const key = mcz_dl.setup?.apiKey;
      const apiUrl = mcz_dl.setup?.apiUrl?.[reqServicePref];
      const informationLevel = mcz_dl.setup?.informationLevel?.[reqServicePref] || "Basic";

      if (!key) {
        reject(new Error(`${serviceName}: No API Key defined`));
        return;
      }
      if (!apiUrl) {
        reject(new Error(`${serviceName}: No API URL defined`));
        return;
      }

      if (!reqQuery) {
        reject(new Error(`${serviceName}: No query defined`));
        return;
      }

      let finalUrl = `${apiUrl}?key=${key}&rnd=${random}&callback=${callbackName}&query=${reqQuery}&informationLevel=${informationLevel}`;
      mkf_c.log(`${serviceName}: Service URL:`, finalUrl);

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.id = `demandbaseScript_${random}`;
      script.async = true;
      script.src = finalUrl;

      const cleanup = (callbackName) => {
        try {
          delete window[callbackName];
          document.head.removeChild(script);
        } catch (error) {
          window[callbackName] = undefined;
          mkf_c.error(`${serviceName}: Cleanup error:`, error);
        }
      };

      mcz_dl.callbackRef = mcz_dl.callbackRef || {};
      mcz_dl.callbackRef[callbackName] = {
        completed: false,
        fillform: fillform,
        reqServicePref: reqServicePref,
        data: null,
        error: null,
        startTime: new Date(),
        endTime: null,
        duration: null,
      };

      window[callbackName] = (data) => {
        mkf_c.log(`\n\n\n\n\n${serviceName}: cb:${callbackName} - START`);
        if (mcz_dl.callbackRef[callbackName]?.completed == true) {
          mkf_c.log(`${serviceName}: cb:${callbackName} - Already completed`);
          return;
        }
        if (!data) {
          mcz_dl.callbackRef[callbackName].error = "No data received";
          mcz_dl.callbackRef[callbackName].endTime = new Date();
          mcz_dl.callbackRef[callbackName].duration =
            mcz_dl.callbackRef[callbackName].endTime - mcz_dl.callbackRef[callbackName].startTime;
          mcz_dl.callbackRef[callbackName].completed = true;
          return;
        }
        mcz_dl.callbackRef[callbackName].endTime = new Date();
        mcz_dl.callbackRef[callbackName].duration =
          mcz_dl.callbackRef[callbackName].endTime - mcz_dl.callbackRef[callbackName].startTime;
        mcz_dl.callbackRef[callbackName].completed = true;
        let fillform = mcz_dl.callbackRef[callbackName]?.fillform || false;
        let reqServicePref = mcz_dl.callbackRef[callbackName]?.reqServicePref || null;

        mkf_c.log(`${serviceName}: cb:${callbackName} - Data:`, data);
        mkf_c.log(`${serviceName}: cb:${callbackName} - Fill Form:`, fillform);
        mkf_c.log(`${serviceName}: cb:${callbackName} - Service Pref:`, reqServicePref);

        if (data) {
          if (Object.keys(data).length == 1 && data?.domain) {
            data = data.domain;
          }
          perfData = mcz_dl.performance || {};
          perfData.requestEndTime = new Date();
          perfData.requestWaitMS = perfData.requestEndTime - perfData.requestStartTime;
          perfData.lastEndTime = new Date();
          perfData.lastWaitMS = perfData.lastEndTime - perfData.lastStartTime;
          perfData.totalRequests++;

          perfData.totalWaitMS += perfData.lastWaitMS;
          perfData.averageWaitMS = perfData.totalWaitMS / perfData.totalRequests;
          if (perfData.lowestWaitMS == null || perfData.lastWaitMS < perfData.lowestWaitMS) {
            perfData.lowestWaitMS = perfData.lastWaitMS;
          }
          if (perfData.highestWaitMS == null || perfData.lastWaitMS > perfData.highestWaitMS) {
            perfData.highestWaitMS = perfData.lastWaitMS;
          }
          perfData.requestSRC = "SERVER";
          localStorage.setItem(`MCZ_${serviceName}_DATA`, JSON.stringify(data));
          lastReqQuery = reqQuery;
          mcz_dl.rawData = data;
          mcz_dl.performance = perfData;
          mcz_dl.performance.requestSRC = "SERVER";

          try {
            //use later
          } catch (error) {
            mkf_c.warn(`${serviceName}: Error saving to localStorage:`, error);
          }

          mkf_c.log(`${serviceName}: cb:${callbackName} - Data:`, data);
          mkf_c.log(`${serviceName}: cb:${callbackName} - Fill Form:`, fillform);
          mkf_c.log(`${serviceName}: cb:${callbackName} - Service Pref:`, reqServicePref);
          const processed = moduleDbProcess(data, fillform, reqServicePref);
          mkf_c.log(
            `${serviceName}: Processed data (${mcz_dl.performance.requestSRC}):`,
            processed
          );
          cleanup(callbackName);
        } else {
          cleanup(callbackName);
          reject(new Error(`${serviceName}: No data received from ${serviceName}`));
        }
      };

      script.onerror = () => {
        cleanup(callbackName);
        reject(new Error(`${serviceName}: Failed to load ${serviceName} script`));
      };

      document.head.appendChild(script);
      mcz_dl.performance.requestStartTime = new Date();
    });
  };
  let moduleDbProcess = (data, fillform = false, reqServicePref = null) => {
    //mkf_c.log(`${serviceName}: moduleDbProcess - ${fillform} - Data:`, data);
    //mkf_c.log(`${serviceName}: moduleDbProcess - Fill Form:`, fillform);
    //mkf_c.log(
    //  `${serviceName}: moduleDbProcess - Service Pref:`,
    //  reqServicePref
    //);
    if (!data || !Object.keys(data).length) {
      //mkf_c.log(`${serviceName}: No data to process.`);
      return;
    }

    const flattenedData = flattenData(data);
    const fieldMappedData = mapFieldsToForm(flattenedData);

    mcz_dl.performance.requestEndTime = new Date();
    mcz_dl.performance.requestSpeedMS =
      mcz_dl.performance.requestEndTime - mcz_dl.performance.lastStartTime;

    if (fillform) {
      mcz_dl.rawData = data;
      mcz_dl.fieldMappedData = fieldMappedData;
      mcz_dl.flattenedData = flattenedData;
      enrichForm(mcz_dl.fieldMappedData, reqServicePref);
    } else {
      if (reqServicePref == "domain") {
        enrichForm(mcz_dl.fieldMappedData, reqServicePref);
      }
    }
    return mcz_dl;
  };

  let lastEnrichedFieldSet = [];
  let enrichForm = (data, reqServicePref = null) => {
    if (!data || !Object.keys(data).length) {
      mkf_c.log(`${serviceName}: enrichForm - No data to fill form.`);
      return;
    }
    let formId = getMktoFormID();
    if (!formId) {
      mkf_c.log(`${serviceName}: enrichForm - Form ID not found.`);
      return;
    }
    let form = MktoForms2?.getForm(formId);
    if (!form) {
      mkf_c.log(`${serviceName}: enrichForm - Form not found.`);
      return;
    }
    //mkf_c.log(`${serviceName}: enrichForm - Filling form with data:`, data);

    let formData = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "n/a" &&
        value !== "N/A" &&
        value !== "undefined"
      ) {
        formData[key] = value;
      }
    }

    if (reqServicePref == "domain") {
      let curentFormData = form.getValues();
      let cleanNullFields = {};
      let nullFields = mcz_dl?.setup?.nullFields || null;
      let nullFieldsCheck = 0;
      if (nullFields) {
        Object.keys(nullFields).forEach(function (key) {
          if (
            curentFormData[key] == "NULL" ||
            curentFormData[key] == null ||
            curentFormData[key] == undefined ||
            curentFormData[key] == ""
          ) {
            nullFieldsCheck++;
            let fieldValue = formData[key] || "NULL";
            if (fieldValue) {
              cleanNullFields[key] = fieldValue;
            }
          }
        });
      }
      if (nullFieldsCheck > 0) {
        mkf_c.log(`${serviceName}:  enrichForm - Domain Upgraded Field Set.`, cleanNullFields);
        form.setValuesCoerced(cleanNullFields);
        mkf_c.table(cleanNullFields);
      }
      return;
    }

    let fieldSet = Object.keys(formData);
    if (lastEnrichedFieldSet.length > 0) {
      let fieldsToClear = fieldSet.filter((field) => !lastEnrichedFieldSet.includes(field));
      mkf_c.log(
        `${serviceName}: enrichForm - Fields to clear from last enrichment:`,
        fieldsToClear
      );
      fieldsToClear.forEach((field) => {
        formData[field] = "";
      });
    }
    lastEnrichedFieldSet = fieldSet;

    // Preserving previous user input (MWPW-171061)
    let formValues = form.getValues();
    let fieldsToClear = fieldSet.filter((field) => formValues[field]);
    fieldsToClear.forEach((field) => {
      delete formData[field];
    });

    mkf_c.log(`${serviceName}: Adding this data to the form...`);
    mkf_c.table(formData);
    form.setValuesCoerced(formData);
    if (lastEnrichedFieldSet.length > 0) {
      fieldSet = fieldSet.filter((field) => !lastEnrichedFieldSet.includes(field));
    }
    lastEnrichedFieldSet = fieldSet;

    // Triggering change event on field updates
    const countryField = form.getFormElem()[0].querySelector('[name="Country"]');
    if (countryField) {
      const changeEvent = new Event("change", { bubbles: true });
      countryField.dispatchEvent(changeEvent);
    }

    let retryCount = 0;
    function retryState(form, formData) {
      let formDataNow = form.getValues();
      let currentState = formDataNow?.State || "";
      if (currentState) {
        //mkf_c.log(
        //  `${serviceName}: retryState - State already set:`,
        //  currentState
        //);
        return;
      }
      let retryData = {};
      retryCount++;
      mkf_c.log(`${serviceName}: retryState - Retry Count:`, retryCount);
      if (retryCount > 10) {
        retryData.State = "";
        //mkf_c.log(
        //  `${serviceName}: retryState - Retry Count Exceeded:`,
        //  retryCount
        //);
        form.setValuesCoerced(retryData);
        return;
      }

      if (!stateInputName) {
        mkf_c.warn(`${serviceName}: State input name not defined in setup config.`);
      }
      let statesAvailable =
        document.querySelectorAll(`.mktoForm [name="${stateInputName}"] option`) || null;
      if (statesAvailable && statesAvailable.length > 2) {
        //mkf_c.log(
        //  `${serviceName}: retryState - Unknown Current State:`,
        //  currentState
        //);
        for (let state of statesAvailable) {
          if (state.label.toLowerCase() == formData.State.toLowerCase()) {
            //mkf_c.log(
            //  `${serviceName}: retryState - Found State:`,
            //  state.label
            //);
            retryData.State = state.value;
            break;
          }
          if (state.value.toLowerCase() == formData.State.toLowerCase()) {
            //mkf_c.log(
            //  `${serviceName}: retryState - Found State:`,
            //  state.value
            //);
            retryData.State = state.value;
            break;
          }
        }
        if (!retryData?.State) {
          for (let state of statesAvailable) {
            if (state.label.toLowerCase().includes(formData.State.toLowerCase())) {
              //mkf_c.log(
              //  `${serviceName}: retryState - Found State:`,
              //  state.label
              //);
              retryData.State = state.value;
              break;
            }
          }
        }
        if (!retryData?.State) {
          retryData.State = "";
        }
        //mkf_c.log(
        //  `${serviceName}: retryState - we have states but no match:`,
        //  retryData
        //);
        form.setValuesCoerced(retryData);
        return;
      }
      setTimeout(() => retryState(form, formData), 100);
    }
    if (formData.Country && formData.State) {
      setTimeout(() => retryState(form, formData), 100);
    }

    let sendPerformance = mcz_dl.setup?.enrichment?.performance || {};
    if (sendPerformance) {
      sendPerformance.provider = serviceName || "";
      sendPerformance.description = serviceDescription || "";
      sendPerformance.version = serviceVersion || "1.0";
      sendPerformance.author = serviceAuthor || "MCZ";
      sendPerformance.prepared = new Date().toISOString();

      let performanceData = JSON.stringify(sendPerformance);
      let performanceField =
        mcz_dl.setup?.enrichment?.fld_mktoFormsEnrichmentPerformance ||
        "mktoFormsEnrichmentPerformance";
      form.addHiddenFields({
        [performanceField]: performanceData,
      });
    }
    let flatData = JSON.stringify(mcz_dl?.flattenedData);
    if (flatData) {
      let flatField =
        mcz_dl.setup?.enrichment?.fld_mktoFormsEnrichmentFlatData || "mktoFormsEnrichmentFlatData";
      form.addHiddenFields({
        [flatField]: flatData,
      });
    }

    let finalFormData = form.getValues();
    let submitAsHidden = {};
    Object.keys(formData).forEach(function (key) {
      if (typeof finalFormData[key] == "undefined") {
        if (
          typeof formData[key] !== "undefined" &&
          formData[key] !== null &&
          formData[key] !== ""
        ) {
          submitAsHidden[key] = formData[key];
        }
      }
    });
    if (Object.keys(submitAsHidden).length > 0) {
      form.addHiddenFields(submitAsHidden);
      //mkf_c.log(
      //  `${serviceName}: enrichForm - Submit As Hidden?? maybe`,
      //  submitAsHidden
      //);
      //mkf_c.table(submitAsHidden);
    }

    finalFormData = form.getValues();
    let cleanNullFields = {};
    let nullFields = mcz_dl?.setup?.nullFields || null;
    let nullFieldsCheck = 0;
    if (nullFields) {
      Object.keys(nullFields).forEach(function (key) {
        if (
          finalFormData[key] == "NULL" ||
          finalFormData[key] == null ||
          finalFormData[key] == undefined ||
          finalFormData[key] == ""
        ) {
          nullFieldsCheck++;
          cleanNullFields[key] = "NULL";
        }
      });
    }
    if (nullFieldsCheck > 0) {
      //mkf_c.log(
      //  `${serviceName}: enrichForm - Upgrade Fields to NULL:`,
      //  cleanNullFields
      //);
      form.setValuesCoerced(cleanNullFields);

      //mkf_c.log(
      //  `${serviceName}: Form Data Upgraded with additional look up.`,
      //  nullFieldsCheck
      //);

      finalFormData = form.getValues();

      let emailInput = finalFormData?.Email || null;
      let websiteInput = finalFormData?.mktodemandbaseWebsite || "";

      if (emailInput && websiteInput) {
        let topLevelDomainEmail = "";
        let topLevelDomainWebsite = "";
        let cleanEmailDomain = emailInput.trim();
        if (cleanEmailDomain && cleanEmailDomain.length > 2) {
          let domain = cleanEmailDomain.split("@")?.[1] || "";
          if (domain) {
            let domain_parts = domain.split(".");
            let domain_tld = domain_parts.pop() || "";
            let domain_non_tld = domain_parts.pop() || "";
            if (domain_non_tld && domain_tld) {
              topLevelDomainEmail = domain_non_tld + "." + domain_tld;
            }
          }
        }
        let websiteDomain = websiteInput.trim();
        let cleanDomain = websiteDomain.replace(/^https?:\/\//, "");
        cleanDomain = cleanDomain.split("?")[0];
        cleanDomain = cleanDomain.split("#")[0];
        if (cleanDomain && cleanDomain.length > 2) {
          let websiteDomain_parts = cleanDomain.split(".");
          let websiteDomain_tld = websiteDomain_parts.pop() || "";
          let websiteDomain_non_tld = websiteDomain_parts.pop() || "";
          if (websiteDomain_non_tld && websiteDomain_tld) {
            topLevelDomainWebsite = websiteDomain_non_tld + "." + websiteDomain_tld;
          }
        }

        //mkf_c.log(
        //  `${serviceName}: enrichForm - Top Level Domain Email:`,
        //  topLevelDomainEmail
        //);
        //mkf_c.log(
        //  `${serviceName}: enrichForm - Top Level Domain Website:`,
        //  topLevelDomainWebsite
        //);
        if (topLevelDomainEmail.length > 2 || topLevelDomainWebsite.length > 2) {
          //mkf_c.log(
          //  `${serviceName}: enrichForm - Top Level Domain Email:`,
          //  topLevelDomainEmail
          //);
          //mkf_c.log(
          //  `${serviceName}: enrichForm - Top Level Domain Website:`,
          //  topLevelDomainWebsite
          //);
          if (topLevelDomainEmail.toLowerCase() == topLevelDomainWebsite.toLowerCase()) {
            //mkf_c.log(
            //  `${serviceName}: Upgrade Company Data with Domain:`,
            //  topLevelDomainWebsite
            //);
            //mkf_c.log(
            //  `${serviceName}: Upgrade Company Data with Domain: ${topLevelDomainWebsite}`
            //);
            moduleDB("domain", topLevelDomainWebsite, null, false);
          }
        }
      }
    }

    mkf_c.groupCollapsed(`${serviceName}: Form Data...`);
    mkf_c.table(finalFormData);
    mkf_c.groupEnd();
  };

  const mapFieldsToForm = (data) => {
    //mkf_c.groupCollapsed(`${serviceName}: mapFieldsToForm - Data:`);
    //mkf_c.table(data);
    //mkf_c.groupEnd();

    const mcz_fieldMap_data = {};
    const fieldMap = mcz_dl.setup.fieldMap;
    const valueMapping = mcz_dl.setup.valueMapping;
    const nullFields = mcz_dl.setup.nullFields;

    //mkf_c.log(`${serviceName}: mapFieldsToForm - Field Map:`, fieldMap);
    //mkf_c.log(
    //  `${serviceName}: mapFieldsToForm - Value Mapping:`,
    //  valueMapping
    //);
    //mkf_c.log(`${serviceName}: mapFieldsToForm - Null Fields:`, nullFields);

    for (const dbField of Object.keys(data)) {
      let value = data[dbField];
      let mktoField = fieldMap[dbField];

      if (!mktoField) {
        //  mkf_c.log(
        //    `${serviceName}: No Marketo field mapping found for ${dbField}`
        //  );
        continue;
      }

      let mktoDemandbaseCompanyID = data?.company_id || null;

      if (valueMapping && valueMapping[mktoField]) {
        try {
          if (typeof valueMapping[mktoField]?.process === "function") {
            value = valueMapping[mktoField].process(value);
          }
        } catch (error) {
          mkf_c.error(`${serviceName}: Error with value mapping for field ${mktoField}:`, error);
          value = null;
        }
      }

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "n/a" &&
        value !== "N/A" &&
        value !== "undefined"
      ) {
        mcz_fieldMap_data[mktoField] = value;
      } else {
        if (nullFields[mktoField] && mktoDemandbaseCompanyID) {
          mkf_c.log(`${serviceName}: mapFieldsToForm - Null Field:`, mktoField);
          mcz_fieldMap_data[mktoField] = "NULL";
        } else {
          mkf_c.log(`${serviceName}: mapFieldsToForm - Removing Field:`, mktoField);
          delete mcz_fieldMap_data[mktoField];
        }
      }
    }
    mkf_c.groupCollapsed(`${serviceName}: mapping the data to the form fields.`);
    mkf_c.table(mcz_fieldMap_data);
    mkf_c.groupEnd();
    return JSON.parse(JSON.stringify(mcz_fieldMap_data));
  };

  let flattenData = (data) => {
    if (!data || typeof data !== "object") {
      mkf_c.warn(`${serviceName}: Data is not an object, skipping flattening`);
      return data;
    }

    const flattened = { ...data };
    for (const [key, value] of Object.entries(flattened)) {
      if (value === null || value === "null" || value === "undefined" || value === undefined) {
        delete flattened[key];
        continue;
      }

      // Special handling for watch_list
      if (key === "watch_list" && typeof value === "object") {
        const watchLists = [];
        const watchListsValues = [];
        const watchListsLbls = [];
        const watchListPairs = [];
        const watchListActive = [];
        let watchListsSorted = [];
        let watchListsValuesSorted = [];
        let watchListPairsSorted = [];
        let watchListActiveSorted = [];
        let watchListLblsSorted = [];
        for (const [listKey, listValue] of Object.entries(value)) {
          watchLists.push(listKey.trim().toUpperCase());
          if (listValue && typeof listValue === "string" && listValue.trim().length) {
            watchListActive.push(listKey.trim().toUpperCase());
            flattened[`watch_list__${listKey.toLowerCase()}`] = listValue.trim().toUpperCase();
            flattened[`watch_list__${listKey.toLowerCase()}_lbl`] = listValue.trim();
            watchListsLbls.push(listValue.trim());
            watchListsValues.push(listValue.trim().toUpperCase());
            watchListPairs.push(
              `${listKey.trim().toUpperCase()}:${listValue.trim().toUpperCase()}`
            );
          }
        }

        if (watchLists.length > 0) {
          watchListsSorted = watchLists.sort();
          watchListsValuesSorted = watchListsValues.sort();
          watchListPairsSorted = watchListPairs.sort();
          watchListActiveSorted = watchListActive.sort();
          watchListLblsSorted = watchListsLbls.sort();
          flattened["watch_lists"] = watchListsSorted.join("|");
          flattened["watch_lists_active"] = watchListActiveSorted.join("|");
          flattened["watch_lists_pairs"] = watchListPairsSorted.join("|");
          flattened["watch_lists_values"] = watchListsValuesSorted.join("|");
          flattened["watch_lists_lbls"] = watchListLblsSorted.join("|");
        }
        delete flattened[key];
        continue;
      }

      if (typeof value === "object") {
        if (Array.isArray(value)) {
          const cleanArray = value.filter((item) => item != null);
          flattened[key] = cleanArray.length ? cleanArray.join("|") : undefined;
          if (!flattened[key]) delete flattened[key];
        } else {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue != null) {
              flattened[`${key}__${subKey}`] = subValue;
            }
          }
          delete flattened[key];
        }
      } else if (typeof value === "boolean") {
        flattened[key] = value ? "true" : "false";
      } else if (typeof value === "number") {
        flattened[key] = value.toString();
      } else if (typeof value === "string" && value.trim()) {
        flattened[key] = value;
      } else {
        delete flattened[key];
      }
    }
    let date = new Date();
    flattened["MCZ_PROVIDER"] = "DEMANDBASE";
    flattened["MCZ_PROVIDER_ID"] = flattened["company_id"];
    flattened["MCZ_PROVIDER_DATE"] = date.toISOString();
    flattened["MCZ_PROVIDER_DATETIME"] = date.getTime();

    flattened["MCZ_PROVIDER_SPEED"] = mcz_dl.performance.requestSpeedMS;
    let demandBaseCompanyLevel = "CHILD";
    if (!flattened["parent__company_id"]) {
      flattened["parent__company_id"] = flattened["company_id"];
      flattened["parent__company_name"] = flattened["company_name"];
    } else {
      demandBaseCompanyLevel = "PARENT";
    }
    if (!flattened["ultimate_parent__company_id"]) {
      flattened["ultimate_parent__company_id"] = flattened["company_id"];
      flattened["ultimate_parent__company_name"] = flattened["company_name"];
    } else {
      demandBaseCompanyLevel = "ULTIMATE";
    }
    flattened["demandbase_company_level"] = demandBaseCompanyLevel;

    mkf_c.groupCollapsed(`${serviceName}: Cleaning Up Data...`);
    mkf_c.table(flattened);
    mkf_c.groupEnd();
    return JSON.parse(JSON.stringify(flattened));
  };

  let isAutocompleteBound = false;
  let bindCompanyAutocomplete = async () => {
    if (isAutocompleteBound) {
      mkf_c.warn(`${serviceName}: Autocomplete already bound, skipping`);
      return;
    }
    isAutocompleteBound = true;

    let companyInputName = mcz_dl.setup?.autoComplete?.companyInputName || null;
    if (!companyInputName) {
      mkf_c.warn(`${serviceName}: Company field not defined in setup config, stopping.`);
      return;
    }

    const companyInput = document.querySelector(`.mktoForm input[name='${companyInputName}']`);

    if (!companyInput) {
      mkf_c.warn(`${serviceName}: Company field not found, skipping autocomplete`);
      return;
    }

    let dataList = document.getElementById("mkto_FormsCompanySuggestions");
    if (!dataList) {
      dataList = document.createElement("datalist");
      dataList.id = "mkto_FormsCompanySuggestions";
      document.body.appendChild(dataList);
      companyInput.setAttribute("list", "mkto_FormsCompanySuggestions");
      const style = document.createElement("style");
      style.textContent = `
        input[list="mkto_FormsCompanySuggestions"] {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }        
        /* Android Chrome specific styling */
        input[list="mkto_FormsCompanySuggestions"]::-webkit-calendar-picker-indicator {
          display: none !important;
        }        
        @media screen and (-webkit-min-device-pixel-ratio:0) {
          input[list="mkto_FormsCompanySuggestions"] {
            max-width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
        .mktofrm_ios18 input[list]::-webkit-list-button {
          opacity: 0;
        }
      `;
      document.head.appendChild(style);
    }
    let debounce = (func, delay) => {
      let debounceTimer;
      return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
      };
    };
    let currentLocale = {
      country: "UNKNOWN",
      state: "UNKNOWN",
    };

    let handleCompanyInput = debounce(
      async (event) => {
        let companyInput = document.querySelector(`.mktoForm input[name='${companyInputName}']`);
        if (!companyInput) {
          mkf_c.log(`${serviceName}: Company field not found, skipping autocomplete`);
          return;
        }
        const query = companyInput.value.trim();
        if (query.length < 3) return;

        if (activeListItemsLbls && activeListItemsLbls.length > 0) {
          let activeListItemIndex = activeListItemsLbls.findIndex(
            (lbl) => lbl.trim().toUpperCase() === query.trim().toUpperCase()
          );
          if (activeListItemIndex !== -1) {
            await handleSelection();
            return;
          }
        }

        mkf_c.log(`${serviceName}: Company Name Updated to "${query}"`);

        let localeSessionVar = mcz_dl.setup?.autoComplete?.localeSessionVar || null;
        if (localeSessionVar) {
          locale = sessionStorage.getItem(localeSessionVar) || null;
          try {
            currentLocale = JSON.parse(locale);
          } catch (error) {
            currentLocale = {
              country: "UNKNOWN",
              state: "UNKNOWN",
            };
          }
        }

        let activeCompanyName = event.target.getAttribute("data-active_option_value") || "";

        if (
          activeCompanyName?.trim()?.length > 0 &&
          activeCompanyName?.trim()?.toUpperCase() === query?.trim()?.toUpperCase() &&
          event.inputType !== "insertText"
        ) {
          return;
        }
        const data = await fetchAutocomplete(query);

        let recordShow = mcz_dl.setup?.autoComplete?.recordShow || 10;
        let suggestions = data?.picks || null;
        if (!suggestions) return;

        let fieldSuggestionImprovements =
          mcz_dl.setup?.autoComplete?.fieldSuggestionImprovements || [];
        let suggestionsFiltered = filterAndSortSuggestions(
          suggestions,
          query,
          fieldSuggestionImprovements
        );

        updateDataList(suggestionsFiltered, recordShow);
        try {
          //later
        } catch (error) {
          mkf_c.error(`${serviceName}: Error fetching suggestions data:`, error);
        }
      },
      iOSVersion > 1 && iOSVersion < 18 && !dataList.classList.contains("activeSelectionMonitors")
        ? 10
        : 500
    );

    let keysForSortingConfig = mcz_dl?.setup?.autoComplete?.autocompleteLabel || {};
    let sortedLabelOptionKeys = [];
    if (Object.keys(keysForSortingConfig).length > 0) {
      delete keysForSortingConfig["company_name"];
      sortedLabelOptionKeys = Object.keys(keysForSortingConfig).sort(
        (a, b) => keysForSortingConfig[a] - keysForSortingConfig[b]
      );
    }

    let totalsuggestionsEver = 0;
    let suggestionsEver = {};
    let filterAndSortSuggestions = (suggestions, query, fieldSuggestionImprovements) => {
      let suggestionsFiltered = suggestions.filter(
        (suggestion) =>
          suggestion?.company_name &&
          typeof suggestion.company_name === "string" &&
          suggestion.company_name.trim().length > 0
      );

      if (suggestionsFiltered.length === 0) {
        return suggestions;
      }

      mkf_c.log(`${serviceName}: Found ${suggestionsFiltered.length} suggestions`);
      let query_starts_with = query.trim().toUpperCase();
      let sort_refs = {
        query: "ZZZ",
        employee_count: "Z-00000000000000",
        annual_sales: "Z-00000000000000",
        country_state: "ZZZ",
        domain: "ZZZ",
        final_sort: "ZZZ-ZZZ-ZZZ-ZZZ",
      };
      //
      // Set Sorting Prefix
      suggestionsFiltered.forEach((suggestion) => {
        suggestion.sort_refs = JSON.parse(JSON.stringify(sort_refs));
        if (suggestion.company_name?.toUpperCase()?.startsWith(query_starts_with)) {
          suggestion.sort_refs.query = "AAA";
        }
        if (suggestion.company_name?.toUpperCase()?.includes(query_starts_with)) {
          suggestion.sort_refs.query = "BBB";
        }
      });
      // Set Sorting Prefix by employee_count
      if (fieldSuggestionImprovements.includes("employee_count")) {
        suggestionsFiltered.forEach((suggestion) => {
          let employee_count_ref = parseInt(suggestion?.employee_count) || 0;
          if (employee_count_ref > 1) {
            employee_count_ref -= 100000000000000;
            let holdref = "A" + employee_count_ref.toString();
            suggestion.sort_refs.employee_count = holdref.replace("A1", "");
          }
        });
      }
      // Set Sorting Prefix by annual_sales
      if (fieldSuggestionImprovements.includes("annual_sales")) {
        suggestionsFiltered.forEach((suggestion) => {
          let annual_sales_ref = parseInt(suggestion?.annual_sales) || 0;
          if (annual_sales_ref > 1) {
            annual_sales_ref -= 100000000000000;
            let holdref = "A" + annual_sales_ref.toString();
            suggestion.sort_refs.annual_sales = holdref.replace("A1", "");
          }
        });
      }
      // Set Sorting Prefix by country and state
      if (fieldSuggestionImprovements.includes("country")) {
        let countryCode = currentLocale?.country || "UNKNOWN";
        let state = currentLocale?.state || "UNKNOWN";

        if (countryCode === "UNKNOWN") {
        } else {
          suggestionsFiltered.forEach((suggestion) => {
            if (
              suggestion?.country?.toUpperCase() === countryCode?.toUpperCase() &&
              suggestion?.state?.toUpperCase() === state?.toUpperCase()
            ) {
              suggestion.sort_refs.country_state = "AAA";
            } else if (suggestion?.country?.toUpperCase() === countryCode?.toUpperCase()) {
              suggestion.sort_refs.country_state = "BBB";
            }
          });
        }
      }
      // Set Sorting Prefix by domain
      if (fieldSuggestionImprovements.includes("domain")) {
        if (!emailInputName) {
          mkf_c.warn(`${serviceName}: Email Field not defined in setup config, stopping.`);
          return suggestionsFiltered;
        }
        let emailInput = document.querySelector(`.mktoForm input[name='${emailInputName}']`);

        let topLevelNonTLD = "";
        let topLevelDomain = "";

        if (emailInput) {
          let cleanEmailDomain = emailInput.value.trim();
          if (cleanEmailDomain && cleanEmailDomain.length > 2) {
            let domain = cleanEmailDomain.split("@")?.[1] || "";
            if (domain) {
              let domain_parts = domain.split(".");
              let domain_tld = domain_parts.pop() || "";
              let domain_non_tld = domain_parts.pop() || "";
              topLevelNonTLD = domain_non_tld + ".";
              topLevelDomain = domain_non_tld + "." + domain_tld;
            }
          }
        }

        if (topLevelDomain || topLevelNonTLD) {
          suggestionsFiltered.forEach((suggestion) => {
            let domain = suggestion?.web_site?.toLowerCase();
            if (domain) {
              let cleanDomain = domain.replace(/^https?:\/\//, "");
              cleanDomain = cleanDomain.split("?")[0];
              cleanDomain = cleanDomain.split("#")[0];
              if (cleanDomain) {
                if (cleanDomain.length > 3) {
                  let domain_parts = cleanDomain.split(".");
                  let domain_tld = domain_parts.pop() || "";
                  let domain_non_tld = domain_parts.pop() || "";
                  let web_site_topLevelDomain = domain_non_tld + "." + domain_tld;
                  let web_site_topLevelNonTLD = domain_non_tld + ".";

                  if (web_site_topLevelDomain === topLevelDomain) {
                    suggestion.sort_refs.domain = "AAA";
                  }
                  if (web_site_topLevelNonTLD === topLevelNonTLD) {
                    suggestion.sort_refs.domain = "BBB";
                  }
                }
              }
            }
          });
        }
      }

      //create labels for the suggestions
      let allUniqueLabels = [];
      let allUniqueSuggestions = [];
      suggestionsFiltered.forEach((suggestion) => {
        let labelArray = [];
        if (sortedLabelOptionKeys.length > 0) {
          for (let key of sortedLabelOptionKeys) {
            if (suggestion[key]) {
              labelArray.push(`${suggestion[key]}`);
            }
          }
          suggestion.option_label = labelArray.join(", ");
        } else {
          suggestion.option_label = suggestion.marketing_alias || suggestion?.company_name || "";
        }
        if (!allUniqueLabels.includes(suggestion.option_label)) {
          allUniqueLabels.push(suggestion.option_label);
          allUniqueSuggestions.push(suggestion);
        }
      });

      // Set Sorting Final Sort
      allUniqueSuggestions.forEach((suggestion) => {
        let final_sort = "";
        final_sort += "-Q" + suggestion.sort_refs.query;
        final_sort += "-D" + suggestion.sort_refs.domain;
        final_sort += "-C" + suggestion.sort_refs.country_state;
        final_sort += "-S" + suggestion.sort_refs.annual_sales;
        final_sort += "-E" + suggestion.sort_refs.employee_count;

        suggestion.final_sort = "" + final_sort;
      });
      let suggestionsFilteredSorted = allUniqueSuggestions.sort((a, b) => {
        return a.final_sort.localeCompare(b.final_sort);
      });
      if (suggestionsFilteredSorted.length === 0) {
        return suggestionsFiltered;
      }
      mkf_c.log(
        `${serviceName}: Filtering - ALL Suggestions`,
        suggestionsFilteredSorted.map((suggestion) => ({
          sort_key: suggestion.final_sort,
          label: suggestion.option_label,
          activeRefID: suggestion.companyrefid,
        }))
      );
      return suggestionsFilteredSorted;
    };

    let updateDataList = (suggestionsFiltered, recordShow) => {
      let companyInput = document.querySelector(`.mktoForm input[name='${companyInputName}']`);
      if (!companyInput) {
        mkf_c.log(`${serviceName}: Company field not found, skipping selection`);
        return;
      }
      dataList.innerHTML = "";
      let countOfSuggestions = suggestionsFiltered.length;
      if (countOfSuggestions > 0) {
        suggestionsListInstance = 0;
        activeListItemsLbls = [];
        activeListItemsObjs = [];
        suggestionsFiltered.slice(0, recordShow).forEach((sug) => {
          const companyName = sug?.marketing_alias || sug?.company_name || null;
          let option_label = sug?.option_label || null;
          if (!companyName) return;
          let option = document.createElement("option");
          totalsuggestionsEver++;
          suggestionsListInstance++;
          let id_ref = `DB-${suggestionsListInstance}-${countOfSuggestions}-${totalsuggestionsEver}`;
          if (id_ref) {
            sug.dataset = {};
            sug.dataset.label = option_label;
            sug.dataset.option_data = JSON.stringify(sug);
            sug.dataset.companyrefid = id_ref;
            sug.dataset.option_company_lbl = companyName;
            sug.dataset.company_domain = sug?.web_site || "";
            activeListItemsLbls.push(option_label);
            activeListItemsObjs.push(sug);

            suggestionsEver[id_ref] = JSON.stringify(sug);
            option.value = option_label;
            option.label = option_label;
            option.dataset.label = option_label;
            option.dataset.option_data = JSON.stringify(sug);
            option.dataset.companyrefid = id_ref;
            option.dataset.option_company_lbl = companyName;
            option.dataset.company_domain = sug?.web_site || "";
            dataList.appendChild(option);
          }
        });
      }

      if (dataList && !dataList?.classList?.contains("activeSelectionMonitors")) {
        dataList.classList.add("activeSelectionMonitors");
        dataList.addEventListener("change", handleSelection);
        dataList.addEventListener("click", handleSelection);
        dataList.addEventListener("touchend", handleSelection);
        dataList.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            handleSelection(e);
          }
        });
      }
    };
    handleSelection = debounce(async (event) => {
      let companyInput = document.querySelector(`.mktoForm input[name='${companyInputName}']`);
      if (!companyInput) {
        mkf_c.log(`${serviceName}: Company field not found, skipping selection`);
        return;
      }
      let activeRefID = null;
      let activeCompanyLbl = null;
      let activeValue = companyInput?.dataset?.active_option_value || null;
      let currentValue = companyInput?.value || null;
      let optionData = null;

      if (!currentValue || currentValue.length < 3) {
        return;
      }
      if (activeValue && currentValue === activeValue) {
        return;
      } else {
        activeValue = currentValue;
      }

      let activeSuggestionFromListItem;
      let dataListActive = false;
      let dataList = document.getElementById("mkto_FormsCompanySuggestions");
      let optionsCount = 0;
      if (!dataList) {
        mkf_c.log(`${serviceName}: Data List not found, skipping selection`);
        dataListActive = false;
      } else {
        optionsCount = dataList?.options?.length || 0;
      }

      if (optionsCount > 0) {
        activeSuggestionFromListItem =
          dataList.querySelector(`option[data-label="${currentValue}"]`) || null;
        if (!activeSuggestionFromListItem) {
        } else {
          activeRefID = activeSuggestionFromListItem?.dataset?.companyrefid || null;
          activeValue = activeSuggestionFromListItem?.dataset?.option_company_lbl || null;
          activeCompanyLbl = activeSuggestionFromListItem?.dataset?.label || null;
        }
      }

      if (activeRefID && activeRefID !== null) {
        dataListActive = true;
      }

      if (activeListItemsLbls && activeListItemsLbls.length > 0) {
        let activeListItemIndex = activeListItemsLbls.findIndex(
          (lbl) => lbl.trim().toUpperCase() === currentValue.trim().toUpperCase()
        );
        if (activeListItemIndex !== -1) {
          if (typeof activeListItemsObjs[activeListItemIndex] === "object") {
            let activeItem = activeListItemsObjs[activeListItemIndex];
            activeRefID = activeItem?.dataset?.companyrefid || null;
            activeValue = activeItem?.dataset?.option_company_lbl || null;
            activeCompanyLbl = activeItem?.dataset?.label || null;
            optionData = activeItem?.dataset?.option_data || null;

            if (activeRefID && activeRefID !== null) {
              dataListActive = true;
            }
          } else {
            mkf_c.log(`${serviceName}: activeListItemsObjs is not ready.`);
          }
        }
      }

      if (!dataListActive) {
        return;
      }
      if (!activeRefID) {
        return;
      }

      companyInput.dataset.active_option_value = activeValue;
      companyInput.value = activeValue;
      companyInput.dataset.active_option_lbl = activeCompanyLbl;
      companyInput.dataset.activerefid = activeRefID;

      let optionDataJSON = null;
      try {
        optionDataJSON = JSON.parse(optionData);
      } catch (error) {
        mkf_c.warn(`${serviceName}: Error parsing option data:`, error);
      }
      if (!optionDataJSON) {
        return;
      }

      dataList.innerHTML = "";
      activeListItemsLbls = [];
      activeListItemsObjs = [];
      moduleDB("provided", activeValue, optionDataJSON, true);
    }, 100);

    companyInput.addEventListener("input", handleCompanyInput);

    companyInput.addEventListener("change", handleSelection);
    companyInput.addEventListener("blur", handleSelection);
    companyInput.addEventListener("touchend", handleSelection);
    companyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        handleSelection(e);
      }
    });
  };

  let cachInputs = {};
  let suggestionsListInstance = 0;
  let fetchCount = 0;
  let fetchStartTime = null;
  let fetchEndTime = null;
  let fetchActive = false;
  let activeListItemsLbls = [];
  let activeListItemsObjs = [];

  let fetchAutocomplete = (query) => {
    if (fetchActive) return;
    if (!query) return [];
    query = query.trim() || "";
    if (query.length < 3) return [];
    if (cachInputs[query]) {
      return cachInputs[query];
    }
    let cachedInput = Object.keys(cachInputs).find((key) => key.startsWith(query));
    if (cachedInput) {
      // maybe in the future
      // return cachInputs[cachedInput];
    }

    const apiKey = mcz_dl.setup.apiKey;
    const autoComplete = mcz_dl.setup.autoComplete;
    const session = autoComplete.session;
    const url = `${mcz_dl.setup.apiUrl.company}?term=${encodeURIComponent(
      query
    )}&key=${apiKey}&records=${autoComplete.recordCount || 10}&session=${session}`;
    fetchActive = true;
    fetchCount++;
    fetchStartTime = new Date();
    return fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          fetchActive = false;
          throw new Error(`${serviceName}:Autocomplete ` + response.status);
        }
        const data = await response.json();
        fetchEndTime = new Date();
        fetchSpeedMS = fetchEndTime - fetchStartTime;
        cachInputs[query] = data;
        fetchActive = false;
        return data;
      })
      .catch((error) => {
        fetchActive = false;
        mkf_c.error(`${serviceName}: Error fetching autocomplete data:`, error);
        return [];
      });
  };

  function haveSomePatience(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let maxTicksAfterEmailInputFound = 20;
  let totalMaxTicksToWait = 100;
  let checkingSpeed = 250;
  let checkingTicks = 0;
  let totalTicks = 0;
  let emailInputName = mcz_dl.setup?.autoComplete?.emailInputName || null;
  let companyInputName = mcz_dl.setup?.autoComplete?.companyInputName || null;
  let stateInputName = mcz_dl?.setup?.autoComplete?.stateInputName || null;
  let init_moduleDB = async () => {
    checkingTicks++;
    totalTicks++;
    const knownVisitor = window?.mcz_marketoForm_pref?.profile?.known_visitor || false;

    function paddTicks(ticks) {
      return ticks < 1000 ? `00${ticks}` : ticks < 10000 ? `0${ticks}` : ticks;
    }

    if (knownVisitor) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Known Visitor.`);
      return;
    }
    if (checkingTicks > totalMaxTicksToWait) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Max ticks reached, stopping.`);
      return;
    }
    if (checkingTicks > 1) {
      await haveSomePatience(checkingSpeed);
    }

    if (!emailInputName || !companyInputName) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Waiting for Email or Company field.`);
      return;
    }
    if (checkingTicks > 10) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# checking speed set to every second.`);
      checkingSpeed = 1000;
    }
    const consentCheck = typeof checkAdobePrivacy === "function" ? await checkAdobePrivacy() : true;
    if (!consentCheck) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Waiting for Consent.`);
      setTimeout(() => init_moduleDB(), 10);
      return;
    }
    let emailInput = document.querySelector(`.mktoForm input[name='${emailInputName}']`);
    if (!emailInput) {
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Waiting for Email Field.`);
      setTimeout(() => init_moduleDB(), 10);
      return;
    }
    if (totalTicks > 1 && totalTicks === checkingTicks) {
      checkingTicks = 0;
    }

    let companyInput = document.querySelector(`.mktoForm input[name='${companyInputName}']`);
    if (!companyInput) {
      if (checkingTicks > maxTicksAfterEmailInputFound) {
        mkf_c.log(
          `${serviceName}: ${paddTicks(totalTicks)}# No Company field found, max time reached.`
        );
        return;
      }
      mkf_c.log(`${serviceName}: ${paddTicks(totalTicks)}# Waiting for Company field.`);
      setTimeout(() => init_moduleDB(), 10);
      return;
    }

    mkf_c.log(
      `${serviceName}: ${paddTicks(totalTicks)}# Initializing ${serviceName} Autocomplete.`
    );
    await bindCompanyAutocomplete();
  };

  init_moduleDB();
})();
// ##
// ##
// ]]>