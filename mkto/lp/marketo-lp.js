(function(){
  
  /*******************/
  /* from scripts.js */
  /*******************/

  /* check with web team if config can be simplified for engage.adobe.com */
  const CONFIG = {
    imsClientId: 'bacom',
    imsScope: 'AdobeID,openid,gnav,pps.read,firefly_api,additional_info.roles,read_organizations,account_cluster.read',
    local: {
      pdfViewerClientId: '3b685312b5784de6943647df19f1f492',
      pdfViewerReportSuite: 'adbadobedxqa',
    },
    page: {
      pdfViewerClientId: 'ce759fc714064892aec63d71b39b6f3e',
      pdfViewerReportSuite: 'adbadobedxqa',
    },
    live: {
      pdfViewerClientId: 'c4728f7d1a344f74b04252d1259a986c',
      pdfViewerReportSuite: 'adbadobedxqa',
    },
    stage: {
      edgeConfigId: '7d1ba912-10b6-4384-a8ff-4bfb1178e869',
      pdfViewerClientId: '1573324fdb644866b51580fbaa5b6465',
      pdfViewerReportSuite: 'adbadobedxqa',
    },
    prod: {
      edgeConfigId: '65acfd54-d9fe-405c-ba04-8342d6782ab0',
      pdfViewerClientId: '16769f4e1e7b4e3b94c1ed23eafb8870',
      pdfViewerReportSuite: 'adbadobenonacdcprod,adbadobedxprod,adbadobeprototype',
    },
    locales: {
      '': { ietf: 'en-US', tk: 'hah7vzn.css' },
      africa: { ietf: 'en', tk: 'hah7vzn.css', base: '' },
      ara: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
      at: { ietf: 'de-AT', tk: 'hah7vzn.css', exl: 'de', base: 'de' },
      au: { ietf: 'en-AU', tk: 'hah7vzn.css' },
      be_en: { ietf: 'en-BE', tk: 'hah7vzn.css', base: '' },
      be_fr: { ietf: 'fr-BE', tk: 'hah7vzn.css', exl: 'fr', base: 'fr' },
      be_nl: { ietf: 'nl-BE', tk: 'qxw8hzm.css', exl: 'nl' },
      bg: { ietf: 'bg-BG', tk: 'qxw8hzm.css', base: '' },
      br: { ietf: 'pt-BR', tk: 'hah7vzn.css', exl: 'pt-br', base: 'pt' },
      ca_fr: { ietf: 'fr-CA', tk: 'hah7vzn.css', exl: 'fr', base: 'fr' },
      ca: { ietf: 'en-CA', tk: 'hah7vzn.css', base: '' },
      ch_de: { ietf: 'de-CH', tk: 'hah7vzn.css', exl: 'de', base: 'de' },
      ch_fr: { ietf: 'fr-CH', tk: 'hah7vzn.css', exl: 'fr', base: 'fr' },
      ch_it: { ietf: 'it-CH', tk: 'hah7vzn.css', exl: 'it', base: 'it' },
      cn: { ietf: 'zh-CN', tk: 'qxw8hzm', exl: 'zh-hans', base: '' },
      cy_en: { ietf: 'en-CY', tk: 'hah7vzn.css' },
      cz: { ietf: 'cs-CZ', tk: 'qxw8hzm.css', base: '' },
      de: { ietf: 'de-DE', tk: 'hah7vzn.css', exl: 'de' },
      dk: { ietf: 'da-DK', tk: 'qxw8hzm.css', base: '' },
      ee: { ietf: 'et-EE', tk: 'qxw8hzm.css', base: '' },
      el: { ietf: 'el', tk: 'qxw8hzm.css' },
      es: { ietf: 'es-ES', tk: 'hah7vzn.css', exl: 'es' },
      fi: { ietf: 'fi-FI', tk: 'qxw8hzm.css', base: '' },
      fr: { ietf: 'fr-FR', tk: 'hah7vzn.css', exl: 'fr' },
      gr_el: { ietf: 'el', tk: 'qxw8hzm.css' },
      gr_en: { ietf: 'en-GR', tk: 'hah7vzn.css', base: '' },
      hk_en: { ietf: 'en-HK', tk: 'hah7vzn.css', base: '' },
      hk_zh: { ietf: 'zh-HK', tk: 'jay0ecd', exl: 'zh-hant' },
      hu: { ietf: 'hu-HU', tk: 'qxw8hzm.css' },
      id_en: { ietf: 'en', tk: 'hah7vzn.css', base: '' },
      id_id: { ietf: 'id', tk: 'qxw8hzm.css' },
      ie: { ietf: 'en-GB', tk: 'hah7vzn.css', base: '' },
      il_en: { ietf: 'en-IL', tk: 'hah7vzn.css', base: '' },
      il_he: { ietf: 'he', tk: 'qxw8hzm.css', dir: 'rtl' },
      in_hi: { ietf: 'hi', tk: 'qxw8hzm.css' },
      in: { ietf: 'en-IN', tk: 'hah7vzn.css' },
      it: { ietf: 'it-IT', tk: 'hah7vzn.css', exl: 'it' },
      jp: { ietf: 'ja-JP', tk: 'dvg6awq', exl: 'ja' },
      kr: { ietf: 'ko-KR', tk: 'qjs5sfm', exl: 'ko' },
      la: { ietf: 'es-LA', tk: 'hah7vzn.css', exl: 'es', base: 'es' },
      langstore: { ietf: 'en-US', tk: 'hah7vzn.css' },
      lt: { ietf: 'lt-LT', tk: 'qxw8hzm.css' },
      lu_de: { ietf: 'de-LU', tk: 'hah7vzn.css', exl: 'de', base: 'de' },
      lu_en: { ietf: 'en-LU', tk: 'hah7vzn.css', base: '' },
      lu_fr: { ietf: 'fr-LU', tk: 'hah7vzn.css', exl: 'fr', base: 'fr' },
      lv: { ietf: 'lv-LV', tk: 'qxw8hzm.css' },
      mena_ar: { ietf: 'ar', tk: 'qxw8hzm.css', dir: 'rtl' },
      mena_en: { ietf: 'en', tk: 'hah7vzn.css', base: '' },
      mt: { ietf: 'en-MT', tk: 'hah7vzn.css' },
      my_en: { ietf: 'en-GB', tk: 'hah7vzn.css', base: '' },
      my_ms: { ietf: 'ms', tk: 'qxw8hzm.css' },
      nl: { ietf: 'nl-NL', tk: 'qxw8hzm.css', exl: 'nl', base: '' },
      no: { ietf: 'no-NO', tk: 'qxw8hzm.css', base: '' },
      nz: { ietf: 'en-GB', tk: 'hah7vzn.css', base: '' },
      ph_en: { ietf: 'en', tk: 'hah7vzn.css', base: '' },
      ph_fil: { ietf: 'fil-PH', tk: 'qxw8hzm.css' },
      pl: { ietf: 'pl-PL', tk: 'qxw8hzm.css', base: '' },
      pt: { ietf: 'pt-PT', tk: 'hah7vzn.css', exl: 'pt-br' },
      ro: { ietf: 'ro-RO', tk: 'qxw8hzm.css', base: '' },
      ru: { ietf: 'ru-RU', tk: 'qxw8hzm.css', base: '' },
      se: { ietf: 'sv-SE', tk: 'qxw8hzm.css', exl: 'sv', base: '' },
      sg: { ietf: 'en-SG', tk: 'hah7vzn.css', base: '' },
      si: { ietf: 'sl-SI', tk: 'qxw8hzm.css', base: '' },
      sk: { ietf: 'sk-SK', tk: 'qxw8hzm.css', base: '' },
      th_en: { ietf: 'en', tk: 'hah7vzn.css', base: '' },
      th_th: { ietf: 'th', tk: 'lqo2bst.css' },
      tr: { ietf: 'tr-TR', tk: 'qxw8hzm.css', base: '' },
      tw: { ietf: 'zh-TW', tk: 'jay0ecd', exl: 'zh-hant', base: '' },
      ua: { ietf: 'uk-UA', tk: 'qxw8hzm.css', base: '' },
      uk: { ietf: 'en-GB', tk: 'hah7vzn.css' },
      vn_en: { ietf: 'en-GB', tk: 'hah7vzn.css', base: '' },
      vn_vi: { ietf: 'vi', tk: 'qxw8hzm.css' },
    },
    geoRouting: 'on',
    productionDomain: 'business.adobe.com',
    prodDomains: ['business.adobe.com', 'www.adobe.com', 'helpx.adobe.com'],
    autoBlocks: [
      { iframe: 'https://adobe-ideacloud.forgedx.com' },
      { iframe: 'https://adobe.ideacloud.com' },
    ],
    htmlExclude: [
      /business\.adobe\.com\/(\w\w(_\w\w)?\/)?blog(\/.*)?/,
      /experience\.adobe\.com(\/.*)?/,
    ],
    useDotHtml: true,
    dynamicNavKey: 'bacom',
    stageDomainsMap: {
      'business.stage.adobe.com': {
        'business.adobe.com': 'origin',
        'helpx.adobe.com': 'helpx.stage.adobe.com',
      },
      '.business-graybox.adobe.com': { 'business.adobe.com': 'origin' },
    },
    jarvis: {
      id: 'BACOMChat1-Worldwide',
      version: '1.0',
      onDemand: false,
    },
    arp: { clientId: 'bacom' },
    atvCaptionsKey: 'bacom',
    uniqueSiteId: 'da-bacom',
    mepLingoCountryToRegion: {
      africa: ['ke', 'mu', 'ng', 'za'],
      la: ['ag', 'ar', 'bo', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'gt', 'hn', 'mx', 'ni', 'pa', 'pe', 'pr', 'py', 'sv', 'uy', 've', 'tt', 'jm', 'bb'],
      mena_en: ['ae', 'af', 'bh', 'dz', 'eg', 'iq', 'ir', 'jo', 'kw', 'lb', 'ly', 'ma', 'om', 'ps', 'qa', 'sa', 'sy', 'tn', 'ye'],
    },
    lingoProjectSuccessLogging: 'on',
    onlybanner: true,
    adobeid: {
      enableGuestAccounts: true,
      enableGuestTokenForceRefresh: true,
      enableGuestBotDetection: false,
      api_parameters: { check_token: { guest_allowed: true } },
      onTokenExpired: () => {
        window.location.reload();
      },
    },
    /* not needed
    mep: {
      blocks: {
        'global-navigation': `${LIBS}/blocks/global-navigation`,
        'global-footer': `${LIBS}/blocks/global-footer`,
      },
    },
    */
  };

  /*****************/
  /* from utils.js */
  /*****************/

  const PAGE_URL = new URL(window.location.href);
  const SLD = 'aem';

  /* not needed? */
  const ENVS = {
    stage: {
      name: 'stage',
      ims: 'stg1',
      adobeIO: 'pps-stage.adobe.io',
      adminconsole: 'stage.adminconsole.adobe.com',
      account: 'stage.account.adobe.com',
      edgeConfigId: '8d2805dd-85bf-4748-82eb-f99fdad117a6',
      pdfViewerClientId: 'a76f1668fd3244d98b3838e189900a5e',
    },
    prod: {
      name: 'prod',
      ims: 'prod',
      adobeIO: 'pps.adobe.io',
      adminconsole: 'adminconsole.adobe.com',
      account: 'account.adobe.com',
      edgeConfigId: '2cba807b-7430-41ae-9aac-db2b0da742d5',
      pdfViewerClientId: '3c0a5ddf2cc04d3198d9e48efc390fa9',
    },
  };

  const MILO_EVENTS = { // not applicable, or needs replacement. Seek web team to review 
    DEFERRED: 'milo:deferred',
    QUERY_INDEX_PRIMARY_LOADED: 'milo:query-index:primary-loaded',
    QUERY_INDEX_ALL_LOADED: 'milo:query-index:all-loaded',
  };

  // using static for now
  function getEnv(conf) {
    /*
    const { host } = window.location;
    const query = PAGE_URL.searchParams.get('env');

    if (query) return { ...ENVS[query], consumer: conf[query] };

    const { clientEnv } = conf;
    if (clientEnv) return { ...ENVS[clientEnv], consumer: conf[clientEnv] };

    if (host.includes('localhost')) return { ...ENVS.local, consumer: conf.local };
    // c8 ignore start 
    if (host.includes(`${SLD}.page`)
      || host.includes(`${SLD}.live`)
      || host.includes('stage.adobe')
      || host.includes('corp.adobe')
      || host.includes('graybox.adobe')
      || host.includes('aem.reviews')) {
      return { ...ENVS.stage, consumer: conf.stage };
    }
    */
    return { ...ENVS.prod, consumer: conf.prod };
    // c8 ignore stop 
  }

  /* not needed for now !! may need other methods like a token to set locale !!
  function getLocale(locales, pathname = window.location.pathname) {
    if (!locales) return { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' };

    const split = pathname.split('/');
    const localeString = split[1];
    const specialPrefix = [LANGSTORE, PREVIEW].includes(localeString) ? localeString : '';
    const ietfSegment = split[2];

    let matchedKey = '';
    if (specialPrefix) {
      matchedKey = Object.keys(locales).find((key) => locales[key]?.ietf?.startsWith(ietfSegment)) ?? '';
    } else if (localeString in locales) {
      matchedKey = localeString;
    }

    const locale = hydrateLocale(locales, matchedKey);
    if (specialPrefix) locale.prefix = `/${specialPrefix}${ietfSegment ? `/${ietfSegment}` : ''}`;
    return locale;
  }
  */

  /* not needed for now !! may need other methods like a token to set locale !!
  function getLanguage(languages, locales, pathname = window.location.pathname) {
    const split = pathname.split('/');
    const locOffset = [LANGSTORE, PREVIEW].includes(split[1]) ? 1 : 0;
    const languageString = split[locOffset + 1];
    const region = split[locOffset + 2];
    let regionPath = '';

    const language = languages?.[languageString];
    if (language && region && language.regions) {
      const [matchingRegion] = language.regions.filter((r) => r.region === region);
      if (matchingRegion?.region) language.region = matchingRegion.region;
      if (matchingRegion?.ietf) language.ietf = matchingRegion.ietf;
      if (matchingRegion?.tk) language.tk = matchingRegion.tk;
      regionPath = matchingRegion ? `/${region}` : '';
    }

    const isLegacyLocaleRoutingMode = !language
      || (language.languageBased === false && !language.region);
    if (isLegacyLocaleRoutingMode) {
      const locale = getLocale(locales, pathname);
      const englishLang = languages?.en;
      if (locale.prefix === '' && englishLang) {
        locale.language = DEFAULT_LANG;
        if (englishLang.region) locale.region = englishLang.region;
        if (englishLang.ietf) locale.ietf = englishLang.ietf;
        if (englishLang.tk) locale.tk = englishLang.tk;
      }
      return locale;
    }

    if (!language.ietf) language.ietf = `${languageString}${language.region ? `_${language.region.toUpperCase()}` : ''}`;
    language.language = languageString;
    language.prefix = `${languageString === DEFAULT_LANG && !regionPath ? '' : '/'}${languageString}${regionPath}`;
    return language;
  }
  */

  /* N.B. many meta tags won't be available on mcz landing pages */
  function getMetadata(name, doc = document) {
    const attr = name && name.includes(':') ? 'property' : 'name';
    const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
    return meta && meta.content;
  }

  /* not needed?
  function setupMiloObj(config) {
    window.milo ||= {};
    window.milo.deferredPromise = new Promise((resolve) => {
      config.resolveDeferred = resolve;
    });
  }
  */
 
  const [setConfig, updateConfig, getConfig] = (() => {
    let config = {};
    return [
      (conf) => {
        const origin = conf.origin || window.location.origin;
        const pathname = conf.pathname || window.location.pathname;
        config = { env: getEnv(conf), ...conf };
        config.codeRoot = conf.codeRoot ? `${origin}${conf.codeRoot}` : origin;
        config.base = config.miloLibs || config.codeRoot;
        // config.locale = conf.languages ? getLanguage(conf.languages, conf.locales, pathname) : getLocale(conf.locales, pathname); // static for now
        config.locale = { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' }; // static for now
        config.pathname = pathname;
        // config.autoBlocks = conf.autoBlocks ? [...AUTO_BLOCKS, ...conf.autoBlocks] : AUTO_BLOCKS; // not needed on mcz LP
        // config.signInContext = conf.signInContext || {}; // not needed on mcz LP
        // config.doNotInline = conf.doNotInline ? [...DO_NOT_INLINE, ...conf.doNotInline] : DO_NOT_INLINE; // not needed on mcz LP
        const lang = getMetadata('content-language') || config.locale.ietf;
        document.documentElement.setAttribute('lang', lang);
        try {
          const dir = getMetadata('content-direction')
            || config.locale.dir
            || (config.locale.ietf && (new Intl.Locale(config.locale.ietf)?.textInfo?.direction))
            || 'ltr';
          document.documentElement.setAttribute('dir', dir);
        } catch (e) {
          console.log('Invalid or missing locale:', e);
        }
        config.locale.contentRoot = `${origin}${config.locale.prefix}${config.contentRoot ?? ''}`;
        // config.useDotHtml = !PAGE_URL.origin.includes(`.${SLD}.`) && (conf.useDotHtml ?? PAGE_URL.pathname.endsWith('.html')); // not needed on mcz LP
        // config.entitlements = handleEntitlements; // not needed on mcz LP
        // config.consumerEntitlements = conf.entitlements || []; // not needed on mcz LP
        // setupMiloObj(config); // not needed on mcz LP

        return config;
      },
      (conf) => (config = conf),
      () => config,
    ];
  })();

  setConfig({ ...CONFIG }); // { ...eventConfigItems, decorateArea, miloLibs: LIBS } not needed on mcz LP

  function log(msg, opts) { // local logging with potential to implement lana logging 
    opts = opts || {};
    if (window.lana && typeof window.lana.log === 'function') {
      window.lana.log(msg, opts);
      return;
    }
    var fn = /^e/.test(opts.severity || '') ? 'error' : (/^w/.test(opts.severity || '') ? 'warn' : 'info');
    console[fn]('[bacom-marketo] ' + msg, opts.tags || ''); 
  }

  function createTag(tag, attributes, html, options = {}) {
    const el = document.createElement(tag);
    if (html) {
      if (html.nodeType === Node.ELEMENT_NODE
        || html instanceof SVGElement
        || html instanceof DocumentFragment) {
        el.append(html);
      } else if (Array.isArray(html)) {
        el.append(...html);
      } else {
        el.insertAdjacentHTML('beforeend', html);
      }
    }
    if (attributes) {
      Object.entries(attributes).forEach(([key, val]) => {
        el.setAttribute(key, val);
      });
    }
    options.parent?.append(el);
    return el;
  }

  const loadScript = (url, type, { mode, id } = {}) => new Promise((resolve, reject) => {
    let script = document.querySelector(`head > script[src="${url}"]`);
    if (!script) {
      const { head } = document;
      script = document.createElement('script');
      script.setAttribute('src', url);
      if (id) script.setAttribute('id', id);
      if (type) {
        script.setAttribute('type', type);
      }
      if (['async', 'defer'].includes(mode)) script.setAttribute(mode, true);
      head.append(script);
    }

    if (script.dataset.loaded) {
      resolve(script);
      return;
    }

    const onScript = (event) => {
      script.removeEventListener('load', onScript);
      script.removeEventListener('error', onScript);

      if (event.type === 'error') {
        reject(new Error(`error loading script: ${script.src}`));
      } else if (event.type === 'load') {
        script.dataset.loaded = true;
        resolve(script);
      }
    };

    script.addEventListener('load', onScript);
    script.addEventListener('error', onScript);
  });

  async function customFetch({ resource, withCacheRules }) {
    const options = {};
    if (withCacheRules) {
      const params = new URLSearchParams(window.location.search);
      options.cache = params.get('cache') === 'off' ? 'reload' : 'default';
    }
    return fetch(resource, options);
  }

  const b64ToUtf8 = (str) => decodeURIComponent(escape(window.atob(str)));

  function parseEncodedConfig(encodedConfig) {
    try {
      return JSON.parse(b64ToUtf8(decodeURIComponent(encodedConfig)));
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  function createIntersectionObserver({ el, callback, once = true, options = {} }) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          if (once) observer.unobserve(entry.target);
          callback(entry.target, entry);
        }
      });
    }, options);
    io.observe(el);
    return io;
  }

  /*******************/
  /* from actions.js */
  /*******************/

  function debounce(callback, time = 300) { // for multi step forms
    if (typeof callback !== 'function') return undefined;

    let timer = null;

    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), time);
    };
  }

  /************************/
  /* from placeholders.js */
  /************************/

  const fetchedPlaceholders = {};

  window.mph = {};

  getPlaceholdersPath = (config, sheet) => {
    const path = `https://business.adobe.com/placeholders.json`; // `${config.locale.contentRoot}/placeholders.json`; // static for now, add region /${region}/ later
    const query = sheet !== 'default' && typeof sheet === 'string' && sheet.length ? `?sheet=${sheet}` : '';
    return `${path}${query}`;
  };

  const parsePlaceholderJson = async (resp, placeholders) => {
    try {
      const json = resp.ok ? await resp.json() : { data: [] };
      json.data?.forEach((item) => {
        window.mph[item.key] = item.value;
        placeholders[item.key] = item.value;
      });
    } catch (e) {
      log(`Error parsing placeholder json: ${e.message}`, { tags: 'placeholders', severity: 'error' });
    }
  };

  const fetchPlaceholder = (path, placeholderRequest) => new Promise(
    // eslint-disable-next-line no-async-promise-executor
    async (resolve) => {
      const resp = await placeholderRequest || await customFetch(
        { resource: path, withCacheRules: true },
      ).catch(() => ({}));
      const placeholders = {};

      if (Array.isArray(resp)) {
        // Overlay placeholders
        for (const r of resp) await parsePlaceholderJson(r, placeholders);
      } else {
        await parsePlaceholderJson(resp, placeholders);
      }

      resolve(placeholders);
    },
  );

  const fetchPlaceholders = async ({
    config,
    sheet,
    placeholderRequest,
    placeholderPath,
  }) => {
    const path = placeholderPath || getPlaceholdersPath(config, sheet);

    fetchedPlaceholders[path] ||= fetchPlaceholder(path, placeholderRequest);

    return fetchedPlaceholders[path];
  };

  function keyToStr(key) {
    return key.replaceAll('-', ' ');
  }

  async function getPlaceholder(key, config, sheet) {
    let defaultFetched = false;
    const defaultLocale = 'en-US';
    const geoLocDisabled = getMetadata('disable-geo-placeholders') || 'off';

    const getDefaultContentRoot = () => {
      const defaultContentRoot = config.locale.contentRoot;
      const localePrefix = config.locale.prefix;

      if (!localePrefix.length) return defaultContentRoot;

      // Certain locale prefixes are common beginnings of words, such as /es
      // This could also be part of a page path, such as '/esign'
      if (defaultContentRoot.endsWith(localePrefix)) {
        return defaultContentRoot.replace(localePrefix, '');
      }

      return defaultContentRoot.replace(`${localePrefix}/`, '/');
    };

    const getDefaultPlaceholders = async () => {
      const defaultConfig = {
        locale: {
          ietf: defaultLocale,
          contentRoot: getDefaultContentRoot(),
        },
      };

      const defaultPlaceholders = await fetchPlaceholders({ config: defaultConfig, sheet })
        .catch(() => ({}));
      defaultFetched = true;
      return defaultPlaceholders;
    };

    if (config.placeholders?.[key]) return config.placeholders[key];

    let placeholders;

    if (geoLocDisabled === 'on') {
      placeholders = await getDefaultPlaceholders();
    } else {
      placeholders = await fetchPlaceholders({ config, sheet });
    }

    if (typeof placeholders?.[key] === 'string') return placeholders[key];

    if (!defaultFetched && config.locale.ietf !== defaultLocale) {
      const defaultPlaceholders = await getDefaultPlaceholders();
      if (defaultPlaceholders?.[key]) return defaultPlaceholders[key];
    }

    return keyToStr(key);
  }

  async function replaceKey(key, config, sheet = 'default') { // for multi step forms
    if (typeof key !== 'string' || !key.length) return '';

    const label = await getPlaceholder(key, config, sheet);
    return label;
  }

  async function replaceKeyArray(keys, config, sheet = 'default') {
    if (!Array.isArray(keys) || !keys.length) return [];

    const promiseArr = [];
    keys.forEach((key) => {
      promiseArr.push(getPlaceholder(key, config, sheet));
    });

    const placeholders = await Promise.all(promiseArr);
    return placeholders;
  }

  /*******************/
  /* from marketo.js */
  /*******************/

  const ROOT_MARGIN = 50;
  const FAILURE_TIMEOUT = 10000;
  const LANA_MESSAGE = {
    RENDER_FAILED: 'Marketo form did not render',
    HANDSHAKE_FAILED: 'Marketo form handshake failed',
    RENDER_RECOVERED: 'Marketo form rendered after timeout',
    SUBMIT_FAILED: 'Marketo form submit failed',
    MARKETO_FORMS_JS: 'Marketo form failed to load forms2.min.js',
  };

  const FORM_ID = 'form id';
  const BASE_URL = 'marketo host';
  const MUNCHKIN_ID = 'marketo munckin';
  const FORM_STATUS = 'form.status';
  const FORM_XDFRAME = 'form.xdframe';
  const SUCCESS_TYPE = 'form.success.type';
  const SUCCESS_CONTENT = 'form.success.content';
  const SUCCESS_SECTION = 'form.success.section';
  const SUCCESS_HIDE_SECTION = 'form.success.hide.section';
  const FORM_MAP = {
    'success-type': SUCCESS_TYPE,
    'destination-type': SUCCESS_TYPE,
    'success-content': SUCCESS_CONTENT,
    'destination-url': SUCCESS_CONTENT,
    'success-section': SUCCESS_SECTION,
    'success-hide-section': SUCCESS_HIDE_SECTION,
    'co-partner-names': 'program.copartnernames',
    'sfdc-campaign-id': 'program.campaignids.sfdc',
    'poi-field': 'field_filters.products',
    'hardcoded-poi': 'program.poi',
    'cta-override': 'form.cta.override',
  };
  const FORM_PARAM = 'form';

  /* not used
  const MARKETO_LIBS_PARAM = 'marketolibs';
  const MARKETO_LIBS_META = 'marketo-libs';
  const MARKETO_LIBS_CLASS = 'da-marketo';
  const MARKETO_LIBS_BRANCH_RE = /^[a-zA-Z0-9_-]+$/;
  */

  const VALIDATION_STEP = { // for multi step forms
    2: [
      'name',
      'phone',
      'mktoFormsJobTitle',
      'mktoFormsFunctionalArea',
    ],
    3: [
      'company',
      'state',
      'postcode',
      'mktoFormsPrimaryProductInterest',
      'mktoFormsCompanyType',
    ],
  };

  let stepText = {}; // for multi step forms

  const isVisible = (el) => !!el && (typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));

  const setDataLayer = (key = '', value = '') => {
    window.mcz_marketoForm_pref = window.mcz_marketoForm_pref || {};
    if (!value || !key.includes('.')) return;
    const keyParts = key.split('.');
    const lastKey = keyParts.pop();
    const formDataObject = keyParts.reduce((obj, part) => {
      obj[part] = obj[part] || {};
      return obj[part];
    }, window.mcz_marketoForm_pref);
    formDataObject[lastKey] = value;
  };

  const setDataLayerObj = (formData) => {
    Object.entries(formData).forEach(([key, value]) => setDataLayer(key, value));
  };

  const getDataLayer = (key = '') => key
    .split('.')
    .reduce((obj, part) => obj?.[part], window.mcz_marketoForm_pref);

  const formValidate = (formEl) => {
    formEl.classList.remove('hide-errors');
    formEl.classList.add('show-warnings');
  };

  /* adapt to engage.adobe.com domain */
  const decorateURL = async (destination, baseURL = window.location) => {
    if (!(destination.startsWith('http') || destination.startsWith('/'))) return null;

    try {
      let destinationUrl = new URL(destination, baseURL.origin);
      const { hostname, pathname, search, hash } = destinationUrl;

      const { htmlExclude } = getConfig();
      const exclude = htmlExclude?.some((excludeRe) => excludeRe.test(destinationUrl));

      // c8 ignore next 3
      if (!hostname) {
        throw new Error('URL does not have a valid host');
      }


      if (destinationUrl.hostname.includes(`.${SLD}.`)) {
        destinationUrl = new URL(`${pathname}${search}${hash}`, baseURL.origin);
      }

      const hasFileExtension = /\.[^/.]+$/.test(pathname);
      if (baseURL.pathname.endsWith('.html') && !hasFileExtension && !pathname.endsWith('/') && !exclude) {
        destinationUrl.pathname = `${pathname}.html`;
      }

      /* not applicable to engage.adobe.com
        const localized = await localizeLinkAsync(destinationUrl.href, null, true);
        destinationUrl.pathname = new URL(localized, baseURL.origin).pathname;
      */

      return destinationUrl.href;
    } catch (e) {
      /* c8 ignore next 4 */
      log(`Error with Marketo destination URL: ${destination} ${e.message}`, { tags: 'marketo', severity: 'e' });
    }

    return null;
  };

  /* simplify and lock down success section options as no marketer would know what CSS classes to specify */
  const showSuccessSection = (formData) => {
    const show = async (sections) => {
      sections.forEach((section) => section.classList.remove('hide-block'));
      await new Promise((resolve) => { setTimeout(resolve, 300); });
      const pageTop = document.querySelector('header')?.offsetHeight ?? 0;
      const targetPosition = sections[0]?.getBoundingClientRect().top ?? 0;
      const offsetPosition = targetPosition + window.scrollY - pageTop;
      window.scrollTo(0, offsetPosition);
    };
    const showClass = formData[SUCCESS_SECTION]?.toLowerCase().replaceAll(' ', '-');
    if (!showClass) {
      log('Error showing Marketo success section', { tags: 'marketo', severity: 'w' });
      return;
    }
    let successSections = document.querySelectorAll(`.section.${showClass}`);
    show(successSections);
    document.addEventListener(
      MILO_EVENTS.DEFERRED, // find out what fires MILO_EVENTS.DEFERRED and if it's relevant 
      () => {
        successSections = document.querySelectorAll(`.section.${showClass}`);
        show(successSections);
        /* c8 ignore next 3 */
        if (!document.querySelector(`.section.${showClass}`)) {
          log(`Error showing Marketo success section ${showClass}`, { tags: 'marketo', severity: 'w' });
        }
      },
      false,
    );
  };

  const hideSuccessSection = (formData) => {
    const hide = (sections) => {
      sections.forEach((section) => section.classList.add('hide-block'));
    };
    const hideClass = formData[SUCCESS_HIDE_SECTION]?.toLowerCase().replaceAll(' ', '-');
    if (!hideClass) {
      log('Error hiding Marketo success section', { tags: 'marketo', severity: 'w' });
      return;
    }
    let hideSections = document.querySelectorAll(`.section.${hideClass}`);
    hide(hideSections);
    document.addEventListener(
      MILO_EVENTS.DEFERRED,
      () => {
        hideSections = document.querySelectorAll(`.section.${hideClass}`);
        hide(hideSections);
        /* c8 ignore next 3 */
        if (!document.querySelector(`.section.${hideClass}`)) {
          log(`Error hiding Marketo success section ${hideClass}`, { tags: 'marketo', severity: 'w' });
        }
      },
      false,
    );
  };

  const debugTags = () => {
    const len = document.cookie.length;
    const tags = ['marketo'];
    const signedIn = window.adobeIMS?.isSignedInUser(); // not appliable but doesn't matter since will silent fail
    const frameStatus = getDataLayer(FORM_XDFRAME);
    if (getDataLayer('form.id')) tags.push(`form-${getDataLayer('form.id')}`);
    if (getDataLayer('program.id')) tags.push(`program-${getDataLayer('program.id')}`);
    if (getDataLayer(FORM_STATUS)) tags.push(`status-${getDataLayer(FORM_STATUS)}`);
    if (len >= 8192) tags.push('cookie-8k');
    else if (len >= 6144) tags.push('cookie-6k');
    else if (len >= 4096) tags.push('cookie-4k');
    tags.push(`ims-${signedIn ? 'signed-in' : 'signed-out'}`);
    tags.push(frameStatus === 'ready' ? 'sync-ok' : 'sync-error');
    if (getDataLayer('form.progressive')) tags.push('progressive');
    if (getDataLayer('profile.known_visitor') === true) tags.push('known-visitor');
    tags.push(`pref-lang-${getDataLayer('profile.prefLanguage') ?? ''}`);
    return tags;
  };

  const decorateOverlay = async (el, message, callback) => {
    if (el.querySelector('.marketo-overlay')) return;
    const [errorRefresh, tryAgain] = await replaceKeyArray(['marketo-load-error', 'marketo-try-again'], getConfig());
    const formEl = el.querySelector('form');
    if (formEl) formEl.inert = true;
    const searchParams = new URLSearchParams(window.location.search);
    const debugMsg = searchParams.get('preview') === '1' ? message : '';
    const errorMessage = createTag('p', { class: 'error', id: 'marketo-error-message' }, errorRefresh);
    const formError = createTag('div', { class: 'error-container' }, errorMessage);
    if (debugMsg) {
      const debugInfo = createTag('p', { class: 'debug-info' });
      debugInfo.textContent = debugMsg;
      formError.appendChild(debugInfo);
    }
    const retryButton = createTag('button', { class: 'retry-button' }, tryAgain);
    formError.appendChild(retryButton);
    const errorOverlay = createTag(
      'div',
      {
        class: 'marketo-overlay',
        role: 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': 'marketo-error-message',
      },
      formError,
    );

    retryButton.addEventListener('click', () => {
      /* c8 ignore next 3 */
      if (formEl) formEl.inert = false;
      errorOverlay.remove();
      if (callback) callback();
    });

    el.appendChild(errorOverlay);
  };

  const logFailure = (el, msg) => {
    if (el.dataset.mktoFailed) return;
    const tags = debugTags();
    el.dataset.mktoFailed = 'true';
    log(msg, { tags: tags.join(','), severity: 'e', sampleRate: 100 });
    decorateOverlay(el, `${msg}: ${tags.join(', ')}`, () => { window.location.reload(); });
  };

  const formTimeout = (el, condition, message, timeout = FAILURE_TIMEOUT) => {
    setTimeout(() => {
      if (condition()) {
        logFailure(el, message);
      }
    }, timeout);
  };

  /* simplify and lock down success section options as no marketer would know what CSS classes to specify */
  const toggleSuccessSection = (formData) => {
    showSuccessSection(formData);
    hideSuccessSection(formData);
  };

  const formSubmit = (formEl) => {
    const el = formEl.closest('.marketo');
    const testRecord = window.mkto_isTestRecord?.();
    if (testRecord && testRecord !== 'not_test') return;
    formTimeout(el, () => !el.classList.contains('success'), LANA_MESSAGE.SUBMIT_FAILED);
  };

  const formSuccess = (formEl, formData) => {
    const el = formEl.closest('.marketo');
    const parentModal = formEl?.closest('.dialog-modal');
    const mktoSubmit = new Event('mktoSubmit');

    el.classList.add('success');
    window.dispatchEvent(mktoSubmit);
    window.mktoSubmitted = true;

    if (formData?.[SUCCESS_TYPE] === 'ims') {
      const redirect = getMetadata('marketo-ims-redirect');

      if (!redirect?.startsWith('https://')) {
        log('Marketo IMS failure, full url needed for redirect', { tags: 'marketo', severity: 'i' });
        return false;
      }

      const emailInput = formEl.querySelector('input[name="Email"]');
      const email = emailInput?.value;
      const param = getMetadata('marketo-ims');

      if (param && email) {
        window.location.href = `${redirect}?${param}=${encodeURIComponent(email)}`;
      } else {
        log('Marketo IMS failure, missing data', { tags: 'marketo', severity: 'e' });
      }
      return false;
    }

    /* c8 ignore next 5 */
    if (parentModal) {
      const closeButton = parentModal.querySelector('.dialog-close');
      closeButton.click();
      return false;
    }

    if (formData?.[SUCCESS_TYPE] !== 'section') return true;
    toggleSuccessSection(formData);
    setDataLayer(SUCCESS_TYPE, 'message');
    return false;
  };

  const readyForm = (form, formData) => {
    const formEl = form.getFormElem().get(0);
    const el = formEl.closest('.marketo');
    const isDesktop = matchMedia('(min-width: 900px)');
    el.classList.remove('loading');

    const handleIframeReady = (event) => {
      if (event.origin !== 'https://engage.adobe.com') return;
      const message =  event.data; // JSON.parse(event.data); // why does payload differ on BACOM? expecting {mktoReady:true} but getting a richer obj
      if (!message.id) return; // if (!message.mktoReady) return; // changed for mcz LP
      const hadFailed = el.dataset.mktoFailed === 'true';
      setDataLayer(FORM_XDFRAME, 'ready');
      const formVisible = isVisible(formEl);
      if (hadFailed && formVisible) {
        log(LANA_MESSAGE.RENDER_RECOVERED, { tags: 'marketo,render-recovered', severity: 'i', sampleRate: 100 });
        delete el.dataset.mktoFailed;
        el.querySelector('.marketo-overlay')?.remove();
        formEl.inert = false;
      }
      window.removeEventListener('message', handleIframeReady);
    };
    window.addEventListener('message', handleIframeReady);
    formTimeout(el, () => getDataLayer(FORM_XDFRAME) !== 'ready', LANA_MESSAGE.HANDSHAKE_FAILED);

    formEl.addEventListener('focus', ({ target }) => {
      /* c8 ignore next 9 */
      const hasError = formEl.classList.contains('show-warnings');
      const firstInvalidField = formEl.querySelector('.mktoRequired[aria-invalid=true]');
      if (!['text', 'email', 'tel', 'textarea'].includes(target.type)
        || (isDesktop.matches && !(hasError && target === firstInvalidField))) return;

      const pageTop = document.querySelector('header')?.offsetHeight ?? 0;
      const targetPosition = target?.getBoundingClientRect().top ?? 0;
      const offsetPosition = targetPosition + window.pageYOffset - pageTop - window.innerHeight / 2;
      window.scrollTo(0, offsetPosition);
    }, true);
    form.onValidate(() => formValidate(formEl));
    form.onSubmit(() => formSubmit(formEl));
    form.onSuccess(() => formSuccess(formEl, formData));
  };

  /* ported from marketo-multi.js */
  const multiStep = async (el) => {
    if (!el.classList.contains('multi-step')) return;
    const totalSteps = el.classList.contains('multi-3') ? 3 : 2;
    const { MktoForms2 } = window;
    await MktoForms2.whenReady((form) => readyForm(form, totalSteps));

    function updateTabIndex(formEl, stepToAdd, stepToRemove) {
      const fieldsToAdd = formEl.querySelectorAll(`.mktoFormRowTop[data-validate="${stepToAdd}"]:not(.mktoHidden) input, 
        .mktoFormRowTop[data-validate="${stepToAdd}"]:not(.mktoHidden) select, 
        .mktoFormRowTop[data-validate="${stepToAdd}"]:not(.mktoHidden) textarea`);
      fieldsToAdd.forEach((f) => { f.tabIndex = 0; });

      const fieldsToRemove = formEl.querySelectorAll(`.mktoFormRowTop[data-validate="${stepToRemove}"]:not(.mktoHidden) input, 
        .mktoFormRowTop[data-validate="${stepToRemove}"]:not(.mktoHidden) select, 
        .mktoFormRowTop[data-validate="${stepToRemove}"]:not(.mktoHidden) textarea`);
      fieldsToRemove.forEach((f) => { f.tabIndex = -1; });
    }

    function updateStepDetails(formEl, step, totalSteps) {
      formEl.classList.add('hide-errors');
      formEl.classList.remove('show-warnings');
      formEl.dataset.step = step;
      formEl.querySelector('.step-details .step').textContent = stepText[step];
      formEl.querySelector('#mktoButton_new')?.classList.toggle('mktoHidden', step !== totalSteps);
      formEl.querySelector('#mktoButton_next')?.classList.toggle('mktoHidden', step === totalSteps);
      setTimeout(() => {
        formEl.querySelector(`.mktoFormRowTop[data-validate="${step}"]:not(.mktoHidden) input`)?.focus();
      }, 100);
    }

    function showPreviousStep(formEl, totalSteps) {
      const currentStep = parseInt(formEl.dataset.step, 10);
      const previousStep = currentStep - 1;
      const backBtn = formEl.querySelector('.back-btn');

      updateStepDetails(formEl, previousStep, totalSteps);
      updateTabIndex(formEl, previousStep, currentStep);
      if (previousStep === 1) backBtn?.remove();
    }

    const showNextStep = async (formEl, currentStep, totalSteps) => {
      window.aaInteraction?.(`Marketo Step ${currentStep} of ${totalSteps}`, 'stepChange', formEl.id.split('_')[1], null);
      if (currentStep === totalSteps) return;
      const nextStep = currentStep + 1;
      const stepDetails = formEl.querySelector('.step-details');

      if (!stepDetails.querySelector('.back-btn')) {
        const backText = await replaceKey('back', getConfig());
        const backBtn = createTag('button', { class: 'back-btn', type: 'button' }, backText);
        backBtn.addEventListener('click', () => showPreviousStep(formEl, totalSteps));
        stepDetails.prepend(backBtn);
      }

      updateStepDetails(formEl, nextStep, totalSteps);
      updateTabIndex(formEl, nextStep, currentStep);
    };

    const formValidate = async (formEl) => {
      const currentStep = parseInt(formEl.dataset.step, 10) || 1;

      if (formEl.querySelector(`.mktoFormRowTop[data-validate="${currentStep}"] .mktoInvalid`)) {
        return false;
      }

      const totalSteps = formEl.closest('.marketo').classList.contains('multi-3') ? 3 : 2;
      await showNextStep(formEl, currentStep, totalSteps);

      return currentStep === totalSteps;
    };

    function setValidationSteps(formEl, totalSteps, currentStep) {
      const formData = window.mcz_marketoForm_pref || {};
      const validationMap = formData.form?.fldStepPref || VALIDATION_STEP;
      Object.keys(validationMap).forEach((step) => {
        validationMap[step] = validationMap[step].join(',').split(',');
      });
      formData.form ??= {};
      formData.form.fldStepPref = validationMap;

      formEl.querySelectorAll('.mktoFormRowTop').forEach((row) => {
        const rowAttr = row.getAttribute('data-mktofield') || row.getAttribute('data-mkto_vis_src');
        const mapStep = Object.keys(validationMap).find((stepNum) => validationMap[stepNum].some((field) => field?.toLowerCase() === rowAttr?.toLowerCase())) || '1';
        const step = Math.min(parseInt(mapStep, 10), totalSteps);
        row.dataset.validate = rowAttr?.startsWith('adobe-privacy') ? totalSteps : step;
        const fields = row.querySelectorAll('input, select, textarea');
        if (fields.length) fields.forEach((f) => { f.tabIndex = step === currentStep ? 0 : -1; });
      });
    }

    function onRender(formEl, totalSteps) {
      const currentStep = parseInt(formEl.dataset.step, 10);
      const submitButton = formEl.querySelector('#mktoButton_new');
      submitButton?.classList.toggle('mktoHidden', currentStep !== totalSteps);
      formEl.querySelector('.step-details .step').textContent = stepText[currentStep];
      setValidationSteps(formEl, totalSteps, currentStep);
    }

    async function setStepText(totalSteps) {
      const config = getConfig();
      if (totalSteps === 2) {
        const [step1, step2] = await replaceKeyArray(['step-1-of-2', 'step-2-of-2'], config);
        stepText = { 1: step1, 2: step2 };
      } else {
        const [step1, step2, step3] = await replaceKeyArray(['step-1-of-3', 'step-2-of-3', 'step-3-of-3'], config);
        stepText = { 1: step1, 2: step2, 3: step3 };
      }
    }

    const readyForm = async (form, totalSteps) => {
      const formEl = form.getFormElem().get(0);
      formEl.dataset.step = 1;
      await setStepText(totalSteps);
      form.onValidate(() => formValidate(formEl));

      const nextButton = createTag('button', { type: 'button', id: 'mktoButton_next', class: 'mktoButton mktoUpdatedBTN mktoVisible' }, 'Next');
      nextButton.addEventListener('click', () => form.validate());
      const nextContainer = createTag('div', { class: 'mktoButtonRow' }, nextButton);
      const stepEl = createTag('p', { class: 'step' }, stepText[1]);
      const stepDetails = createTag('div', { class: 'step-details' }, stepEl);
      formEl.append(nextContainer, stepDetails);

      const debouncedOnRender = debounce(() => onRender(formEl, totalSteps), 50);
      const observer = new MutationObserver(debouncedOnRender);
      const fieldLoadTimeOnSlowDevice = 12000;
      observer.observe(formEl, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
      }, fieldLoadTimeOnSlowDevice);
      debouncedOnRender();
    };
  };

  const loadMarketo = (el, formData) => {
    setDataLayer(FORM_STATUS, 'loading');
    const baseURL = formData[BASE_URL];
    const munchkinID = formData[MUNCHKIN_ID];
    const formID = formData[FORM_ID];
    const { base } = getConfig();

    return loadScript(`${base}/js/forms2/js/forms2.min.js`) // adjusted for engage.adobe.com
      .then(() => {
        const { MktoForms2 } = window;
        if (!MktoForms2) throw new Error('Marketo forms not loaded');

        formTimeout(el, () => !isVisible(el.querySelector('form')), LANA_MESSAGE.RENDER_FAILED);
        MktoForms2.loadForm(`//${baseURL}`, munchkinID, formID, () => { setDataLayer(FORM_STATUS, 'loaded'); });
        MktoForms2.whenReady((form) => { readyForm(form, formData); });

        /* c8 ignore next 3 */
        if (el.classList.contains('multi-step')) {
          multiStep(el) // adjusted for MCZ
        }
      })
      .catch(() => {
        /* c8 ignore next 2 */
        el.style.display = 'none';
        logFailure(el, LANA_MESSAGE.MARKETO_FORMS_JS);
      });
  };

  function decorateForm(el, formData) {
    const formID = formData[FORM_ID];
    const fragment = new DocumentFragment();
    const formWrapper = createTag('section', { class: 'marketo-form-wrapper' });

    if (formData.title) {
      const title = createTag('h3', { class: 'marketo-title' }, formData.title);
      formWrapper.append(title);
    }

    if (formData.description) {
      const description = createTag('p', { class: 'marketo-description' }, formData.description);
      formWrapper.append(description);
    }

    const marketoForm = createTag('form', { ID: `mktoForm_${formID}`, class: 'hide-errors', style: 'opacity:0;visibility:hidden;' });
    const span1 = createTag('span', { id: 'mktoForms2BaseStyle', style: 'display:none;' });
    const span2 = createTag('span', { id: 'mktoForms2ThemeStyle', style: 'display:none;' });
    formWrapper.append(span1, span2, marketoForm);

    fragment.append(formWrapper);
    el.replaceChildren(fragment);
    el?.classList.add('loading');

    const stepPreferences = formData['form.fldStepPref'] || {};
    const count = Object.values(stepPreferences).findLastIndex((fields) => fields?.length) + 1 || 1;

    /* c8 ignore next 6 */
    if (count > 1) {
      el.classList.add(`multi-${count}`);
    }
    if (el.classList.contains('multi-2') || el.classList.contains('multi-3')) {
      el.classList.add('multi-step');
    }
  }

  async function init(el) {
    /* not applicable to mcz LPs
    const marketoBase = getMarketoLibsBase(el);
    if (marketoBase && await loadDaMarketoBlock(el, marketoBase)) return;
    */
    setDataLayer(FORM_STATUS, 'init');
    const children = Array.from(el.querySelectorAll(':scope > div'));
    const encodedConfigDiv = children.shift();
    const link = encodedConfigDiv.querySelector('a');

    if (!link?.href) {
      el.style.display = 'none';
      return;
    }
    const encodedConfig = link.href.split('#')[1]; // considering implementing directly as variable instead of a link that has to be parsed
    const formData = parseEncodedConfig(encodedConfig);

    children.forEach((element) => {
      const key = element.children[0]?.textContent.trim().toLowerCase().replaceAll(' ', '-');
      const value = element.children[1]?.href ?? element.children[1]?.textContent;
      if (!key || !value) return;
      if (key in FORM_MAP) {
        formData[FORM_MAP[key]] = value;
      } else {
        formData[key] = value;
      }
    });

    const formID = formData[FORM_ID];
    const baseURL = formData[BASE_URL];
    const munchkinID = formData[MUNCHKIN_ID];

    /* c8 ignore next 4 */
    if (!formID || !baseURL || !munchkinID) {
      el.style.display = 'none';
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const ungated = searchParams.get(FORM_PARAM) === 'off';

    if (formData[SUCCESS_TYPE] === 'section' && ungated) {
      el.classList.add('hide-block');
      toggleSuccessSection(formData); // to be modified
      return;
    }

    const imsSuccessType = getMetadata('marketo-ims'); // ims not applicable on MCZ landing pages

    if (imsSuccessType) {
      formData[SUCCESS_TYPE] = 'ims';
    }

    formData[SUCCESS_TYPE] = formData[SUCCESS_TYPE] || 'redirect';

    if (formData[SUCCESS_TYPE] === 'redirect') {
      const destinationUrl = await decorateURL(formData[SUCCESS_CONTENT]);

      if (destinationUrl) formData[SUCCESS_CONTENT] = destinationUrl;
    }

    formData[FORM_STATUS] = 'decorated';
    setDataLayerObj(formData);
    decorateForm(el, formData);

    // loadLink(`https://${baseURL}`, { rel: 'dns-prefetch' }); // not needed on engage.adobe.com

    createIntersectionObserver({
      el,
      callback: (target) => {
        loadMarketo(target, formData);
      },
      options: { rootMargin: `${ROOT_MARGIN}px` },
    });
  }

  var initTargetEl = document.querySelector('.marketo');

  init(initTargetEl);

  /* disabled functions for now or not needed
  const getFederatedContentRoot = () => {}
  function isPathMatch(){}
  function lingoActive(){}
  function mepLingoSkipQI(){}
  function getExtension(path){}
  function getPrefixBySite(){}
  function isLocalizedPath(){}
  function processQueryIndexMap(){}
  const getDomainLingo = () => {}
  function resolveCrossSiteIndex(){}
  async function loadQueryIndexes(){}
  function attachLingoPendingListener(){}
  function localizeLinkCore(){}
  async function getCountry(){}
  const getCookie = (name) => {}
  function normCountryCode(){}
  function isMasImsLoginEnabled(){}
  function computeDetectedMarketCountry(){}
  async function resolveDetectedMarketCountry(){}
  function getLingoRegion(){}
  function getGeoLocalePrefix(){}
  let mepLingoModulePreloaded = false;
  function preloadMepLingoModule(){}
  function detectMepLingoSwap(){}
  function localizeLinkAsync(){}
  function loadLink(){}
  function loadStyle(){}
  function getMarketoLibsBase(){}
  async function loadDaMarketoBlock(){}
  */

})();
