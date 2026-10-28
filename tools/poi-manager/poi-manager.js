export const SOURCE_PATHS = ['poi/values.json', 'poi/rules.json', 'poi-filter/rules.json'];
const SOURCE_ROOT = 'https://admin.da.live/source/adobecom/da-marketo/marketodesigner/';
const CODE = /^[A-Za-z0-9_.-]+$/;
const ASSIGNMENT = /^(\s*mktoFormsPrimaryProductInterest\s*=[ \t]?)([\s\S]*)$/;

const clone = (value) => JSON.parse(JSON.stringify(value));
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));

function sheet(document, name = 'data') {
  const result = Array.isArray(document?.data) ? document : document?.[name];
  if (!Array.isArray(result?.data)) throw new Error(`Missing or malformed ${name} worksheet.`);
  return result;
}

function product(row) {
  if (typeof row?.Values !== 'string') throw new Error('Product rows require a string Values column.');
  const parts = row.Values.split('|');
  const label = parts[0].trim();
  const code = parts[1]?.trim();
  if (parts.length !== 2 || !label || /[\r\n]/.test(label) || !CODE.test(code || '')) {
    throw new Error(`Malformed product Values: ${row.Values}`);
  }
  return { label, code };
}

function validLabel(value) {
  const label = value.trim();
  if (!label || /[|\r\n]/.test(value)) {
    throw new Error('Enter a nonblank display label without pipes or line breaks.');
  }
  return label;
}

function productSheets(document) {
  if (Array.isArray(document?.data)) return [document];
  if (!document || typeof document !== 'object') throw new Error('Missing product worksheets.');
  const worksheets = Object.entries(document)
    .filter(([name, value]) => !['meta', 'settings'].includes(name)
      && !name.startsWith(':') && value && typeof value === 'object'
      && ('data' in value || document[':names']?.includes(name)));
  if (!worksheets.length) throw new Error('Missing product worksheets.');
  return worksheets.map(([name, value]) => {
    if (!Array.isArray(value.data)) throw new Error(`Malformed product worksheet: ${name}`);
    return value;
  });
}

function fieldDefinitions(document) {
  const rows = sheet(document).data;
  return ['poi', 'poi-filter'].map((folder) => {
    const matches = rows.filter((row) => row?.Folder === folder);
    const type = matches[0]?.Type;
    const allowed = folder === 'poi' ? ['select'] : ['select', 'fieldset'];
    if (matches.length !== 1 || typeof type !== 'string'
      || !allowed.includes(type.trim().toLowerCase())) {
      throw new Error(`The field catalog requires a valid ${folder} field.`);
    }
    return { ...matches[0], Type: type.trim().toLowerCase() };
  });
}

function filterLists(document) {
  return sheet(document, 'meta').data.flatMap((row, index) => {
    const match = typeof row?.label === 'string' && row.label.match(ASSIGNMENT);
    if (!match) return [];
    const list = { index, title: String(row.value ?? ''), label: row.label, head: match[1] };
    const body = match[2];
    list.entries = [];
    if (body.trim() !== 'none') {
      const seen = new Set();
      body.split('|').forEach((raw) => {
        const entry = raw.trim().match(/^([1-9]\d*):([A-Za-z0-9_.-]+)$/);
        if (!entry || seen.has(entry[2])) {
          list.error = 'Malformed entry or duplicate backend code.';
        } else {
          seen.add(entry[2]);
          list.entries.push({ raw, prefix: entry[1], code: entry[2] });
        }
      });
    }
    return [list];
  });
}

export class PoiManager {
  constructor(sdk) {
    if ((sdk?.org !== undefined && sdk.org !== 'adobecom')
      || (sdk?.repo !== undefined && sdk.repo !== 'da-marketo')) {
      throw new Error('POI Manager only supports adobecom/da-marketo.');
    }
    if (typeof sdk?.actions?.daFetch !== 'function') {
      throw new Error('Open POI Manager in DA and check DA sign-in and site permissions.');
    }
    this.fetch = sdk.actions.daFetch;
    this.originals = {};
    this.drafts = {};
    this.loaded = false;
    this.busy = false;
    this.reloadRequired = false;
  }

  async request(path, options = {}) {
    const response = await this.fetch(`${SOURCE_ROOT}${path}`, { cache: 'no-store', ...options });
    if (!response.ok) {
      const help = [401, 403].includes(response.status)
        ? ' Check DA sign-in and site permissions.' : '';
      throw new Error(`${path}: request failed (${response.status}).${help}`);
    }
    return response;
  }

  async read(path) {
    const response = await this.request(path);
    try {
      return await response.json();
    } catch {
      throw new Error(`${path}: invalid JSON source.`);
    }
  }

  assertEditable() {
    if (!this.loaded || this.busy || this.reloadRequired) {
      throw new Error('Editing unavailable. Wait for the operation or reload source data.');
    }
  }

  async load() {
    if (this.busy) throw new Error('An operation is already running.');
    this.busy = true;
    try {
      const documents = await Promise.all(['fields.json', ...SOURCE_PATHS]
        .map((path) => this.read(path)));
      const [fields, ...sources] = documents;
      const definitions = fieldDefinitions(fields);
      sheet(sources[0]).data.forEach(product);
      filterLists(sources[2]);
      this.definitions = definitions;
      this.originals = Object.fromEntries(SOURCE_PATHS.map((path, i) => [path, sources[i]]));
      this.drafts = clone(this.originals);
      this.loaded = true;
      this.reloadRequired = false;
    } finally {
      this.busy = false;
    }
  }

  get changed() {
    return SOURCE_PATHS.filter((path) => !same(this.originals[path], this.drafts[path]));
  }

  get lists() {
    return this.loaded ? filterLists(this.drafts['poi-filter/rules.json']) : [];
  }

  get originalLists() {
    return this.loaded ? filterLists(this.originals['poi-filter/rules.json']) : [];
  }

  get reviewChanges() {
    if (!this.loaded) return [];
    const changes = [];
    const before = new Map();
    sheet(this.originals['poi/values.json']).data.map(product).forEach((item) => {
      if (!before.has(item.code)) before.set(item.code, item);
    });
    const after = new Map(this.products.map((item) => [item.code, item]));
    if (this.changed.includes('poi/values.json')) {
      after.forEach((item, code) => {
        if (item.stale) return;
        if (!before.has(code)) changes.push(`Add ${item.label} (${code}) to the product catalog.`);
        else if (before.get(code).label !== item.label) {
          changes.push(`Rename ${before.get(code).label} to ${item.label} (${code}).`);
        }
      });
    }
    if (this.changed.includes('poi/rules.json')) {
      changes.push('Update product picklists across affected worksheets, including existing locale entries.');
    }
    this.lists.filter((list) => !list.error).forEach((list) => {
      const original = this.originalLists.find((entry) => entry.index === list.index);
      const previous = new Set(original?.entries.map((entry) => entry.code));
      const current = new Set(list.entries.map((entry) => entry.code));
      new Set([...previous, ...current]).forEach((code) => {
        if (previous.has(code) === current.has(code)) return;
        const label = after.get(code)?.label || before.get(code)?.label || code;
        const action = current.has(code) ? 'Include' : 'Remove';
        const direction = current.has(code) ? 'in' : 'from';
        changes.push(`${action} ${label} (${code}) ${direction} ${list.title}.`);
      });
    });
    return changes;
  }

  summary(path) {
    const sheets = (doc) => (Array.isArray(doc.data) ? { data: doc } : doc);
    const before = sheets(this.originals[path]);
    const after = sheets(this.drafts[path]);
    let added = 0;
    let changed = 0;
    Object.entries(after).forEach(([name, value]) => {
      if (!Array.isArray(value?.data)) return;
      const previous = before[name]?.data || [];
      added += Math.max(0, value.data.length - previous.length);
      changed += previous.filter((row, i) => !same(row, value.data[i])).length;
    });
    return `${path}: ${added} product rows added; ${changed} existing rows updated.`;
  }

  get products() {
    if (!this.loaded) return [];
    const choices = new Map();
    sheet(this.drafts['poi/values.json']).data.forEach((row) => {
      const item = product(row);
      if (item.code !== '_' && !choices.has(item.code)) choices.set(item.code, item);
    });
    this.lists.forEach((list) => list.entries.forEach(({ code }) => {
      if (code !== '_' && !choices.has(code)) choices.set(code, { code, label: code, stale: true });
    }));
    return [...choices.values()];
  }

  memberships(code) {
    return new Set(this.lists.filter((list) => !list.error
      && list.entries.some((entry) => entry.code === code)).map((list) => list.index));
  }

  validateAddition(labelInput, codeInput) {
    this.assertEditable();
    const label = validLabel(labelInput);
    const code = codeInput.trim();
    if (!CODE.test(code) || code === '_') throw new Error('Enter a valid, non-reserved backend code.');
    const worksheets = [sheet(this.drafts['poi/values.json']), ...productSheets(this.drafts['poi/rules.json'])];
    const existing = worksheets.flatMap((worksheet) => worksheet.data.map(product));
    if (existing.some((item) => item.code === code)) throw new Error(`Backend code ${code} already exists.`);
    return { label, code };
  }

  add(labelInput, codeInput) {
    const { label, code } = this.validateAddition(labelInput, codeInput);
    const next = clone(this.drafts);
    const worksheets = [sheet(next['poi/values.json']), ...productSheets(next['poi/rules.json'])];
    worksheets.forEach((worksheet) => {
      worksheet.data.push({ Values: `${label}|${code}` });
      worksheet.total = worksheet.data.length;
      worksheet.limit = worksheet.data.length;
    });
    this.drafts = next;
    return code;
  }

  rename(code, labelInput) {
    this.assertEditable();
    const label = validLabel(labelInput);
    if (!this.products.some((item) => item.code === code && !item.stale)) {
      throw new Error('Select an existing backend product to rename.');
    }
    const next = clone(this.drafts);
    const worksheets = [sheet(next['poi/values.json']), ...productSheets(next['poi/rules.json'])];
    worksheets.forEach((worksheet) => worksheet.data.forEach((row) => {
      if (product(row).code === code) {
        row.Values = `${label}|${row.Values.slice(row.Values.indexOf('|') + 1)}`;
      }
    }));
    this.drafts = next;
  }

  updateMemberships(code, selection, prefixInput) {
    this.assertEditable();
    const selected = this.products.find((item) => item.code === code);
    if (!selected) throw new Error('Select a product.');
    const prefix = String(prefixInput).trim();
    if (!/^[1-9]\d*$/.test(prefix)) throw new Error('The membership prefix must be a positive integer.');
    const lists = this.lists.filter((list) => !list.error);
    if (selected.stale && lists.some((list) => selection.has(list.index)
      && !list.entries.some((entry) => entry.code === code))) {
      throw new Error('This backend code is removal-only; it cannot be added to another list.');
    }
    const rows = sheet(this.drafts['poi-filter/rules.json'], 'meta').data;
    lists.forEach((list) => {
      const contains = list.entries.some((entry) => entry.code === code);
      if (contains === selection.has(list.index)) return;
      const entries = list.entries.filter((entry) => entry.code !== code).map((entry) => entry.raw);
      if (selection.has(list.index)) entries.push(`${prefix}:${code}`);
      rows[list.index].label = `${list.head}${entries.length ? entries.join('|') : 'none'}`;
    });
  }

  undoMembership(code, index) {
    this.assertEditable();
    const original = this.originalLists.find((list) => list.index === index);
    const current = this.lists.find((list) => list.index === index);
    if (!original || original.error || !current || current.error) {
      throw new Error('This list cannot be edited.');
    }
    const entries = current.entries.filter((entry) => entry.code !== code);
    const previousIndex = original.entries.findIndex((entry) => entry.code === code);
    if (previousIndex !== -1) {
      const successor = original.entries.slice(previousIndex + 1)
        .find((entry) => entries.some((item) => item.code === entry.code));
      const predecessor = original.entries.slice(0, previousIndex).reverse()
        .find((entry) => entries.some((item) => item.code === entry.code));
      let position = 0;
      if (successor) position = entries.findIndex((entry) => entry.code === successor.code);
      else if (predecessor) {
        position = entries.findIndex((entry) => entry.code === predecessor.code) + 1;
      }
      entries.splice(position, 0, original.entries[previousIndex]);
    }
    const unchanged = same(
      entries.map((entry) => entry.raw),
      original.entries.map((entry) => entry.raw),
    );
    const label = unchanged ? original.label
      : `${current.head}${entries.length ? entries.map((entry) => entry.raw).join('|') : 'none'}`;
    sheet(this.drafts['poi-filter/rules.json'], 'meta').data[index].label = label;
  }

  async save(onProgress = () => {}) {
    this.assertEditable();
    if (!this.changed.length) return [];
    this.busy = true;
    const verified = [];
    let uncertain;
    try {
      sheet(this.drafts['poi/values.json']).data.forEach(product);
      const currentFields = await this.read('fields.json');
      let definitions;
      try {
        definitions = fieldDefinitions(currentFields);
      } catch {
        throw new Error('Field definitions are no longer valid. Reload and review before saving.');
      }
      if (!same(definitions, this.definitions)) {
        throw new Error('Field definitions changed. Reload and review before saving.');
      }
      const paths = this.changed;
      const checkSource = async (path) => {
        if (!same(await this.read(path), this.originals[path])) {
          throw new Error(`${path}: source changed. Reload and review before saving.`);
        }
      };
      for (const path of paths) await checkSource(path);
      for (const path of paths) {
        onProgress(path, 'Checking');
        await checkSource(path);
        const body = new FormData();
        body.append('data', new Blob([JSON.stringify(this.drafts[path])], { type: 'application/json' }));
        uncertain = path;
        onProgress(path, 'Saving');
        await this.request(path, { method: 'PUT', body });
        onProgress(path, 'Verifying');
        if (!same(await this.read(path), this.drafts[path])) {
          throw new Error('Saved source verification differs from the intended draft.');
        }
        uncertain = undefined;
        this.originals[path] = clone(this.drafts[path]);
        verified.push(path);
      }
      return verified;
    } catch (error) {
      if (uncertain) this.reloadRequired = true;
      const warning = uncertain
        ? ` ${uncertain} may already have been saved. Reload before retrying.` : '';
      throw new Error(`${error.message}${warning} Verified saves: ${verified.join(', ') || 'none'}. Remaining edits are local.`);
    } finally {
      this.busy = false;
    }
  }
}
