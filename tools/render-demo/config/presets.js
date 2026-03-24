/* eslint-disable max-len */
/**
 * Default RenderConfig and presets for the form engine demo.
 * Three templates: Full (flex_contact), Expanded (flex_event), Essential (flex_content).
 */

const COUNTRY_OPTIONS = [
  { value: '', labelKey: 'placeholderCountry' },
  { value: 'US', labelKey: 'optionUS' },
  { value: 'DE', labelKey: 'optionDE' },
  { value: 'CA', labelKey: 'optionCA' },
];

/** All possible fields; each template uses a subset. */
const ALL_FIELDS = [
  {
    id: 'FirstName', name: 'FirstName', type: 'text', labelKey: 'labelFirstName', placeholderKey: 'placeholderFirstName', required: true, stepIndex: 0,
  },
  {
    id: 'LastName', name: 'LastName', type: 'text', labelKey: 'labelLastName', placeholderKey: 'placeholderLastName', required: true, stepIndex: 0,
  },
  {
    id: 'BusinessEmail', name: 'BusinessEmail', type: 'email', labelKey: 'labelBusinessEmail', placeholderKey: 'placeholderBusinessEmail', required: true, stepIndex: 0,
  },
  {
    id: 'BusinessPhone', name: 'BusinessPhone', type: 'tel', labelKey: 'labelBusinessPhone', placeholderKey: 'placeholderBusinessPhone', required: false, stepIndex: 0,
  },
  {
    id: 'JobTitle', name: 'JobTitle', type: 'text', labelKey: 'labelJobTitle', placeholderKey: 'placeholderJobTitle', required: false, stepIndex: 1,
  },
  {
    id: 'Department', name: 'Department', type: 'text', labelKey: 'labelDepartment', placeholderKey: 'placeholderDepartment', required: false, stepIndex: 1,
  },
  {
    id: 'CompanyName', name: 'CompanyName', type: 'text', labelKey: 'labelCompanyName', placeholderKey: 'placeholderCompanyName', required: false, stepIndex: 1,
  },
  {
    id: 'Country', name: 'Country', type: 'select', labelKey: 'labelCountry', placeholderKey: 'placeholderCountry', required: false, stepIndex: 1, options: COUNTRY_OPTIONS,
  },
  {
    id: 'PostCode', name: 'PostCode', type: 'text', labelKey: 'labelPostCode', placeholderKey: 'placeholderPostCode', required: false, stepIndex: 1,
  },
  {
    id: 'PrimaryProductOfInterest', name: 'PrimaryProductOfInterest', type: 'text', labelKey: 'labelPrimaryProductOfInterest', placeholderKey: 'placeholderPrimaryProductOfInterest', required: false, stepIndex: 1,
  },
];

function fieldsForIds(ids, step0Count) {
  return ids.map((id, index) => {
    const base = ALL_FIELDS.find((f) => f.id === id);
    if (!base) return null;
    const stepIndex = index < step0Count ? 0 : 1;
    return { ...base, stepIndex };
  }).filter(Boolean);
}

/** Full (flex_contact): request_for_information – 10 fields, order matches design (Organization name + ZIP row, then Job/Dept, then Country + POI) */
const FLEX_CONTACT_FIELD_IDS = ['FirstName', 'LastName', 'BusinessEmail', 'BusinessPhone', 'CompanyName', 'PostCode', 'JobTitle', 'Department', 'Country', 'PrimaryProductOfInterest'];
const FLEX_CONTACT_STEP0_IDS = ['FirstName', 'LastName', 'BusinessEmail', 'BusinessPhone'];
const FLEX_CONTACT_STEP1_IDS = ['CompanyName', 'PostCode', 'JobTitle', 'Department', 'Country', 'PrimaryProductOfInterest'];

/** Expanded (flex_event): strategy_webinar – 7 fields */
const FLEX_EVENT_FIELD_IDS = ['FirstName', 'LastName', 'BusinessEmail', 'JobTitle', 'Department', 'CompanyName', 'Country'];
const FLEX_EVENT_STEP0_IDS = ['FirstName', 'LastName', 'BusinessEmail'];
const FLEX_EVENT_STEP1_IDS = ['JobTitle', 'Department', 'CompanyName', 'Country'];

/** Essential (flex_content): whitepaper_form – 5 fields */
const FLEX_CONTENT_FIELD_IDS = ['FirstName', 'LastName', 'BusinessEmail', 'CompanyName', 'Country'];
const FLEX_CONTENT_STEP0_IDS = ['FirstName', 'LastName', 'BusinessEmail', 'CompanyName', 'Country'];

/**
 * Get RenderConfig for a template (steps, fields, default subtype).
 * @param {'flex_contact' | 'flex_event' | 'flex_content'} template
 * @param {object} overrides - optional overrides (formId, features, success, etc.)
 */
export function getConfigForTemplate(template, overrides = {}) {
  let steps;
  let fieldIds;
  let subtype;

  switch (template) {
    case 'flex_event':
      steps = [
        { stepIndex: 0, fieldIds: FLEX_EVENT_STEP0_IDS },
        { stepIndex: 1, fieldIds: FLEX_EVENT_STEP1_IDS },
      ];
      fieldIds = FLEX_EVENT_FIELD_IDS;
      subtype = 'strategy_webinar';
      break;
    case 'flex_content':
      steps = [{ stepIndex: 0, fieldIds: FLEX_CONTENT_STEP0_IDS }];
      fieldIds = FLEX_CONTENT_FIELD_IDS;
      subtype = 'whitepaper_form';
      break;
    case 'flex_contact':
    default:
      steps = [
        { stepIndex: 0, fieldIds: FLEX_CONTACT_STEP0_IDS },
        { stepIndex: 1, fieldIds: FLEX_CONTACT_STEP1_IDS },
      ];
      fieldIds = FLEX_CONTACT_FIELD_IDS;
      subtype = 'request_for_information';
      break;
  }

  const step0Count = steps[0].fieldIds.length;
  let fields = fieldsForIds(fieldIds, step0Count);
  if (template === 'flex_contact' || template === 'flex_event') {
    fields = fields.map((f) => ({ ...f, required: true }));
  }

  const formHeadingKeys = {
    flex_contact: 'formHeadingRequestForInformation',
    flex_event: 'formHeadingStrategyWebinar',
    flex_content: 'formHeadingWhitepaperForm',
  };

  return {
    formId: 'demo-2277',
    template,
    subtype,
    steps,
    fields,
    formHeadingKey: formHeadingKeys[template],
    success: { type: 'message', content: '' },
    features: {
      multiStep: false,
      progressiveProfiling: false,
      companyEnrichment: false,
      privacyByCountry: false,
      conditionalVisibility: false,
    },
    ...overrides,
  };
}

export const DEFAULT_RENDER_CONFIG = getConfigForTemplate('flex_contact');

export const PRESETS = [
  {
    id: 'short',
    labelKey: 'presetShort',
    config: {
      ...getConfigForTemplate('flex_content'),
      formId: 'demo-short',
      features: {
        multiStep: false,
        progressiveProfiling: false,
        companyEnrichment: false,
        privacyByCountry: false,
        conditionalVisibility: false,
      },
    },
  },
  {
    id: 'multiStepPP',
    labelKey: 'presetMultiStepPP',
    config: {
      ...getConfigForTemplate('flex_contact'),
      formId: 'demo-ms-pp',
      features: {
        multiStep: true,
        progressiveProfiling: true,
        companyEnrichment: false,
        privacyByCountry: false,
        conditionalVisibility: false,
      },
    },
  },
  {
    id: 'multiStep3',
    labelKey: 'presetMultiStep3',
    config: {
      ...getConfigForTemplate('flex_contact'),
      formId: 'demo-ms-3step',
      steps: [
        { stepIndex: 0, fieldIds: ['BusinessEmail', 'Country'] },
        { stepIndex: 1, fieldIds: ['FirstName', 'LastName', 'BusinessPhone', 'CompanyName', 'PostCode'] },
        { stepIndex: 2, fieldIds: ['JobTitle', 'Department', 'PrimaryProductOfInterest'] },
      ],
      features: {
        multiStep: true,
        progressiveProfiling: false,
        companyEnrichment: false,
        privacyByCountry: false,
        conditionalVisibility: false,
      },
    },
  },
  {
    id: 'allFeatures',
    labelKey: 'presetAllFeatures',
    config: {
      ...getConfigForTemplate('flex_contact'),
      formId: 'demo-all',
      features: {
        multiStep: true,
        progressiveProfiling: true,
        companyEnrichment: true,
        privacyByCountry: true,
        conditionalVisibility: true,
      },
    },
  },
];
