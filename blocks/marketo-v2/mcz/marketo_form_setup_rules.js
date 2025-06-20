/* eslint-disable no-console */
// Marketo Form Setup Rules

let mktoFrmLanaLogMasterSwitch = false;

// Lana logging utility (modular, not global)
function createMkfLogger({ enableLog = false, enableLana = false } = {}) {
  mktoFrmLanaLogMasterSwitch = enableLana;
  const mktoFrmLogLanaMethods = ['log', 'info', 'error', 'warn'];
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
  const mkfC = {};
  const methods = ['log', 'info', 'table', 'error', 'warn', 'group', 'groupEnd', 'groupCollapsed'];
  methods.forEach((method) => {
    mkfC[method] = (...args) => {
      if (enableLog) {
        originalConsole[method].bind(console, ...args)();
        if (mktoFrmLogLanaMethods.includes(method)) {
          if (typeof window?.lana?.log === 'function') {
            const lanaMessageParts = [];
            const lanaPayload = {};
            const thisMethodLc = method.toLowerCase();
            args.forEach((arg) => {
              try {
                if (typeof arg === 'string') {
                  lanaMessageParts.push(arg);
                } else if (arg instanceof Error && !lanaPayload.error) {
                  lanaPayload.error = arg;
                } else {
                  if (!lanaPayload.additionalData) lanaPayload.additionalData = [];
                  lanaPayload.additionalData.push(arg);
                }
              } catch (e) {
                originalConsole.warn('Error processing argument for Lana logging:', e, arg);
              }
            });
            let fullLanaMessage = lanaMessageParts.join(', ');
            if (mktoFrmLanaLogMasterSwitch) {
              if (!fullLanaMessage.toLowerCase().includes('#ll')) {
                if (thisMethodLc === 'warn' || thisMethodLc === 'error') {
                  fullLanaMessage += ' #ll';
                }
              }
            }
            if (fullLanaMessage.toLowerCase().includes('#ll')) {
              // Lana Log
              const lanaErrorType = method;
              let messageForLana = fullLanaMessage.replace(/#ll/gi, '');
              const tagComponents = new Set(['mktFrms']);
              const extractedTagsRegex = /#\w+(-\w+)?/g;
              const tagsFound = messageForLana.match(extractedTagsRegex);
              if (tagsFound) {
                const cleanedExtractedTags = tagsFound.map((tag) => tag.replace('#', ''));
                cleanedExtractedTags.forEach((tag) => tagComponents.add(tag));
              }
              const lanaTags = Array.from(tagComponents).join(', ');
              messageForLana = messageForLana.replace(extractedTagsRegex, '');
              messageForLana = messageForLana.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
              messageForLana = messageForLana.replace(/\s+/g, ' ').trim();
              messageForLana = messageForLana.replace(/("|'|`)/g, '');
              const consoleLanaMessage = `%cMktoForm LanaLog: %c${messageForLana}`;
              originalConsole.groupCollapsed(
                consoleLanaMessage,
                'color: purple; font-weight: bold;',
                'color: black; font-weight: normal;',
              );
              originalConsole.log('Tags:', lanaTags);
              originalConsole.log('Payload:', lanaPayload);
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
                  originalConsole.warn('Error calling window.lana.log:', e);
                }
              }, 0);
            }
          }
        }
      }
    };
  });
  return mkfC;
}

export const mkfC = createMkfLogger({ enableLog: true, enableLana: false });

// Default data layer as a constant (not global)
export const defaultMarketoFormPref = {
  performance: {
    currentTime: 0,
    currentTimeBucket: 0,
  },
  profile: {
    prefLanguage: '',
    segLangCode: '',
    known_visitor: false,
    unique_id: '',
    origin: '',
    scores: { data: '' },
  },
  form: {
    template: 'content_discover',
    type: 'marketo_form',
    subtype: 'request_for_information',
    success: {
      type: '',
      content: '',
      delay: 5000,
      confirm: false,
    },
    validation: {
      cgen: {
        params: ['trackingid', 'prid', 'promoid', 'sdid', 'pss', 'campaignid'],
        cookie: ['trackingid', 'sdid', 'promoid'],
      },
      campaignid: {
        sfdc: {
          field: 'mktoProductionCampaignId',
          status: 'internal_Prod_Camp_Status',
          queryParam: 's_iid',
          cookie: 's_iid',
          critical: true,
          starts_with: ['7015', '7011', '701K'],
          min_length: 18,
          max_length: 18,
        },
        external: {
          field: 'mktoExternalCampaignId',
          status: 'External_Camp_Status',
          queryParam: 's_cid',
          cookie: 's_cid',
          critical: false,
          starts_with: ['7015', '7011', '701K'],
          min_length: 18,
          max_length: 18,
        },
        retouch: {
          field: 'mktoRetouchCampaignId',
          status: 'Retouch_Camp_Status',
          queryParam: 's_rtid',
          cookie: 's_rtid',
          critical: false,
          starts_with: ['7015', '7011', '701K'],
          min_length: 18,
          max_length: 18,
        },
        onsite: {
          field: 'mktoOnsiteCampaignId',
          status: 'Onsite_Camp_Status',
          queryParam: 's_osc',
          cookie: 's_osc',
          critical: false,
          starts_with: ['7015', '7011', '701K'],
          min_length: 18,
          max_length: 18,
        },
      },
    },
    subtypeRules: {
      seminar: 'register',
      nurture: 'submit',
      whitepaper_form: 'submit',
      webinar: 'register',
      strategy_webinar: 'register',
      demo: 'submit',
      trial_download: 'download',
      trial: 'download',
      request_for_information: 'submit',
      quote: 'submit',
      event_registration: 'register',
      event_attendance: 'register',
      content_explore: 'submit',
      content_discover: 'submit',
      content_evaluate: 'submit',
      flex_contact: 'submit',
      flex_content: 'submit',
      flex_event: 'register',
      email: 'join',
    },
    templateVersions: {
      dme_flex_contact: 'flex_contact',
      dme_flex_content: 'flex_content',
      dme_flex_event: 'flex_event',
      comb_flex_contact: 'flex_contact',
      comb_flex_content: 'flex_content',
      comb_flex_event: 'flex_event',
    },
    subtypeTemplate: {
      flex_contact: 'request_for_information',
      flex_content: 'whitepaper_form',
      flex_event: 'strategy_webinar',
      content_explore: 'whitepaper_form',
      content_discover: 'whitepaper_form',
      content_evaluate: 'whitepaper_form',
      subscription: 'email',
    },
    mktoInstantInquiry: {
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
    cta: { override: '' },
    baseSite: 'https://business.adobe.com',
    version: '25.05.23a',
  },
  program: {
    additional_form_id: '',
    poi: '',
    copartnernames: '',
    campaignids: {
      sfdc: '',
      external: '',
      retouch: '',
      onsite: '',
      cgen: '',
      cuid: '',
    },
    content: {
      type: '',
      id: '',
      topics: [],
      segmentId: '',
      tags: [],
    },
    subscription: {
      type: '',
      name: '',
      id: '',
      topics: [],
      segmentId: '',
      tags: [],
    },
    marketo_asset: {
      name: '',
      id: '',
    },
  },
  field_visibility: {
    name: 'required',
    company: 'hidden',
    phone: 'hidden',
    comments: 'hidden',
    demo: 'hidden',
    state: 'hidden',
    postcode: 'hidden',
    company_size: 'hidden',
    website: 'hidden',
  },
  field_filters: {
    products: 'POI-Dxonly-area',
    job_role: '',
    industry: '',
    functional_area: '',
  },
  value_setup: {
    field_mapping: {
      name: 'FirstName',
      company: 'mktoFormsCompany',
      comments: 'mktoQuestionComments',
      demo: 'mktoRequestProductDemo',
      phone: 'Phone',
      state: 'State',
      postcode: 'PostalCode',
      company_size: 'mktoDemandbaseEmployeeRange',
      website: 'mktodemandbaseWebsite',
    },
    field_mapping_dl: {
      mktoFormsPrimaryProductInterest: 'program.poi',
      mktoCoPartnerName: 'program.copartnernames',
      mktoOPContentSubscriptionName: 'program.subscription.name',
      mktoProductionCampaignId: 'program.campaignids.sfdc',
      mktoExternalCampaignId: 'program.campaignids.external',
      mktoRetouchCampaignId: 'program.campaignids.retouch',
      mktoOnsiteCampaignId: 'program.campaignids.onsite',
      sessionCGEN: 'program.campaignids.cgen',
    },
    field_dependance: {
      state: 'Country',
      postcode: 'Country',
    },
    field_mapping_ac: {
      Email: 'email',
      FirstName: 'given-name',
      LastName: 'family-name',
      Phone: 'tel',
      mktoFormsJobTitle: 'organization-title',
      mktoFormsCompany: 'organization',
      Country: 'country',
      State: 'address-level1',
      PostalCode: 'postal-code',
    },
  },
};

export const mktoFrmLog = mkfC.log;

export default async function init() {
  window.mktoFrmLog = mktoFrmLog;
  window.mkf_c = mkfC;
  window.mcz_marketoForm_pref_example = defaultMarketoFormPref;

  const currentUrl = window.location.href.toLowerCase();
  if (currentUrl.includes('preview=1')) {
    window.mktoFrmLog = true;
    if (currentUrl.includes('lana=1')) {
      mktoFrmLanaLogMasterSwitch = true;
      mkfC.log(
        '%cTesting Detected - Logging Enabled with Lana Log (All Warns/Errors to Lana)',
        'font-size: 1.2em; color: purple; font-weight: bold; ',
      );
    } else {
      mkfC.log(
        '%cTesting Detected - Logging Enabled. Add \'&lana=1\' to URL to send all Warns/Errors to Lana Log.',
        'font-size: 1.2em; color: purple; font-weight: bold; ',
      );
    }
  }
  // QA Form
  if (window?.mcz_marketoForm_pref?.form?.id === 1723) {
    window.mktoFrmLog = true;
    mkfC.log(
      `%cQA Form Detected: ${window?.mcz_marketoForm_pref?.form?.id} - Logging Enabled`,
      'font-size: 1.2em; color: purple; font-weight: bold; ',
    );
  }

  mkfC.log('MCZ: Marketo Form Setup - Default Data Layer');
}
