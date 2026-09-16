// Minimal test mock of milo's real libs/utils/utils.js — not a full reimplementation.
// da-marketo.js dynamically imports `${LIBS}/utils/utils.js` at runtime, which resolves to
// an unreachable CDN URL in the sandboxed web-test-runner environment, so this mock stands in.

export const SLD = 'aem';

export const MILO_EVENTS = { DEFERRED: 'milo:deferred' };

let currentConfig = {};

export function getConfig() {
  return currentConfig;
}

export function setConfig(conf = {}) {
  currentConfig = { ...conf };
  const { pathname, locales } = currentConfig;
  if (pathname && locales) {
    const seg = pathname.split('/').filter(Boolean)[0];
    const prefix = seg && Object.prototype.hasOwnProperty.call(locales, seg) ? `/${seg}` : '';
    currentConfig.locale = { prefix };
  }
  return currentConfig;
}

export function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = doc.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

const b64ToUtf8 = (str) => decodeURIComponent(escape(window.atob(str)));

export function parseEncodedConfig(encodedConfig) {
  try {
    return JSON.parse(b64ToUtf8(decodeURIComponent(encodedConfig)));
  } catch (e) {
    return null;
  }
}

export function createTag(tag, attributes, html, options = {}) {
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

export function loadLink(href, {
  id, as, callback, crossorigin, rel, fetchpriority,
} = {}) {
  const selector = rel === 'stylesheet'
    ? `link[href="${href}"][rel="stylesheet"]`
    : `link[href="${href}"]`;
  let link = document.head.querySelector(selector);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (id) link.setAttribute('id', id);
    if (as) link.setAttribute('as', as);
    if (crossorigin) link.setAttribute('crossorigin', crossorigin);
    if (fetchpriority) link.setAttribute('fetchpriority', fetchpriority);
    link.setAttribute('href', href);
    if (callback) {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (callback) {
    callback('noop');
  }
  return link;
}

export function loadStyle(href, callback) {
  return loadLink(href, { rel: 'stylesheet', callback });
}

// Simplified: real milo derives locale prefixing via lingo/geo config. We only
// need enough to prefix a path when setConfig has derived a locale.prefix.
export async function localizeLinkAsync(href) {
  const prefix = getConfig()?.locale?.prefix;
  if (!prefix) return href;
  try {
    const url = new URL(href);
    if (!url.pathname.startsWith(prefix)) url.pathname = `${prefix}${url.pathname}`;
    return url.href;
  } catch (e) {
    return href;
  }
}

export function createIntersectionObserver({ el, callback, once = true, options = {} }) {
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
