// ##
// ## Updated 20260508T83048
// ##
/**
 *  98_progressive/progressive_controller.js - 20260508T83048
 */
(function () {
  if (window?.mkto_PrgrsCtrlr) {
    return;
  }

  const mkto_PrgrsCtrlr = {
    /**
     * @property {object} config - Static configuration for the progressive sync controller.
     */
    config: {
      allowedOrigins: [
        "https://engage.adobe.com",
        "https://business.adobe.com",
        "https://business.stage.adobe.com",
        "https://milo.adobe.com",
        "https://main--da-bacom--adobecom.aem.live",
        "https://main--da-bacom--adobecom.aem.page",
        "https://main--da-marketo--adobecom.aem.live",
        "https://main--da-marketo--adobecom.aem.page",
        "https://mkto-poc--events-milo--adobecom.aem.page",
        "https://dev--ecc-milo--adobecom.hlx.page",
        "https://gautam--ecc-milo--adobecom.aem.page",
        "https://na-ab36.marketodesigner.com",
        "https://ab36.marketodesigner.com",
        "https://stage--homepage--adobecom.aem.page",
        "https://main--homepage--adobecom.aem.live",
        "https://stage--cc--adobecom.aem.page",
        "https://stage--da-cc--adobecom.aem.page",
        "https://main--cc--adobecom.aem.live",
        "https://main--da-cc--adobecom.aem.live",
        "https://stage--da-dc--adobecom.aem.page",
        "https://main--da-dc--adobecom.aem.live",
        "https://stage--da-bacom--adobecom.aem.page",
        "https://main--da-bacom--adobecom.aem.live",
        "https://stage--da-bacom--blog--adobecom.aem.page",
        "https://main--da--bacom-blog--adobecom.aem.live",
        "https://stage--express-color--adobecom.aem.page",
        "https://main--express-color--adobecom.aem.live",
        "https://stage--milo--adobecom.aem.page",
        "https://main--milo--adobecom.aem.live",
        "https://main--devblog--adobecom.aem.live",
        "https://stage--federal--adobecom.aem.page",
        "https://main--federal--adobecom.aem.live",
        "https://main--da-events--adobecom.aem.live",
        "https://stage--event-libs--adobecom.aem.page",
        "https://main--event-libs--adobecom.aem.live",
        "https://stage--da-express-milo--adobecom.aem.page",
        "https://main--da-express-milo--adobecom.aem.live",
        "https://stage--genuine--adobecom.aem.page",
        "https://stage--da-genuine--adobecom.aem.page",
        "https://main--da-genuine--adobecom.aem.live",
        "https://stage--news--adobecom.aem.page",
        "https://main--news--adobecom.aem.live",
        "https://stage--upp--adobecom.aem.page",
        "https://main--upp--adobecom.aem.live",
        "https://www.adobe.com",
        "https://business.adobe.com",
        "https://color.adobe.com",
        "https://colour.adobe.com",
        "https://color.stage.adobe.com",
        "https://colour.stage.adobe.com",
        "https://blog.adobe.com",
        "https://milo.adobe.com",
        "https://news.adobe.com",
        "https://partners.adobe.com",
        "https://blog.developer.adobe.com",
        "https://main--milo--adobecom.aem.live",
        "https://stage--milo--adobecom.aem.page"
      ],
      baseURL: "https://engage.adobe.com",
      syncIframeId: "mcz-marketo-program-iframe",
      statusAttribute: "data-mcz-dl-status",
      iframeTimeout: 10000, // 10 second timeout
      msgName: "mcz_marketoForm_pref_sync", //the only message we will allow
      requiredMessageFields: ["type", "data"], //the only messages with these fields we will allowed
      maxMessageSize: 50000, // 50KB
      allowedMessageTypes: ["mcz_marketoForm_pref_sync"], //the only message types we will allow
      consoleLbl: "PP: ",
      refStorageKey: "mcz_storage_refs",
      aliasPattern: /^[a-z]{2,6}_[0-9]+(?:_[0-9]+)?_$/i,
      shelfLife: 86400000, // Default 24 hours
      urlParams: {
        mktTok: "mkt_tok",
        mktoSrc: "mkto_src",
        mktoContext: "mkto_context",
        retry: "retry",
        mktoContextRetry: "mkto_context_retry",
        poi: "mktfrm_poi",
        programId: "mktfrm_pid",
        reset: "mktfrm_pp",
      },

      // Event status polling intervals
      eventStartProximityMinutes_lvl1: 5, // Default, if event starts within 5 minutes
      eventPollInterval_lvl1: 10000, // Default every 10 seconds

      eventStartProximityMinutes_lvl2: 10, // Default 10 minutes, if event starts within 10 minutes, we will poll for event status every 60 seconds
      eventPollInterval_lvl2: 1 * 60 * 1000, // Default every minute

      eventStartProximityMinutes_lvl3: 30, // Default 30 minutes, if event starts within 30 minutes, we will poll for event status every 300 seconds
      eventPollInterval_lvl3: 3 * 60 * 1000, // Default every 3 minutes
    },

    /**
     * @property {object} state - Holds the dynamic state of the application.
     */
    state: {
      /** @type {object | null} data - The main data layer object, synced from Marketo. */
      data: null,
      /** @type {number | null} eventStatusInterval - The interval ID for polling event status. */
      eventStatusInterval: null,
      /** @type {number} eventStatusIntervalLvl - The current polling level (0 for inactive). */
      eventStatusIntervalLvl: 0,
      /** @type {string | null} munchkinId - The Marketo Munchkin ID. */
      munchkinId: null,
    },

    //================================================================================
    // UTILITY MANAGER
    // For generic helper functions.
    //================================================================================
    utility: {
      /**
       * Removes specified parameters from the URL.
       * @param {string[]} paramsToStrip - An array of URL parameter keys to remove.
       */
      stripUrlParams: function (paramsToStrip) {
        if (window.history && window.history.replaceState) {
          const url = new URL(window.location.href);
          let wasModified = false;
          paramsToStrip.forEach((param) => {
            if (url.searchParams.has(param)) {
              url.searchParams.delete(param);
              wasModified = true;
            }
          });
          if (wasModified) {
            window.history.replaceState({}, document.title, url.toString());
          }
        }
      },
      /**
       * Retrieves the Marketo token from URL, session, or local storage.
       * @returns {string} The Marketo token.
       */
      mkto_getMktToken: function () {
        const storageKey = mkto_PrgrsCtrlr?.config?.urlParams?.mkt_tok || "mkt_tok";
        let mktToken = mkto_PrgrsCtrlr?.state?.mktToken || "";

        if (mktToken && mktToken.length > 0) {
          return mktToken;
        }

        mktToken = window.__mktTokVal || "";

        if (mktToken === "") {
          const urlParams = new URLSearchParams(window.location.search);
          mktToken = urlParams.get(storageKey) || "";
        }
        if (mktToken === "") {
          mktToken = sessionStorage.getItem(storageKey) || "";
          if (mktToken === "") {
            mktToken = localStorage.getItem(storageKey) || "";
          }
        }
        if (mktToken && mktToken.length > 0) {
          mkto_PrgrsCtrlr.state.mktToken = mktToken;
          window.__mktTokVal = mktToken;
          try {
            localStorage.setItem(storageKey, mktToken);
          } catch (e) {
            mkf_c.warn(`Could not save ${storageKey} to localStorage`, e);
          }
        }

        return mktToken;
      },

      deepClone: function (obj) {
        if (typeof structuredClone === "function") {
          return structuredClone(obj);
        }
        return JSON.parse(JSON.stringify(obj));
      },
    },

    //================================================================================
    // SYNC MANAGER
    // Handles all communication with the hidden sync iframe.
    //================================================================================
    syncManager: {
      /**
       * Creates and appends the hidden iframe to sync data from the Marketo LP.
       * @param {string} programId - The Marketo program ID.
       * @param {string} mktToken - The visitor's Marketo token.
       */
      createSyncIframe: async function (programId) {
        if (!programId) {
          mkf_c.error(`PP: Cannot create sync iframe without a programId.`);
          return;
        }

        if (document.getElementById(mkto_PrgrsCtrlr.config.syncIframeId)) {
          mkf_c.log(`PP: Sync iframe already exists.`);
          return;
        }

        let baseURL = `${mkto_PrgrsCtrlr.config.baseURL}/mcz${programId}.html`;
        baseURL += `?mktfrm_fid=${window.getMktoFormID()}`;

        let mktToken = mkto_PrgrsCtrlr.utility.mkto_getMktToken();
        if (mktToken && mktToken.length > 0) {
          baseURL += `&mkt_tok=${mktToken}`;
        }

        //add host domain to params to let the iframe know the host domain for auth checks
        baseURL += `&host=${window.location.hostname}`;
        if (window?.mktoFrmLog) {
          baseURL += `&preview=1`;
        }

        const iframe = document.createElement("iframe");
        iframe.id = mkto_PrgrsCtrlr.config.syncIframeId;
        iframe.src = baseURL;
        iframe.style.display = "none";
        iframe.sandbox = "allow-scripts allow-same-origin";

        iframe.addEventListener("load", function () {
          // mkf_c.log(`PP: Sync IFRAME loaded.`);
        });

        iframe.addEventListener("error", function () {
          mkf_c.warn(`PP: Sync IFRAME failed to load - Program may not exist.`);
        });

        const loadTimeout = setTimeout(() => {
          if (iframe.contentDocument?.readyState !== "complete") {
            mkf_c.warn(`PP: Sync IFRAME load timeout - iframe still loading`);
          }
        }, mkto_PrgrsCtrlr.config.iframeTimeout);

        iframe.addEventListener("load", () => clearTimeout(loadTimeout));
        document.body.appendChild(iframe);

        mkf_c.log(`PP: Sync IFRAME creating with URL:`, baseURL);
      },

      /**
       * Sets up the listener to receive messages from the sync iframe.
       */
      setupMessageListener: function () {
        window.addEventListener("message", (event) => {
          // Validate origin
          const isAllowedOrigin = this.validateSecureOrigin(
            event.origin,
            mkto_PrgrsCtrlr.config.allowedOrigins
          );
          const isAllowedMessageType =
            mkto_PrgrsCtrlr?.config?.allowedMessageTypes?.includes(event?.data?.type || "NONE") ||
            false;

          if (!isAllowedMessageType) {
            //ignore the message
            return;
          }

          if (!isAllowedOrigin) {
            //ignore the message
            mkf_c.warn(`PP: Message blocked due to invalid origin:`, event.origin);
            return;
          }

          // Validate the iframe source matches the message origin
          const iframe = document.getElementById(mkto_PrgrsCtrlr.config.syncIframeId);
          if (iframe) {
            try {
              const iframeUrl = new URL(iframe.src)?.origin || "A";
              const eventUrl = new URL(event.origin)?.origin || "B";
              if (iframeUrl !== eventUrl) {
                mkf_c.warn(`PP: Message is not from Marketo`, iframeUrl, eventUrl);
                return;
              }
            } catch (error) {
              mkf_c.warn("PP: Could not validate iframe source origin");
              return;
            }
          }

          if (event?.data) {
            try {
              const msg_prefill = event?.data?.data?.prefill;
              if (
                typeof msg_prefill === "object" &&
                msg_prefill !== null &&
                Object.keys(msg_prefill).length > 0
              ) {
                let msg_prefill_obj;
                try {
                  msg_prefill_obj =
                    typeof msg_prefill === "string" ? JSON.parse(msg_prefill) : msg_prefill;
                } catch (e) {
                  mkf_c.warn("PP: Could not parse prefill data string", e);
                  msg_prefill_obj = {};
                }
                if (Object.keys(msg_prefill_obj).length > 0) {
                  mkf_c.log("PP: Prefill data found.", msg_prefill_obj);
                  const prefill = window?.mktoPreFillFields ?? {};
                  for (const [key, rawValue] of Object.entries(msg_prefill_obj)) {
                    const newValue = String(rawValue ?? "").trim();
                    if (!newValue) {
                      continue;
                    }
                    const existingValue = String(prefill[key] ?? "").trim();
                    if (!existingValue) {
                      prefill[key] = newValue;
                    }
                  }
                  window.mktoPreFillFields = prefill;
                }
              }

              const msg_tok = event?.data?.mktTok || "";
              const current_tok = window.__mktTokVal || "";
              if (current_tok && current_tok?.length > 0) {
                if (msg_tok && msg_tok?.length > 0 && msg_tok !== current_tok) {
                  event.data.mktTok = current_tok;
                }
              } else if (msg_tok && msg_tok.length > 0) {
                window.__mktTokVal = msg_tok;
                window.mcz_marketoForm_pref.profile.mktTok = msg_tok;
              }

              if (window?.__mktTokVal && window?.__mktTokVal?.length > 0) {
                try {
                  localStorage.setItem("mkt_tok", window?.__mktTokVal);
                } catch (e) {
                  mkf_c.warn(`PP: Error saving mkt_tok to localStorage.`, e);
                }
              }
            } catch (e) {
              mkf_c.warn("PP: Error processing sync data", e);
            }

            this.handleReceivedMessage(event.data);
          }
        });
      },

      /**
       * Processes a received message, updates the data layer, and saves it.
       * @param {object} message - The data object received from the iframe.
       */
      handleReceivedMessage: function (message) {
        // Validate message structure before processing
        if (!message || typeof message !== "object") {
          mkf_c.warn(`PP: Invalid message format`);
          return;
        }

        const requiredFields = mkto_PrgrsCtrlr.config.requiredMessageFields || [
          "mkto_PrgrsCtrlr requiredMessageFields cannot be empty",
        ];
        for (const field of requiredFields) {
          if (!(field in message)) {
            mkf_c.warn(`PP: Missing required fields: ${requiredFields.join(", ")}`);
            return;
          }
        }

        // Size limit for additional protection
        const messageSize = JSON.stringify(message).length;
        const maxMessageSize = mkto_PrgrsCtrlr.config.maxMessageSize || 50000;
        if (messageSize > maxMessageSize) {
          mkf_c.warn(`PP: Message too large, rejected`, messageSize);
          return;
        }

        message.refStorage = mkto_PrgrsCtrlr.config.refStorageKey;

        mkto_PrgrsCtrlr.dataLayerManager.mergeDataLayer(
          window.mcz_marketoForm_pref,
          message.data,
          message.target_path
        );

        if (message.save) {
          mkto_PrgrsCtrlr.storageManager.saveMessage(message);
        }
      },

      // origin validation:
      validateSecureOrigin: function (eventOrigin, allowedOrigins) {
        if (!eventOrigin || typeof eventOrigin !== "string") {
          mkf_c.warn(`PP: Invalid event origin`);
          return false;
        }

        try {
          const eventUrl = new URL(eventOrigin);

          // Protocol must be HTTPS
          if (eventUrl.protocol !== "https:") {
            mkf_c.warn(`PP: Non-HTTPS origin rejected:`, eventOrigin);
            return false;
          }

          // Check for suspicious characters in hostname
          if (!/^[a-zA-Z0-9.-]+$/.test(eventUrl.hostname)) {
            mkf_c.warn(`PP: Suspicious characters in hostname:`, eventOrigin);
            return false;
          }

          // Prevent IDN homograph attacks (basic check)
          if (eventUrl.hostname.includes("xn--")) {
            mkf_c.warn(`PP: Punycode domain rejected:`, eventOrigin);
            return false;
          }

          // Check against the list of allowed origins
          for (const allowedOrigin of allowedOrigins) {
            const allowedUrl = new URL(allowedOrigin);

            // Hostname must match (case-insensitive)
            const hostnameMatch =
              eventUrl.hostname.toLowerCase() === allowedUrl.hostname.toLowerCase();

            // Port must match
            const eventPort = eventUrl.port || "443";
            const allowedPort = allowedUrl.port || "443";
            const portMatch = eventPort === allowedPort;

            // Protocol must match
            const protocolMatch = eventUrl.protocol === allowedUrl.protocol;

            if (hostnameMatch && portMatch && protocolMatch) {
              return true; // Origin is valid
            }
          }

          // If loop completes, origin did not match any allowed origin
          //mkf_c.warn(`PP: Origin not in allowed list:`, eventOrigin);
          return false;
        } catch (error) {
          mkf_c.warn(`PP: Error parsing origin URL:`, eventOrigin, error);
          return false;
        }
      },
      refreshSyncIframe: function (context) {
        const iframe = document.getElementById(mkto_PrgrsCtrlr.config.syncIframeId);
        if (!iframe) {
          mkf_c.warn(`PP: Sync IFRAME missing, creating new one.`);
          this.createSyncIframe(mkto_PrgrsCtrlr.state.data?.program?.id);
          return;
        }

        const iframeUrl = new URL(iframe.src);
        iframeUrl.searchParams.set(mkto_PrgrsCtrlr.config.urlParams.mktoContext, context);
        iframeUrl.searchParams.set(
          mkto_PrgrsCtrlr.config.urlParams.mktoContextRetry,
          (parseInt(
            iframeUrl.searchParams.get(mkto_PrgrsCtrlr.config.urlParams.mktoContextRetry)
          ) || 0) + 1
        );

        mkf_c.log(`PP: Refreshing Sync IFRAME with context: ${context}`);
        iframe.src = iframeUrl.toString();
      },
    },

    //================================================================================
    // STATE MANAGER
    // Manages the `mcz_marketoForm_pref` data layer object.
    //================================================================================
    stateManager: {
      /**
       * Updates the local data layer with new data from the sync message.
       * @param {object} message - The data object from the iframe.
       */
      updateDataLayer: function (message, targetPath, source) {
        if (!message || !message.target_path || !message.data) {
          return;
        }

        const path = targetPath.split(".");
        let currentLevel = window.mcz_marketoForm_pref;
        //traverse the path to update the correct part of the data layer
        for (let i = 0; i < path.length - 1; i++) {
          currentLevel[path[i]] = currentLevel[path[i]] || {};
          currentLevel = currentLevel[path[i]];
        }
        currentLevel[path[path.length - 1]] = message.data;

        //trigger sync actions
        this.onDataLayerUpdate();
      },

      /**
       * Actions to perform after any part of the data layer is updated.
       */
      onDataLayerUpdate: function () {
        const programType = mkto_PrgrsCtrlr.state.data?.program?.type;
        const eventType = mkto_PrgrsCtrlr.state.data?.program?.event?.type;
        if (
          programType === "event" ||
          eventType === "event" ||
          eventType === "webinar" ||
          eventType === "connect_recording" ||
          eventType === "adobe_connect" ||
          eventType === "video"
        ) {
          mkto_PrgrsCtrlr.eventManager.updateEventStatus();
        }
      },
    },

    //================================================================================
    // STORAGE MANAGER
    // Manages interaction with localStorage and sessionStorage.
    //================================================================================
    storageManager: {
      /**
       * Attempts to load the data layer from storage on initialization.
       * It reconstructs the data from saved message parts and validates their expiration.
       * @param {string} programId - The program ID to look for in stored data.
       * @returns {boolean} - True if fresh data was successfully loaded and merged, otherwise false.
       */
      loadInitialState: function (programId) {
        const refStorageKey = mkto_PrgrsCtrlr.config.refStorageKey;
        const legacyRefStorageKey = "mcz_refs"; // fallback for older cached references
        const managePParam = "mktfrm_pp";
        let cleanPP = false;
        const managePPAllowed =
          new URLSearchParams(window.location?.search)?.get(managePParam) || "";
        if (managePPAllowed) {
          mkf_c.log(`PP: Manage PP value found: ${managePPAllowed}`);
          if (managePPAllowed.toLowerCase().trim() === "reset") {
            mkf_c.log(`PP: Resetting PP values.`);
            cleanPP = true;
          }
        }
        let programDataFound = false;
        const now = Date.now();

        try {
          let refListStr = localStorage.getItem(refStorageKey);
          if (!refListStr) {
            // fallback to legacy key if primary is missing
            refListStr = localStorage.getItem(legacyRefStorageKey);
            if (refListStr) {
              mkf_c.log(
                `PP: Using legacy reference list from ${legacyRefStorageKey}. Consider migrating to ${refStorageKey}.`
              );
            }
          }
          if (!refListStr) return false;
          let refList;
          try {
            refList = JSON.parse(refListStr);
          } catch (e) {
            mkf_c.warn(`PP: Could not parse ref list, removing corrupt data.`, e);
            localStorage.removeItem(refStorageKey);
            localStorage.removeItem(legacyRefStorageKey);
            sessionStorage.removeItem(refStorageKey);
            sessionStorage.removeItem(legacyRefStorageKey);
            return false;
          }

          let relevantKeys =
            refList.filter(
              (item) =>
                item.includes(`_${programId}_`) ||
                item.includes(`_${programId}`) ||
                item.startsWith(`vp_`)
            ) || [];
          if (relevantKeys.length === 0) {
            mkf_c.log(`PP: No keys found ${programId} or visitor profile.`);
            return false;
          } else {
            mkf_c.log(`PP: Found ${relevantKeys.length} relevant keys in storage.`, relevantKeys);
          }

          let foundFromCache = [];
          if (cleanPP) {
            mkf_c.log(`PP: Cleaning mktoPreFillFields values from storage.`);
            sessionStorage.removeItem("mktoPreFillFields");
            localStorage.removeItem("mktoPreFillFields");
          }
          for (const key of relevantKeys) {
            let itemStr = sessionStorage.getItem(key);
            let currentLocation = "sessionStorage";
            if (!itemStr) {
              itemStr = localStorage.getItem(key);
              currentLocation = "localStorage";
            }
            if (!itemStr) {
              continue;
            }
            if (cleanPP) {
              mkf_c.log(`PP: Cleaning PP values from ${key}.`);
              sessionStorage.removeItem(key);
              localStorage.removeItem(key);
              continue;
            }
            let item;
            try {
              item = JSON.parse(itemStr);
            } catch (e) {
              mkf_c.warn(
                `PP: Malformed item in storage, removing item ${key} from ${currentLocation}.`,
                e
              );
              sessionStorage.removeItem(key);
              localStorage.removeItem(key);
              continue;
            }
            // Check if the item is expired
            if (!item?.expires || now > item?.expires) {
              mkf_c.log(
                `PP: Stored item '${key}' has expired, removing item from ${currentLocation}.`
              );
              sessionStorage.removeItem(key);
              localStorage.removeItem(key);
              continue;
            }

            if (item?.target_path?.includes(`profile`)) {
              foundFromCache.unshift({
                key,
                location: currentLocation,
                expires: item?.expires,
                mktTok: item?.mktTok || "",
                priorize: 0,
                data: item?.data,
                target_path: item?.target_path,
              });
            } else {
              if (item?.target_path?.includes(`program`)) {
                programDataFound = true;
              }
              foundFromCache.push({
                key,
                location: currentLocation,
                expires: item?.expires,
                mktTok: item?.mktTok || "",
                priorize: item?.priorize || 10,
                data: item?.data,
                target_path: item?.target_path,
              });
            }

            mkf_c.log(`PP: ${item?.target_path || ""} data found in ${key}.`);
          }

          if (foundFromCache.length > 0) {
            mkf_c.log(`foundFromCache:`, foundFromCache);
            foundFromCache.sort((a, b) => (a.priorize || 10) - (b.priorize || 10));
            mkf_c.log(`foundFromCache sorted:`, foundFromCache);
            for (const item of foundFromCache) {
              mkto_PrgrsCtrlr.dataLayerManager.mergeDataLayer(
                window.mcz_marketoForm_pref,
                item.data,
                item.target_path
              );
            }
          }

          if (cleanPP) {
            mkf_c.log(`PP: Cleaning PP values from storage completed. Starting Fresh.`);
            sessionStorage.removeItem(refStorageKey);
            localStorage.removeItem(refStorageKey);
            return false;
          }

          return programDataFound;
        } catch (e) {
          mkf_c.warn(`PP: Could not load initial state from storage.`, e);
          return false;
        }
      },

      /**
       * Saves a message payload to browser storage.
       * @param {object} message - The message object to save.
       */
      saveMessage: function (message) {
        const {
          alias,
          location = "local",
          refStorage = mkto_PrgrsCtrlr.config.refStorageKey || "",
        } = message;
        if (!alias) {
          mkf_c.warn(`PP: No alias found to save message.`);
          return;
        }
        const aliasStr = String(alias);
        const aliasPattern = mkto_PrgrsCtrlr.config.aliasPattern;
        const tokenParam = mkto_PrgrsCtrlr.config.urlParams.mktTok;
        const tokenFrmMsg = message?.data?.[tokenParam] || "";
        if (tokenFrmMsg && tokenFrmMsg.length > 0) {
          try {
            localStorage.setItem(tokenParam, tokenFrmMsg);
            mkf_c.log(`PP: Saved token to localStorage with key ${tokenParam}.`);
          } catch (e) {
            mkf_c.warn(`PP: Could not save token to localStorage.`, e);
          }
        }
        if (!aliasPattern.test(aliasStr)) {
          mkf_c.warn(`PP: Alias "${aliasStr}" failed validation and will not be saved.`);
          return;
        }
        try {
          const dataStr = JSON.stringify(message);
          if (location === "session") {
            sessionStorage.setItem(aliasStr, dataStr);
            mkf_c.log(`PP: Saved message to sessionStorage with alias ${aliasStr}.`);
          } else {
            localStorage.setItem(aliasStr, dataStr);
            mkf_c.log(`PP: Saved message to localStorage with alias ${aliasStr}.`);
          }
          if (refStorage) {
            this.updateStorageRefs(aliasStr, refStorage);
            mkf_c.log(`PP: Updated storage references with alias ${aliasStr} in ${refStorage}.`);
          }
        } catch (error) {
          mkf_c.error(`PP: Error saving message to storage.`, error);
        }
      },

      /**
       * Updates the list of stored references to keep track of cached items.
       * @param {string} newAlias - The new alias to add to the list.
       * @param {string} refStorageKey - The key for the reference list in localStorage.
       */
      updateStorageRefs: function (newAlias, refStorageKey) {
        try {
          const now = Date.now();
          let existingRefs = JSON.parse(localStorage.getItem(refStorageKey) || "[]");
          mkf_c.log(`PP: Adding alias ${newAlias} to ${refStorageKey}.`);
          mkf_c.log(`PP: Existing references in ${refStorageKey}:`, existingRefs);

          const activeRefs = existingRefs.filter((key) => {
            const itemStr = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (!itemStr) return false;
            try {
              const item = JSON.parse(itemStr);
              return item.expires && now < item.expires;
            } catch {
              return false;
            }
          });

          if (!activeRefs.includes(newAlias)) {
            activeRefs.push(newAlias);
          }

          localStorage.setItem(refStorageKey, JSON.stringify(activeRefs));
        } catch (e) {
          mkf_c.warn(`PP: Could not update storage references.`, e);
        }
      },
      saveData: function (dataObject) {
        if (!dataObject || !dataObject.sync) {
          return;
        }

        const { ref, location, host, max_age } = dataObject.sync;
        if (!ref || !location) {
          mkf_c.warn(`PP: Cannot save object without ref or location in sync property.`);
          return;
        }

        const dataToSave = JSON.parse(JSON.stringify(dataObject));
        delete dataToSave.sync;

        const message = {
          alias: ref,
          location: location,
          data: dataToSave,
          expires: Date.now() + (max_age || mkto_PrgrsCtrlr.config.shelfLife),
          target_path: host,
        };

        this.saveMessage(message);
      },
    },

    //================================================================================
    // EVENT MANAGER
    // Handles event timing calculations and status updates.
    //================================================================================
    eventManager: {
      /**
       * Retrieves the current Marketo time.
       * @returns {Date} The current Marketo time.
       */
      getCurrentMarketoTime: function () {
        const serverTimeRaw =
          mkto_PrgrsCtrlr.state.data?.program?.marketo_asset?.time?.systemDateTime;
        if (!serverTimeRaw) return new Date();

        try {
          const serverTimeInitial = new Date(serverTimeRaw).getTime();
          const clientTimeInitial =
            mkto_PrgrsCtrlr.state.data?.program?.marketo_asset?.time?.browserTime || Date.now();
          const serverTimeOffset = serverTimeInitial - clientTimeInitial;
          return new Date(Date.now() + serverTimeOffset);
        } catch (e) {
          return new Date();
        }
      },

      /**
       * Calculates the time until a target date.
       * @param {Date} targetDate - The target date.
       * @param {Date} nowDate - The current date.
       * @returns {object} The time until the target date.
       */
      calculateTimeUntil: function (targetDate, nowDate) {
        if (!targetDate || !nowDate) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, timeUntil: 0 };
        }
        const timeUntil = targetDate.getTime() - nowDate.getTime();
        if (timeUntil <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0, timeUntil: 0 };
        }
        const days = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntil % (1000 * 60)) / 1000);
        return { days, hours, minutes, seconds, timeUntil };
      },

      /**
       * Updates the status of the event using tiered polling.
       */
      updateEventStatus: function () {
        // Skip updates if the browser tab is not visible to save resources.
        if (document?.hidden || document?.visibilityState !== "visible") {
          return;
        }

        const eventData = mkto_PrgrsCtrlr.state.data?.program?.event;
        if (!eventData?.dateTime?.pst?.dateTimeStart || !eventData?.dateTime?.pst?.dateTimeEnd) {
          return;
        }

        const startDate = new Date(eventData?.dateTime?.pst?.dateTimeStart);
        const endDate = new Date(eventData?.dateTime?.pst?.dateTimeEnd);
        const nowDate = this.getCurrentMarketoTime();

        const timeUntilStart = this.calculateTimeUntil(startDate, nowDate);
        const timeUntilEnd = this.calculateTimeUntil(endDate, nowDate);

        if (
          mkto_PrgrsCtrlr.state.data?.form?.polling === true &&
          mkto_PrgrsCtrlr.state.data?.program?.event?.type === "adobe_connect"
        ) {
          const programProfile = mkto_PrgrsCtrlr.state.data?.program_profile;
          const formSubmitted = !!mkto_PrgrsCtrlr.state.data?.form?.lastSubmission;
          const hasJoinUrl = programProfile.join_url && programProfile.join_url.length > 10;

          if (formSubmitted && !hasJoinUrl) {
            const iframe = document.getElementById(mkto_PrgrsCtrlr.config.syncIframeId);
            if (iframe) {
              const iframeUrl = new URL(iframe.src);
              const retryCount =
                parseInt(
                  iframeUrl.searchParams.get(mkto_PrgrsCtrlr.config.urlParams.mktoContextRetry)
                ) || 0;
              if (retryCount < 5) {
                mkto_PrgrsCtrlr.syncManager.refreshSyncIframe("membership");
              }
            }
          }
        }

        const status = eventData?.adobe_connect?.status || {};
        eventData.adobe_connect = eventData?.adobe_connect || {};
        eventData.adobe_connect.status = status;

        // Reset flags at the beginning of each check
        status.is_starting_soon = false;
        status.is_starting_in_5_minutes = false;
        status.is_starting_in_1_minute = false;
        status.is_halfway_through = false;
        status.about_to_end = false;
        status.has_ended = false;
        status.can_enter = false;
        status.can_attend = false;
        status.can_register = true;
        status.has_started = false;
        status.is_reg_open = true;
        status.is_reg_closed = false;
        status.attendee_status = "not_registered";

        // Determine attendee status from program_profile
        const programProfile = mkto_PrgrsCtrlr.state.data?.program_profile;
        if (programProfile) {
          const memberStatus = programProfile.status?.toLowerCase().trim();
          const hasJoinUrl = programProfile.join_url && programProfile.join_url.length > 10;

          if (memberStatus === "registered" || hasJoinUrl) {
            status.attendee_status = "registered";
          } else if (memberStatus === "waitlisted") {
            status.attendee_status = "waitlisted";
          } else if (memberStatus === "attended") {
            status.attendee_status = "attended";
          } else if (memberStatus === "no show") {
            status.attendee_status = "no_show";
          }
        }

        // Set flags based on the current time and time until end
        if (timeUntilStart.timeUntil > 0) {
          status.overall = "pending";
          if (timeUntilStart.minutes <= 10) status.is_starting_soon = true;
          if (timeUntilStart.minutes <= 5) status.is_starting_in_5_minutes = true;
          if (timeUntilStart.minutes <= 1) status.is_starting_in_1_minute = true;
        } else if (timeUntilStart.timeUntil <= 0 && timeUntilEnd.timeUntil > 0) {
          status.overall = "active";
          status.has_started = true;
          status.can_enter = true;
          status.can_attend = true;
          if (status.attendee_status === "registered") {
            status.attendee_status = "can_join";
            status.can_join = true;
          }
          const totalDuration = endDate.getTime() - startDate.getTime();
          const timeElapsed = nowDate.getTime() - startDate.getTime();
          if (timeElapsed >= totalDuration / 2) status.is_halfway_through = true;
          if (timeUntilEnd.minutes <= 10) status.about_to_end = true;
        } else {
          status.overall = "finished";
          status.has_started = true;
          status.has_ended = true;
          status.is_reg_open = false;
          status.is_reg_closed = true;
          status.can_register = false;
        }

        eventData.status = status?.overall || "pending";
        eventData.dateTime.timeUntil = {
          starts: timeUntilStart,
          ends: timeUntilEnd,
        };

        // Manages the polling tier.
        const config = mkto_PrgrsCtrlr.config;
        const currentState = mkto_PrgrsCtrlr.state;
        let newPollLevel = 0;
        let newPollInterval = 0;

        if (status?.overall === "active") {
          // Always poll at high frequency when the event is active for live countdowns.
          // and to know when the event has concluded.
          newPollLevel = 4; // Special level for "active" state
          newPollInterval = 1000; // 1 second
          //
          //
          //
        } else if (status?.overall === "pending") {
          // Find the highest-priority polling tier that applies.
          const proximityLevels = [
            {
              lvl: 1,
              mins: config.eventStartProximityMinutes_lvl1,
              int: config.eventPollInterval_lvl1,
            },
            {
              lvl: 2,
              mins: config.eventStartProximityMinutes_lvl2,
              int: config.eventPollInterval_lvl2,
            },
            {
              lvl: 3,
              mins: config.eventStartProximityMinutes_lvl3,
              int: config.eventPollInterval_lvl3,
            },
          ];

          for (const level of proximityLevels) {
            // Convert minutes to milliseconds for accurate comparison.
            if (timeUntilStart.timeUntil > 0 && timeUntilStart.timeUntil < level.mins * 60 * 1000) {
              newPollLevel = level.lvl;
              newPollInterval = level.int;
              mkf_c.log(
                `PP: Setting event poll interval to level ${newPollLevel} (${
                  newPollInterval / 1000
                }s).`
              );
              break; // Stop after finding the first (most frequent) match.
            }
          }
        }

        let checkPolling = mkto_PrgrsCtrlr.state.data?.form?.polling || false;
        if (checkPolling && checkPolling === false) {
          newPollLevel = 0;
          newPollInterval = 0;
          currentState.eventStatusInterval = null;
          currentState.eventStatusIntervalLvl = 0;
          mkf_c.log(`PP: Polling is disabled. Setting event poll interval to 0.`);
        }

        mkto_PrgrsCtrlr.mczFormUiManager.updateStatusLabels(
          mkto_PrgrsCtrlr.state.data?.program?.type,
          mkto_PrgrsCtrlr.state.data?.program?.event?.status,
          mkto_PrgrsCtrlr.state.data?.form?.status,
          status.attendee_status
        );

        // Only change the interval if the required polling level has changed.
        if (currentState.eventStatusIntervalLvl !== newPollLevel) {
          clearInterval(currentState.eventStatusInterval);
          currentState.eventStatusInterval = null;
          currentState.eventStatusIntervalLvl = newPollLevel;

          if (newPollLevel > 0) {
            mkf_c.log(
              `PP: Setting event poll interval to level ${newPollLevel} (${
                newPollInterval / 1000
              }s).`
            );
            currentState.eventStatusInterval = setInterval(
              () => this.updateEventStatus(),
              newPollInterval
            );
          } else {
            mkf_c.log(`PP: Stopping event poll interval.`);
          }
        }
      },
    },

    //================================================================================
    // MCZ Form UI MANAGER
    // Handles status and form rendering signals to the page
    //================================================================================
    mczFormUiManager: {
      /**
       * Updates elements on the page that have a status attribute.
       * @param {string} programType - The type of program (e.g., 'event', 'webinar').
       * @param {string} programStatus - The current status (e.g., 'active', 'pending').
       * @param {string} formStatus - The current status of the form (e.g., 'success', 'error').
       * @param {string} attendeeStatus - The current status of the attendee (e.g., 'registered', 'waitlisted', 'full', 'inactive', 'route').
       */
      updateStatusLabels: function (
        programType = "",
        programStatus = "",
        formStatus = "",
        attendeeStatus = ""
      ) {
        let attribute = mkto_PrgrsCtrlr.config.statusAttribute;
        let elements = attribute ? document.querySelectorAll(`[${attribute}]`) : [];
        if (elements.length === 0) {
          elements = [document.body];
          attribute = mkto_PrgrsCtrlr.config.statusAttribute || "data-mcz-dl-status";
        }

        elements.forEach((element) => {
          //update the status attributes on the elements
          let passedAttributes = 0;
          if (programStatus) {
            element.setAttribute(attribute, programStatus);
            passedAttributes++;
          }
          if (programType) {
            element.setAttribute(`${attribute}-type`, programType);
            passedAttributes++;
          }
          if (formStatus) {
            element.setAttribute(`${attribute}-form-status`, formStatus);
            passedAttributes++;
          }
          if (attendeeStatus) {
            element.setAttribute(`${attribute}-attendee-status`, attendeeStatus);
            passedAttributes++;
          }
          if (passedAttributes > 0) {
            element.setAttribute(`${attribute}-dt`, Date.now());
          } else {
            mkf_c.warn(`PP: No attributes passed to updateStatusLabels`);
          }
        });
      },
    },

    adobeConnectManager: {
      /**
       * Reviews the Adobe Connect status and updates the form with the appropriate message.
       */
      reviewAdobeConnect: function () {
        mkf_c.log(`PP: Reviewing Adobe Connect after form submission.`);

        const formId = window.mcz_marketoForm_pref?.form?.id;
        if (typeof window.aaInteraction === "function" && formId) {
          window.aaInteraction("Marketo Form Submission", "formSubmission", formId, null);
        }

        mkto_PrgrsCtrlr.eventManager.updateEventStatus();

        const eventStatus =
          mkto_PrgrsCtrlr.state.data?.program?.event?.adobe_connect?.status?.overall;
        const messages = window.mcz_marketoForm_pref?.program?.event?.adobe_connect?.status_msgs;

        let message = messages?.confirmation || "Thank you for registering.";

        if (eventStatus === "active") {
          message = messages?.confirmation_active || message;
        }

        if (typeof window.MktoForms_tyMsg === "function") {
          window.MktoForms_tyMsg(message);
        }
      },
    },

    dataLayerManager: {
      /**
       * Merges incoming data into the controller's state with comprehensive audit logging.
       * @param {object} targetData - Target data layer.
       * @param {object} incomingData - Data from iframe or storage.
       * @param {string} targetPath - Path to the target data layer.
       */
      mergeDataLayer: async function (targetData, incomingData, targetPath) {
        let syncInitialized = window.mkto_PrgrsCtrlr?.state?.syncInitialized || false;

        targetData = window.mcz_marketoForm_pref || null;
        targetPath = `${targetPath}`.replace("root.", "");

        mkf_c.groupEnd();
        mkf_c.groupCollapsed(`PP: Received and processing ${targetPath}`);

        const ensurePath = (rootObj, pathParts) => {
          if (!this.isObject(rootObj)) {
            return null;
          }
          let current = rootObj;
          for (const part of pathParts) {
            if (!this.isObject(current[part])) {
              current[part] = {};
            }
            current = current[part];
          }
          return current;
        };

        const normalizedPath = targetPath?.replace(/^root\./, "") || "";
        if (normalizedPath.length > 0 && targetData) {
          if (normalizedPath.includes(".")) {
            const pathParts = normalizedPath.split(".");
            targetData = ensurePath(targetData, pathParts);
          } else {
            if (!this.isObject(targetData[normalizedPath])) {
              targetData[normalizedPath] = {};
            }
            targetData = targetData[normalizedPath];
          }
        }

        if (!targetData) {
          mkf_c.warn(`PP: No target data or target path provided.`);
          mkf_c.groupEnd();
          return;
        }

        mkf_c.log(`Timestamp: ${new Date().toISOString()}`);
        mkf_c.log(`Sync Initialized: ${syncInitialized}`);

        const auditLog = [];
        const updateStats = { added: 0, updated: 0, unchanged: 0, total: 0 };
        const invalidValues = new Set([
          "null",
          "undefined",
          "nan",
          "blank",
          "empty",
          "false",
          "blank",
          "not_set",
        ]);

        try {
          const mergeRecursive = async (target, source, path = "") => {
            if (!source) {
              mkf_c.warn(`PP: No source data to merge at path ${path}.`);
              mkf_c.groupEnd();
              return;
            }
            if (path.includes("sync") || path.includes("_meta")) {
              let key = path.split(".").pop();
              if (!key) {
                key = path;
              }
              target[key] = mkto_PrgrsCtrlr.utility.deepClone(source);
            } else {
              const promises = Object.keys(source).map(async (key) => {
                const currentPath = `${path}.${key}`.replace("root.", "");
                if (
                  currentPath.includes("sync") ||
                  currentPath.includes("_meta") ||
                  currentPath.includes("unique_id")
                ) {
                  //ignore these paths
                  return;
                }
                let normalized = source[key];
                if (typeof normalized === "string") {
                  normalized = normalized
                    .replace(/[\r\n]+/gm, "")
                    .replace(/<[^>]*>/gm, "")
                    .trim();
                  const low = normalized.toLowerCase();
                  if (invalidValues.has(low)) {
                    normalized = "";
                  }
                  if (!normalized) normalized = "";
                }
                updateStats.total++;
                if (normalized === "") {
                  updateStats.unchanged++;
                } else if (!(key in target)) {
                  if (this.isObject(normalized)) {
                    target[key] = target[key] || {};
                    await mergeRecursive(target[key], normalized, currentPath);
                  } else {
                    target[key] = normalized;
                    auditLog.push({
                      path: currentPath,
                      action: "ADD",
                      new: this.formatValue(normalized),
                    });
                    updateStats.added++;
                  }
                } else if (this.isObject(normalized) && this.isObject(target[key])) {
                  await mergeRecursive(target[key], normalized, currentPath);
                } else if (target[key] !== normalized) {
                  const previousValue = this.formatValue(target[key]);
                  target[key] = normalized;
                  auditLog.push({
                    path: currentPath,
                    action: "UPDATE",
                    previous: previousValue,
                    new: this.formatValue(normalized),
                  });
                  updateStats.updated++;
                } else {
                  updateStats.unchanged++;
                }
              });
              await Promise.all(promises);
            }
          };

          await mergeRecursive(targetData, incomingData, targetPath);

          let targetPathsProcessed = window.mkto_PrgrsCtrlr?.state?.targetPathsProcessed || [];
          let targetPathsPrevious = [];

          if (targetPathsProcessed.includes(targetPath.toLowerCase())) {
            targetPathsPrevious.push(targetPath.toLowerCase());
            mkf_c.log(`PP: Target Was Path Previously Processed.`, targetPath);
          } else {
            targetPathsProcessed.push(targetPath.toLowerCase());
            window.mkto_PrgrsCtrlr.state.targetPathsProcessed = targetPathsProcessed;
          }

          mkto_PrgrsCtrlr.stateManager.onDataLayerUpdate();
          syncInitialized = window.mkto_PrgrsCtrlr?.state?.syncInitialized || false;
          if (
            mkto_PrgrsCtrlr?.state?.callback &&
            targetPathsProcessed.includes("form") &&
            syncInitialized === false
          ) {
            mkf_c.log(`PP: Calling callback function now form is initialized.`);

            const formId = window.getMktoFormID();
            if (formId && window.MktoForms2 && window.field_pref) {
              try {
                const form = MktoForms2.getForm(formId);
                if (typeof window.mcz_marketoForm_pref?.profile?.prefill === "object") {
                  window.mkto_PrgrsCtrlr.state.syncInitialized = true;
                  window.mktoPreFillFields = window.mcz_marketoForm_pref.profile.prefill;

                  mkf_c.log(`PP: Sync Initialized ++ Prefill.`, window.mktoPreFillFields);
                  mkto_PrgrsCtrlr?.state?.callback();
                } else {
                  window.mkto_PrgrsCtrlr.state.syncInitialized = true;
                  mkf_c.log(`PP: Sync Initialized.`);
                  mkto_PrgrsCtrlr?.state?.callback();
                }
              } catch (error) {
                mkf_c.error(`PP: Error getting or setting form values:`, error);
                mkto_PrgrsCtrlr?.state?.callback();
              }
            }
          }
          if (targetPathsPrevious.includes("form") && syncInitialized === true) {
            mkf_c.log(`PP: Sync is initialized and form is processed, running prefill sequence.`);
            window.mkto_prefillInit();
          }
        } catch (error) {
          mkf_c.error(`PP: Error during data layer merge:`, error);
          mkf_c.groupEnd();
          return false;
        }

        // Logging and Reporting
        if (auditLog.length > 0) {
          mkf_c.groupCollapsed(`PP: Changes Applied (${auditLog.length} modifications)`);
          mkf_c.table(
            auditLog.map((entry) => ({
              Path: entry.path,
              Action: entry.action,
              "Previous Value": entry.previous || " ",
              "New Value": entry.new || " ",
            }))
          );
          mkf_c.log(`\nPP: Update Summary:`);
          mkf_c.table({
            Added: updateStats.added,
            Updated: updateStats.updated,
            Unchanged: updateStats.unchanged,
            "Total Processed": updateStats.total,
          });
          this.logCriticalFields();
          mkf_c.groupEnd();
        } else {
          mkf_c.log(`PP: No changes detected.`);
        }
        mkf_c.groupEnd();

        return true; // success
      },

      /** Format values for logging */
      formatValue: function (value) {
        if (value === null) return "";
        if (value === undefined) return "";
        if (value === "") return "";
        if (typeof value === "object") {
          return Array.isArray(value) ? `[Array: ${value.length} items]` : `Field Set`;
        }
        if (typeof value === "string" && value.length > 50) {
          return value.substring(0, 47) + "...";
        }
        return String(value);
      },

      /** Check if value is a plain object */
      isObject: function (obj) {
        return obj !== null && typeof obj === "object" && !Array.isArray(obj);
      },

      /** Log critical fields for verification */
      logCriticalFields: function () {
        let data = window?.mcz_marketoForm_pref || null;

        if (!data) {
          return;
        }
        mkf_c.log(`\nPP: Primary Fields.`);
        mkf_c.table({
          "Program ID": data?.program?.marketo_asset?.id,
          "Lead ID": data?.profile?.lead_id,
          "Join URL": data?.program_profile?.join_url,
          "Form Type": data?.form?.type,
          "Event Status": data?.program?.event?.status,
        });
      },
    },

    //================================================================================
    // Starting the controller
    //================================================================================
    /**
     * Initializes the controller.
     * @param {object} options - Configuration options.
     * @param {string} options.programId - The current Marketo Program ID.
     * @param {string} options.munchkinId - The optional Marketo Munchkin ID.
     * @param {function} options.callback - The optional callback function.
     */
    init: function (options = {}) {
      const { programId, munchkinId = "", callback = null } = options;

      if (!programId) {
        mkf_c.error(`PP: Initialization requires 'programId'.`);
        return;
      }

      //watch for visibility change and update event status if the document is visible
      mkf_c.log(`PP: Initializing...`);
      const onActive = () => {
        mkto_PrgrsCtrlr.eventManager.updateEventStatus();
      };
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.visibilityState === "visible") onActive();
        },
        { passive: true }
      );
      window.addEventListener("focus", onActive, { passive: true });
      window.addEventListener(
        "pageshow",
        (e) => {
          if (e.persisted) onActive();
        },
        { passive: true }
      );

      this.state.munchkinId = munchkinId;
      this.state.data = {};
      this.state.callback = callback || null;

      const loadedFromStorage = this.storageManager.loadInitialState(programId);
      if (!loadedFromStorage) {
        mkf_c.log(`PP: No valid data in storage.`);
      }

      this.syncManager.setupMessageListener();
      this.syncManager.createSyncIframe(programId);
    },
  };
  window.mkto_PrgrsCtrlr = mkto_PrgrsCtrlr;
})();

// ##
// ##
