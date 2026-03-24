/**
 * Marketo getForm JSONP fetch and Htmltext → html + scripts extraction.
 */

import resolveScriptFilename from './mkto-script-filename-mapping.js';

function normalizeHost(host) {
  let h = String(host || '').trim();
  if (!h) return 'https://engage.adobe.com';
  if (!/^https?:\/\//i.test(h)) h = `https://${h}`;
  return h.replace(/\/$/, '');
}

export function buildGetFormBaseUrl(host, munchkinId, formId, pageUrl) {
  const root = normalizeHost(host);
  const qs = new URLSearchParams({
    munchkinId: String(munchkinId),
    form: String(formId),
    url: pageUrl,
    _: String(Date.now()),
  });
  return `${root}/index.php/form/getForm?${qs.toString()}`;
}

export function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = `__mktoFormJsonp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const script = document.createElement('script');
    const timeoutMs = 60000;
    let timeoutId;

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[cbName];
      script.remove();
    }

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Request timed out'));
    }, timeoutMs);

    window[cbName] = (data) => {
      cleanup();
      resolve(data);
    };

    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${encodeURIComponent(cbName)}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load script (network or blocked)'));
    };
    document.head.append(script);
  });
}

function flattenRows(arr, accum) {
  const out = accum || [];
  if (!arr) return out;
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    if (Array.isArray(v)) flattenRows(v, out);
    else out.push(v);
  }
  return out;
}

function getFlattenedFields(formData) {
  const fields = flattenRows(formData.rows || []);
  if (formData.fieldsetRows && typeof formData.fieldsetRows === 'object') {
    const vals = Object.values(formData.fieldsetRows);
    for (let i = 0; i < vals.length; i += 1) {
      flattenRows(vals[i], fields);
    }
  }
  return fields;
}

function extractFromHtmltext(htmltext, state, parser, subFolders) {
  const doc = parser.parseFromString(htmltext, 'text/html');
  const roots = [doc.head, doc.body].filter(Boolean);
  const found = [];

  function walk(node) {
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'SCRIPT') {
      found.push({ type: 'script', node });
      return;
    }
    if (tag === 'STYLE') {
      found.push({ type: 'style', node });
      return;
    }
    const children = node.childNodes;
    for (let i = 0; i < children.length; i += 1) {
      walk(children[i]);
    }
  }

  for (let r = 0; r < roots.length; r += 1) {
    walk(roots[r]);
  }

  for (let i = 0; i < found.length; i += 1) {
    const item = found[i];
    if (item.type === 'script') {
      const el = item.node;
      const content = el.textContent || '';
      const src = el.getAttribute('src') || '';
      const { filename, sourcePath } = resolveScriptFilename(
        content,
        src,
        state.scriptPos,
        state.usedScriptPaths,
        subFolders,
      );
      state.scripts.push({
        filename,
        content,
        src: src || undefined,
        position: state.scriptPos,
        sourcePath: sourcePath || undefined,
      });
      state.scriptPos += 1;
    }
    item.node.remove();
  }

  state.htmlParts.push(doc.body.innerHTML);
}

/**
 * @param {object} raw - getForm JSON payload
 * @param {{ subFolders?: boolean }} [options]
 */
export function extractFromFormData(raw, options = {}) {
  const { subFolders = false } = options;
  const parser = new DOMParser();
  const state = {
    htmlParts: [],
    scripts: [],
    scriptPos: 0,
    usedScriptPaths: new Map(),
  };

  const fields = getFlattenedFields(raw);
  for (let i = 0; i < fields.length; i += 1) {
    const ht = fields[i] && fields[i].Htmltext;
    if (typeof ht === 'string' && ht.length) {
      extractFromHtmltext(ht, state, parser, subFolders);
    }
  }

  return {
    html: state.htmlParts.join('\n'),
    scripts: state.scripts,
  };
}
