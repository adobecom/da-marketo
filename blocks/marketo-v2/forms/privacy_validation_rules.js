// ##
// ## Updated 20240605T191318
// ##
// ##
// ##
// ## Privacy Validation - Rules
// ##
// ##
// ####################################################################
//
// Supported Languages, this must align with Marketo Segmentation
//
var DEFAULT_LANGUAGE = "en_us";
var SUPPORTED_LANGUAGES = [
  "en_us", // English (United States)
  "en_gb", // English (United Kingdom) en_gb
  "es_es", // Spanish (Spain)
  "fr_fr", // French (France)
  "ja_jp", // Japanese (Japan)
  "zh_tw", // Chinese (Traditional, Taiwan)
  "zh_cn", // Chinese (Simplified, China)
  "ko", // Korean
  "de", // German
  "da", // Danish
  "sv", // Swedish
  "it", // Italian
  "nl", // Dutch
  "no", // Norwegian
  "pt", // Portuguese
  "fi", // Finnish
  "ru", // Russian
  "tr", // Turkish
  "pl", // Polish
  "cs", // Czech
];

var adobeRegionalSite = {
   ar_ae: "ae_ar", //الإمارات العربية المتحدة >> Arabic
  ar_eg: "eg_ar", //مصر - اللغة العربية
  ar_iq: "mena_ar", //الشرق الأوسط وشمال أفريقيا - اللغة العربية
  ar_kw: "kw_ar", //الكويت - اللغة العربية
  ar_qa: "qa_ar", //قطر - اللغة العربية
  ar_sa: "sa_ar", //المملكة العربية السعودية

  bg_bg: "bg", //България >> Bulgarian

  cs_cz: "cz", //Česká republika >> Czech

  da_dk: "dk", //Danmark >> Danish

  de_at: "at", //Österreich >> German
  de_ch: "ch_de", //Schweiz
  de_de: "de", //Deutschland

  de_lu: "lu_de", //Luxembourg - Deutsch

  el_gr: "gr_el", //Ελλάδα >> Greek

  en_us: "", //United States
  en_gb: "uk", //United Kingdom
  en_au: "au", //Australia
  en_ca: "ca", //Canada - English
  en_ae: "ae_en", //United Arab Emirates - English
  en_be: "be_en", //Belgium - English
  en_dz: "mena_en", //Middle East and North Africa - English
  en_eg: "eg_en", //Egypt - English
  en_gr: "gr_en", //Greece - English
  en_hk: "hk_en", //Hong Kong SAR of China
  en_id: "id_en", //Indonesia - English
  en_ie: "ie", //Ireland
  en_il: "il_en", //Israel - English
  en_in: "in", //India - English
  en_kw: "kw_en", //Kuwait - English
  en_lu: "lu_en", //Luxembourg - English
  en_ma: "africa", //Africa - English
  en_my: "my_en", //Malaysia - English
  en_ng: "ng", //Nigeria
  en_nz: "nz", //New Zealand
  en_ph: "ph_en", //Philippines - English
  en_qa: "qa_en", //Qatar - English
  en_sa: "sa_en", //Saudi Arabia - English
  en_sg: "sg", //Singapore
  en_th: "th_en", //Thailand - English
  en_vn: "vn_en", //Vietnam - English
  en_za: "za", //South Africa

  es_es: "es", //España
  es_ar: "ar", //Argentina >> Spanish
  es_cl: "cl", //Chile
  es_co: "co", //Colombia
  es_cr: "cr", //Costa Rica
  es_ec: "ec", //Ecuador
  es_gt: "gt", //Guatemala
  es_mx: "mx", //México
  es_pe: "pe", //Perú
  es_pr: "pr", //Puerto Rico
  es_sv: "la", //Latinoamérica
  es_la: "la", //Latinoamérica

  et_ee: "ee", //Eesti >> Estonian

  fi_fi: "fi", //Suomi >> Finnish

  fl_ph: "ph_fil", //Pilipinas

  fr_fr: "fr", //France
  fr_be: "be_fr", //Belgique - Français >> French
  fr_ca: "ca_fr", //Canada - Français
  fr_ch: "ch_fr", //Suisse
  fr_lu: "lu_fr", //Luxembourg - Français

  he_il: "il_he", //ישראל - עברית  >> Hebrew

  hi_in: "in_hi", //भारत >> Hindi

  hu_hu: "hu", //Magyarország >> Hungarian

  id_id: "id_id", //Indonesia

  it_ch: "ch_it", //Svizzera >> Italian
  it_it: "it", //Italia

  ja_jp: "jp", //日本 >> Japanese

  ko_kr: "kr", //한국 >> Korean

  lt_lt: "lt", //Lietuva >> Lithuanian

  lv_lv: "lv", //Latvija >> Latvian

  ms_my: "my_ms", //Malaysia >> Malay

  nb_no: "no", //Norge >> Norwegian

  nl_be: "be_nl", //België - Nederlands >> Dutch
  nl_nl: "nl", //Nederland

  pl_pl: "pl", //Polska >> Polish

  pt_br: "br", //Brasil >> Portuguese
  pt_pt: "pt", //Portugal

  ro_ro: "ro", //România >> Romanian

  ru_ru: "ru", //Россия >> Russian

  sk_sk: "sk", //Slovensko >> Slovak

  sl_si: "si", //Slovenija >> Slovenian

  sv_se: "se", //Sverige >> Swedish

  th_th: "th_th", //ประเทศไทย >> Thai

  tr_tr: "tr", //Türkiye  >> Turkish

  uk_ua: "ua", //Україна >> Ukrainian

  vi_vn: "vn_vi", //Việt Nam >> Vietnamese

  zh_hans_cn: "cn", //中国 >> Simplified Chinese
  zh_hk: "hk_zh", //中國香港特別行政區 >> Traditional Chinese
  zh_tw: "tw", //台灣地區 >> Traditional Chinese
};

//
//
// Special Rule for language codes which don't match up with Privacy Code Format
// If language code matches the left change it to the right.
//
var langCode_to_privacylangCode = {
  zh_cn: "cn",
  zh_tw: "tw",
  cy_en: "en",
  gr_en: "en",
  lu_en: "en",
  be_nl: "nl",
  ch_nl: "nl",
  be_fr: "fr",
  ch_fr: "fr",
  hk_zh: "zh",
  ch_it: "it",
  ko: "kr",
  "ja_jp": "jp",
};
//
// EU+ Countries specific for privacy code rules
var B2B_RFI_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "DE",
  "GR",
  "HU",
  "IT",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "RO",
  "RU",
  "SK",
  "SI",
  "ES",
  "CH",
];

// ##
// ##
// ## Privacy Code Rules
// ##
// ##########################
//
// Privacy Code Default Rules

var PRIVACY_CODE_DEFAULT = {
  purpose: [""],
  countries: [""],
  privacycode: "cs1F;ve1;<lc>",
  optin_style: "implicit",
  methods: ["email"],
  privacy_links: {
    "global-privacy-policy": "https://www.adobe.com/privacy/policy.html",
    "privacy-policy-info-transfer": "https://www.adobe.com/privacy/policy.html#info-transfer",
    "global-privacy-policy-info-share": "https://www.adobe.com/privacy/policy.html#info-share",
    "global-privacy-marketing-email": "https://www.adobe.com/privacy/marketing.html#mktg-email",
    "global-optout-comm": "https://www.adobe.com/privacy/opt-out.html#communication",
    "accounts-adobe": "https://accounts.adobe.com/",
    "regional-privacy-policy": "https://www.adobe.com/{adobeRegionalSite}/privacy/policy.html", //see adobeRegionalSite for examples,
    "regional-privacy-policy-info-share": "https://www.adobe.com/{adobeRegionalSite}/privacy/policy.html#info-share",
    "regional-privacy-marketing-email": "https://www.adobe.com/{adobeRegionalSite}/privacy/marketing.html#mktg-email",
    "regional-optout-comm": "https://www.adobe.com/{adobeRegionalSite}/privacy/opt-out.html#communication"
  },
};

//
// Privacy Code Rules
var PRIVACY_CODE_RULES = [
  {
    purpose: [""],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: [""],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: [""],
    countries: ["CN"], // China
    privacycode: "ch1B;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email"],
    privacy_links: {
      "ch-kr-privacy-policy": "https://www.adobe.com/cn/privacy/china-privacy-policy.html"
  },
  },
  {
    purpose: [""],
    countries: ["CN"], // China
    privacycode: "ch1B;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
    privacy_links: {
      "ch-kr-privacy-policy": "https://www.adobe.com/cn/privacy/china-privacy-policy.html"
  },
  },
  {
    purpose: [""],
    countries: ["KR"], // Korea
    privacycode: "sk1A;ve3;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
    privacy_links: {
      "ch-kr-privacy-policy": "https://www.adobe.com/privacy/korean-privacy-policy.html"
  },
  },
  {
    purpose: [""],
    countries: ["KR"], // Korea
    privacycode: "sk1A;ve2;<lc>",
    optin_style: "explicit",
    methods: ["email"],
    privacy_links: {
      "ch-kr-privacy-policy": "https://www.adobe.com/privacy/korean-privacy-policy.html"
  },  },
  {
    purpose: [""],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs3I;ve2;<lc>-<partner>",
    optin_style: "implicit",
    methods: ["email", "phone", "partner"],
    privacy_links: {},
  },
  {
    purpose: ["request_for_information"],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs3G;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: ["whitepaper_form"],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs1F;ve1;<lc>-",
    optin_style: "implicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: [""],
    countries: [""],
    privacycode: "cs3H;ve2;<lc>-<partner>",
    optin_style: "implicit",
    methods: ["email", "phone", "mail", "partner"],
    privacy_links: {},
  },
  {
    purpose: ["strategy_webinar", "whitepaper_form", "nurture"],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email"],
    privacy_links: {},
  },
  {
    purpose: ["seminar", "event_registration", "event_attendance"],
    countries: B2B_RFI_COUNTRIES, // EU Countries
    privacycode: "cs3G;ve3;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: [""],
    countries: ["AU", "SG"], // Australia, Singapore
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: ["trial_download"],
    countries: ["AU", "SG"], // Australia, Singapore
    privacycode: "cs3B;ve1;<lc>",
    optin_style: "explicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: ["trial_download"],
    countries: B2B_RFI_COUNTRIES, // Some EU Countries + Canada + ROW
    privacycode: "cs2A;ve1;<lc>",
    optin_style: "soft",
    methods: ["email"],
    privacy_links: {},
  },
  {
    purpose: ["whitepaper_form", "nurture", "strategy_webinar"],
    countries: [""],
    privacycode: "cs1F;ve1;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone"],
    privacy_links: {},
  },
  {
    purpose: [""],
    countries: [""],
    privacycode: "cs1B;ve3;<lc>",
    optin_style: "implicit",
    methods: ["email", "phone", "mail"],
    privacy_links: {},
  },
];

// ##
// ##