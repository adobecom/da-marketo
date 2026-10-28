export const CONFIG_PATH = 'tools/marketo-options.json';
export const SOURCE_PATHS = ['poi/values.json', 'poi/rules.json', 'poi-filter/rules.json', CONFIG_PATH];
const SOURCE_ROOT = 'https://admin.da.live/source/adobecom/da-marketo/';
const CODE = /^[A-Za-z0-9_.-]+$/;
const ASSIGNMENT = /^(\s*mktoFormsPrimaryProductInterest\s*=[ \t]?)([\s\S]*)$/;
const key = (code) => code.trim().toLowerCase();
const matches = (left, right) => key(left) === key(right);
const alphabetical = (left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' });

const clone = (value) => JSON.parse(JSON.stringify(value));
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort()
      .map((name) => [name, canonical(value[name])]));
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

function designerSheets(documents) {
  return [
    { path: 'poi/values.json', worksheet: sheet(documents['poi/values.json']) },
    ...productSheets(documents['poi/rules.json']).map((worksheet) => ({ path: 'poi/rules.json', worksheet })),
  ];
}

function resize(worksheet) {
  worksheet.total = worksheet.data.length;
  worksheet.limit = worksheet.data.length;
}

function sortProducts(worksheet) {
  worksheet.data.sort((left, right) => {
    const a = product(left);
    const b = product(right);
    if (a.code === '_') return b.code === '_' ? 0 : -1;
    if (b.code === '_') return 1;
    return alphabetical(a.label, b.label);
  });
  resize(worksheet);
}

function configParts(document) {
  const poi = sheet(document, 'poi');
  poi.data.forEach((row) => {
    if (typeof row.Key !== 'string' || !CODE.test(row.Key.trim())
      || typeof row.Name !== 'string' || !row.Name.trim()) {
      throw new Error('Malformed configurator POI row.');
    }
  });
  const definitions = sheet(document, 'required-preferences').data
    .filter((row) => row.prop === 'program.poi');
  if (definitions.length !== 1 || typeof definitions[0].options !== 'string') {
    throw new Error('Missing or malformed program.poi options.');
  }
  const [field] = definitions;
  let object;
  try {
    object = JSON.parse(field.options);
  } catch {
    object = undefined;
  }
  if (object !== undefined && (!object || Array.isArray(object) || typeof object !== 'object')) {
    throw new Error('Malformed program.poi options.');
  }
  const options = object ? Object.entries(object).map(([code, label]) => ({ code, label }))
    : field.options.split(',').map((raw) => {
      const colon = raw.indexOf(':');
      return colon === -1 ? { code: raw.trim(), label: raw.trim() }
        : { code: raw.slice(0, colon).trim(), label: raw.slice(colon + 1).trim() };
    });
  options.forEach(({ code, label }) => {
    if ((code && !CODE.test(code)) || typeof label !== 'string') {
      throw new Error('Malformed program.poi option.');
    }
  });
  return { poi, field, options, json: !!object };
}

function optionName({ code, label }) {
  const suffix = ` (${code})`;
  return label.toLowerCase().endsWith(suffix.toLowerCase())
    ? label.slice(0, -suffix.length) : label;
}

function configRow(label, code, original = {}) {
  const value = `${label} (${code})`;
  return {
    ...original, Key: code, Name: label, Value: value, KeyValue: `${code}:${value}`, MCZ: `${label}|${code}`,
  };
}

function writeConfig(parts) {
  parts.poi.data.sort((a, b) => alphabetical(a.Name, b.Name));
  resize(parts.poi);
  parts.options.sort((a, b) => {
    if (!a.code) return b.code ? -1 : 0;
    if (!b.code) return 1;
    return alphabetical(a.label, b.label);
  });
  parts.field.options = parts.json
    ? JSON.stringify(Object.fromEntries(parts.options.map(({ code, label }) => [code, label])))
    : parts.options.map(({ code, label }) => `${code}:${label}`).join(',');
}

function replaceCodes(documents, changes) {
  const next = clone(documents);
  designerSheets(next).forEach(({ worksheet }) => {
    worksheet.data.forEach((row) => {
      row.Values = row.Values.replace(/(\|\s*)([A-Za-z0-9_.-]+)(\s*)$/, (raw, head, code, tail) => (
        changes.has(key(code)) ? `${head}${changes.get(key(code))}${tail}` : raw
      ));
    });
  });
  const parts = configParts(next[CONFIG_PATH]);
  let configChanged = false;
  parts.poi.data = parts.poi.data.map((row) => {
    const code = changes.get(key(row.Key));
    if (!code || row.Key === code) return row;
    configChanged = true;
    return configRow(row.Name, code, row);
  });
  parts.options.forEach((option) => {
    const code = changes.get(key(option.code));
    if (!code || option.code === code) return;
    const label = optionName(option);
    option.code = code;
    option.label = `${label} (${code})`;
    configChanged = true;
  });
  if (configChanged) writeConfig(parts);
  sheet(next['poi-filter/rules.json'], 'meta').data.forEach((row) => {
    const assignment = typeof row.label === 'string' && row.label.match(ASSIGNMENT);
    if (!assignment) return;
    const entries = assignment[2].split('|').map((entry) => entry.replace(
      /^(\s*[^:|]+:)([A-Za-z0-9_.-]+)(\s*)$/,
      (raw, head, code, tail) => (
        changes.has(key(code)) ? `${head}${changes.get(key(code))}${tail}` : raw
      ),
    ));
    row.label = `${assignment[1]}${entries.join('|')}`;
  });
  return next;
}

function catalogRows(documents) {
  const entries = designerSheets(documents).flatMap(({ path, worksheet }) => worksheet.data
    .map((row) => ({ ...product(row), catalog: 'designer', path })));
  const parts = configParts(documents[CONFIG_PATH]);
  parts.poi.data.forEach((row) => entries.push({ code: row.Key.trim(), label: row.Name, catalog: 'configurator', path: 'poi' }));
  parts.options.filter(({ code }) => code).forEach((option) => entries.push({ code: option.code, label: optionName(option), catalog: 'configurator', path: 'program.poi' }));
  return entries.filter(({ code }) => code !== '_');
}

function editFilterEntries(document, code, merge = false) {
  sheet(document, 'meta').data.forEach((row) => {
    const assignment = typeof row.label === 'string' && row.label.match(ASSIGNMENT);
    if (!assignment || assignment[2].trim() === 'none') return;
    let seen = false;
    const original = assignment[2].split('|');
    const entries = original.filter((raw) => {
      const entry = raw.trim().match(/^([1-9]\d*):([A-Za-z0-9_.-]+)$/);
      if (!entry || !matches(entry[2], code)) return true;
      if (merge && !seen) {
        seen = true;
        return true;
      }
      return false;
    });
    if (entries.length !== original.length) {
      row.label = `${assignment[1]}${entries.length ? entries.join('|') : 'none'}`;
    }
  });
}

function fieldDefinitions(document) {
  const rows = sheet(document).data;
  return ['poi', 'poi-filter'].map((folder) => {
    const definitions = rows.filter((row) => row?.Folder === folder);
    const type = definitions[0]?.Type;
    const allowed = folder === 'poi' ? ['select'] : ['select', 'fieldset'];
    if (definitions.length !== 1 || typeof type !== 'string'
      || !allowed.includes(type.trim().toLowerCase())) {
      throw new Error(`The field catalog requires a valid ${folder} field.`);
    }
    return { ...definitions[0], Type: type.trim().toLowerCase() };
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
        if (!entry || seen.has(key(entry[2]))) {
          list.error = 'Malformed entry or duplicate backend code.';
        } else {
          seen.add(key(entry[2]));
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
    this.codeRenames = new Map();
    this.loaded = false;
    this.busy = false;
    this.reloadRequired = false;
  }

  async request(path, options = {}) {
    const source = path === CONFIG_PATH ? path : `marketodesigner/${path}`;
    const response = await this.fetch(`${SOURCE_ROOT}${source}`, { cache: 'no-store', ...options });
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
      catalogRows(Object.fromEntries(SOURCE_PATHS.map((path, i) => [path, sources[i]])));
      filterLists(sources[2]);
      this.definitions = definitions;
      this.originals = Object.fromEntries(SOURCE_PATHS.map((path, i) => [path, sources[i]]));
      this.drafts = clone(this.originals);
      this.codeRenames.clear();
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

  get comparisonOriginals() {
    return this.codeRenames.size
      ? replaceCodes(this.originals, new Map([...this.codeRenames]
        .map(([before, after]) => [key(before), after])))
      : this.originals;
  }

  get originalLists() {
    return this.loaded ? filterLists(this.comparisonOriginals['poi-filter/rules.json']) : [];
  }

  get reviewChanges() {
    if (!this.loaded) return [];
    const changes = [];
    const originals = this.comparisonOriginals;
    this.codeRenames.forEach((after, before) => {
      if (!same(this.originals, replaceCodes(this.originals, new Map([[key(before), after]])))) {
        changes.push(before === after ? `Normalize backend code to ${after}.`
          : `Change backend code ${before} to ${after}.`);
      }
    });
    const before = new Map();
    sheet(originals['poi/values.json']).data.map(product).forEach((item) => {
      if (!before.has(key(item.code))) before.set(key(item.code), item);
    });
    const after = new Map();
    sheet(this.drafts['poi/values.json']).data.map(product).forEach((item) => {
      if (!after.has(key(item.code))) after.set(key(item.code), item);
    });
    if (this.changed.includes('poi/values.json')) {
      after.forEach((item, id) => {
        if (!before.has(id)) changes.push(`Add ${item.label} (${item.code}) to the product catalog.`);
        else if (before.get(id).label !== item.label) {
          changes.push(`Rename ${before.get(id).label} to ${item.label} (${item.code}).`);
        }
      });
      before.forEach((item, id) => {
        if (!after.has(id)) changes.push(`Remove ${item.label} (${item.code}) from the product catalog.`);
      });
      if (!changes.length) changes.push('Update product catalog labels, order or duplicates.');
    }
    if (this.changed.includes('poi/rules.json')) {
      changes.push('Update product picklists across affected worksheets, including existing locale entries.');
    }
    this.lists.filter((list) => !list.error).forEach((list) => {
      const original = this.originalLists.find((entry) => entry.index === list.index);
      const previous = new Set(original?.entries.map((entry) => key(entry.code)));
      const current = new Set(list.entries.map((entry) => key(entry.code)));
      new Set([...previous, ...current]).forEach((code) => {
        if (previous.has(code) === current.has(code)) return;
        const item = after.get(code) || before.get(code);
        const label = item?.label || code;
        const displayCode = item?.code || code;
        const action = current.has(code) ? 'Include' : 'Remove';
        const direction = current.has(code) ? 'in' : 'from';
        changes.push(`${action} ${label} (${displayCode}) ${direction} ${list.title}.`);
      });
    });
    if (this.changed.includes(CONFIG_PATH)) {
      const entries = (documents) => catalogRows(documents)
        .filter((entry) => entry.catalog === 'configurator');
      const oldEntries = entries(originals);
      const newEntries = entries(this.drafts);
      const codes = new Map([...oldEntries, ...newEntries]
        .map((entry) => [key(entry.code), entry.code]));
      codes.forEach((code, id) => {
        const labels = (items) => [...new Set(items.filter((entry) => key(entry.code) === id)
          .map((entry) => entry.label))].sort(alphabetical);
        const oldLabels = labels(oldEntries);
        const newLabels = labels(newEntries);
        const count = (items) => items.filter((entry) => key(entry.code) === id).length;
        if (!same(oldLabels, newLabels) || count(oldEntries) !== count(newEntries)) {
          changes.push(`Configurator ${code}: ${oldLabels.join(', ') || 'not enabled'} -> ${newLabels.join(', ') || 'not enabled'}.`);
        }
      });
      changes.push('Update the configurator POI worksheet and program.poi options; leave other settings unchanged.');
    }
    return changes;
  }

  summary(path) {
    const sheets = (doc) => (Array.isArray(doc.data) ? { data: doc } : doc);
    const before = sheets(this.originals[path]);
    const after = sheets(this.drafts[path]);
    let added = 0;
    let removed = 0;
    let changed = 0;
    Object.entries(after).forEach(([name, value]) => {
      if (!Array.isArray(value?.data)) return;
      const previous = before[name]?.data || [];
      added += Math.max(0, value.data.length - previous.length);
      removed += Math.max(0, previous.length - value.data.length);
      changed += previous.filter((row, i) => !same(row, value.data[i])).length;
    });
    return `${path}: ${added} rows added; ${removed} rows removed; ${changed} existing rows updated.`;
  }

  get products() {
    if (!this.loaded) return [];
    const choices = new Map();
    const add = (entry, original = false) => {
      const id = key(entry.code);
      if (original && choices.has(id)) return;
      if (!choices.has(id)) {
        choices.set(id, {
          code: entry.code,
          label: entry.label,
          labels: [],
          designer: false,
          configurator: false,
        });
      }
      const item = choices.get(id);
      if (!item.labels.includes(entry.label)) item.labels.push(entry.label);
      if (!original) item[entry.catalog] = true;
    };
    catalogRows(this.drafts).forEach((entry) => add(entry));
    const originals = catalogRows(this.comparisonOriginals);
    originals.forEach((entry) => add(entry, true));
    [...this.lists, ...this.originalLists].forEach((list) => list.entries.forEach(({ code }) => {
      if (code !== '_' && !choices.has(key(code))) {
        choices.set(key(code), {
          code, label: code, labels: [code], stale: true, designer: false, configurator: false,
        });
      } else if (code !== '_' && !choices.get(key(code)).designer) {
        choices.get(key(code)).stale = true;
      }
    }));
    const existing = new Set([
      ...originals.map((entry) => key(entry.code)),
      ...this.originalLists.flatMap((list) => list.entries.map((entry) => key(entry.code))),
    ]);
    return [...choices.values()]
      .map((item) => ({ ...item, isNew: !existing.has(key(item.code)) }))
      .sort((a, b) => alphabetical(a.label, b.label));
  }

  aliases(code, catalog) {
    const aliases = new Map();
    catalogRows(this.drafts).filter((entry) => matches(entry.code, code)
      && entry.catalog === catalog).forEach((entry) => {
      if (!aliases.has(entry.label)) {
        aliases.set(entry.label, {
          label: entry.label,
          count: 0,
          sources: new Set(),
          codes: new Set(),
        });
      }
      const alias = aliases.get(entry.label);
      alias.count += 1;
      alias.sources.add(entry.path);
      alias.codes.add(entry.code);
    });
    return [...aliases.values()].sort((a, b) => alphabetical(a.label, b.label));
  }

  hasDuplicates(code, catalog) {
    if (catalog === 'designer') {
      return designerSheets(this.drafts).some(({ worksheet }) => worksheet.data
        .filter((row) => matches(product(row).code, code)).length > 1)
        || this.lists.some((list) => {
          const assignment = list.label.match(ASSIGNMENT);
          return assignment && assignment[2].split('|').filter((raw) => {
            const entry = raw.trim().match(/^[1-9]\d*:([A-Za-z0-9_.-]+)$/);
            return entry && matches(entry[1], code);
          }).length > 1;
        });
    }
    const parts = configParts(this.drafts[CONFIG_PATH]);
    return parts.poi.data.filter((row) => matches(row.Key, code)).length > 1
      || parts.options.filter((option) => matches(option.code, code)).length > 1;
  }

  memberships(code) {
    return new Set(this.lists.filter((list) => !list.error
      && list.entries.some((entry) => matches(entry.code, code))).map((list) => list.index));
  }

  validateAddition(labelInput, codeInput) {
    this.assertEditable();
    const label = validLabel(labelInput);
    const code = codeInput.trim();
    if (!CODE.test(code) || code === '_') throw new Error('Enter a valid, non-reserved backend code.');
    if (catalogRows(this.drafts).some((item) => matches(item.code, code))) {
      throw new Error(`Backend code ${code} already exists. Enable it in the other catalog from its workspace.`);
    }
    return { label, code };
  }

  add(labelInput, codeInput, catalogs = ['designer']) {
    const { label, code } = this.validateAddition(labelInput, codeInput);
    if (!catalogs.length || catalogs.some((catalog) => !['designer', 'configurator'].includes(catalog))) {
      throw new Error('Choose at least one catalog.');
    }
    const previous = this.drafts;
    try {
      catalogs.forEach((catalog) => this.setEnabled(code, catalog, true, label));
    } catch (error) {
      this.drafts = previous;
      throw error;
    }
    return code;
  }

  setEnabled(code, catalog, enabled, labelInput) {
    this.assertEditable();
    if (!['designer', 'configurator'].includes(catalog)) throw new Error('Choose a valid catalog.');
    if (!CODE.test(code) || code === '_') throw new Error('Enter a valid, non-reserved backend code.');
    const next = clone(this.drafts);
    const label = enabled ? validLabel(labelInput) : '';
    if (catalog === 'designer') {
      designerSheets(next).forEach(({ worksheet }) => {
        if (enabled) {
          if (!worksheet.data.some((row) => matches(product(row).code, code))) {
            worksheet.data.push({ Values: `${label}|${code}` });
            sortProducts(worksheet);
          }
        } else {
          const previous = worksheet.data.length;
          worksheet.data = worksheet.data.filter((row) => !matches(product(row).code, code));
          if (worksheet.data.length !== previous) resize(worksheet);
        }
      });
      if (!enabled) editFilterEntries(next['poi-filter/rules.json'], code);
    } else {
      const parts = configParts(next[CONFIG_PATH]);
      if (enabled) {
        if (/[,:]/.test(label)) throw new Error('Configurator labels cannot contain commas or colons.');
        if (!parts.poi.data.some((row) => matches(row.Key, code))) {
          parts.poi.data.push(configRow(label, code));
        }
        if (!parts.options.some((option) => matches(option.code, code))) {
          parts.options.push({ code, label: `${label} (${code})` });
        }
      } else {
        parts.poi.data = parts.poi.data.filter((row) => !matches(row.Key, code));
        parts.options = parts.options.filter((option) => !matches(option.code, code));
      }
      writeConfig(parts);
    }
    this.drafts = next;
  }

  renameAlias(code, catalog, oldLabel, labelInput) {
    this.renameAliases([{ code, catalog, oldLabel, label: labelInput }]);
  }

  renameCode(code, codeInput) {
    this.assertEditable();
    const nextCode = codeInput.trim();
    if (!CODE.test(nextCode) || nextCode === '_') {
      throw new Error('Enter a valid, non-reserved backend code.');
    }
    if (!this.products.some((item) => matches(item.code, code))) {
      throw new Error('Select an existing POI.');
    }
    if (!matches(code, nextCode) && this.products.some((item) => matches(item.code, nextCode))) {
      throw new Error(`Backend code ${nextCode} already exists.`);
    }
    const next = replaceCodes(this.drafts, new Map([[key(code), nextCode]]));
    if (same(next, this.drafts)) return nextCode;
    this.codeRenames.forEach((current, original) => {
      if (matches(current, code)) this.codeRenames.set(original, nextCode);
    });
    const originalCodes = [
      ...catalogRows(this.originals).map((item) => item.code),
      ...filterLists(this.originals['poi-filter/rules.json'])
        .flatMap((list) => list.entries.map((entry) => entry.code)),
    ];
    if (originalCodes.some((original) => matches(original, code))
      && ![...this.codeRenames.keys()].some((original) => matches(original, code))) {
      this.codeRenames.set(code, nextCode);
    }
    this.drafts = next;
    return nextCode;
  }

  renameAliases(edits) {
    this.assertEditable();
    const updates = edits.map((edit) => {
      try {
        const label = validLabel(edit.label);
        if (!this.aliases(edit.code, edit.catalog).some((alias) => alias.label === edit.oldLabel)) {
          throw new Error('Select an existing label.');
        }
        if (edit.catalog === 'configurator' && /[,:]/.test(label)) {
          throw new Error('Configurator labels cannot contain commas or colons.');
        }
        return { ...edit, label };
      } catch (error) {
        error.labelEdit = edit;
        throw error;
      }
    });
    const next = clone(this.drafts);
    const replacement = (code, catalog, label) => updates.find((edit) => (
      matches(edit.code, code) && edit.catalog === catalog && edit.oldLabel === label
    ));
    if (updates.some((edit) => edit.catalog === 'designer')) {
      designerSheets(next).forEach(({ worksheet }) => {
        let changed = false;
        worksheet.data.forEach((row) => {
          const item = product(row);
          const edit = replacement(item.code, 'designer', item.label);
          if (edit) {
            row.Values = `${edit.label}|${row.Values.slice(row.Values.indexOf('|') + 1)}`;
            changed = true;
          }
        });
        if (changed) sortProducts(worksheet);
      });
    }
    if (updates.some((edit) => edit.catalog === 'configurator')) {
      const parts = configParts(next[CONFIG_PATH]);
      parts.poi.data = parts.poi.data.map((row) => {
        const edit = replacement(row.Key, 'configurator', row.Name);
        return edit ? configRow(edit.label, row.Key, row) : row;
      });
      parts.options.forEach((option) => {
        const edit = replacement(option.code, 'configurator', optionName(option));
        if (edit) option.label = `${edit.label} (${option.code})`;
      });
      writeConfig(parts);
    }
    this.drafts = next;
  }

  mergeDuplicates(code, catalog, label) {
    this.assertEditable();
    if (!this.aliases(code, catalog).some((alias) => alias.label === label)) {
      throw new Error('Select a label to keep.');
    }
    const next = clone(this.drafts);
    if (catalog === 'designer') {
      designerSheets(next).forEach(({ worksheet }) => {
        const rows = worksheet.data.filter((row) => matches(product(row).code, code));
        const keep = rows.find((row) => product(row).label === label) || rows[0];
        worksheet.data = worksheet.data
          .filter((row) => !matches(product(row).code, code) || row === keep);
        if (rows.length > 1) sortProducts(worksheet);
      });
      editFilterEntries(next['poi-filter/rules.json'], code, true);
    } else {
      const parts = configParts(next[CONFIG_PATH]);
      const rows = parts.poi.data.filter((row) => matches(row.Key, code));
      const keep = rows.find((row) => row.Name === label) || rows[0];
      const option = parts.options.find((item) => matches(item.code, code));
      const backend = keep?.Key || option.code;
      parts.poi.data = parts.poi.data.filter((row) => !matches(row.Key, code));
      parts.poi.data.push(configRow(label, backend, keep));
      parts.options = parts.options.filter((item) => !matches(item.code, code));
      parts.options.push({ code: backend, label: `${label} (${backend})` });
      writeConfig(parts);
    }
    this.drafts = next;
  }

  rename(code, labelInput) {
    this.assertEditable();
    const label = validLabel(labelInput);
    if (!this.products.some((item) => matches(item.code, code) && item.designer)) {
      throw new Error('Select an existing backend product to rename.');
    }
    const next = clone(this.drafts);
    const worksheets = [sheet(next['poi/values.json']), ...productSheets(next['poi/rules.json'])];
    worksheets.forEach((worksheet) => {
      let changed = false;
      worksheet.data.forEach((row) => {
        if (matches(product(row).code, code)) {
          row.Values = `${label}|${row.Values.slice(row.Values.indexOf('|') + 1)}`;
          changed = true;
        }
      });
      if (changed) sortProducts(worksheet);
    });
    this.drafts = next;
  }

  updateMemberships(code, selection, prefixInput) {
    this.assertEditable();
    const selected = this.products.find((item) => matches(item.code, code));
    if (!selected) throw new Error('Select a product.');
    const prefix = String(prefixInput).trim();
    if (!/^[1-9]\d*$/.test(prefix)) throw new Error('The membership prefix must be a positive integer.');
    const lists = this.lists.filter((list) => !list.error);
    const rows = sheet(this.drafts['poi-filter/rules.json'], 'meta').data;
    lists.forEach((list) => {
      const contains = list.entries.some((entry) => matches(entry.code, code));
      if (contains === selection.has(list.index)) return;
      const entries = list.entries.filter((entry) => !matches(entry.code, code))
        .map((entry) => entry.raw);
      if (selection.has(list.index)) entries.push(`${prefix}:${selected.code}`);
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
    const entries = current.entries.filter((entry) => !matches(entry.code, code));
    const previousIndex = original.entries.findIndex((entry) => matches(entry.code, code));
    if (previousIndex !== -1) {
      const successor = original.entries.slice(previousIndex + 1)
        .find((entry) => entries.some((item) => matches(item.code, entry.code)));
      const predecessor = original.entries.slice(0, previousIndex).reverse()
        .find((entry) => entries.some((item) => matches(item.code, entry.code)));
      let position = 0;
      if (successor) position = entries.findIndex((entry) => matches(entry.code, successor.code));
      else if (predecessor) {
        position = entries.findIndex((entry) => matches(entry.code, predecessor.code)) + 1;
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
      catalogRows(this.drafts);
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
      if (!this.changed.length) this.codeRenames.clear();
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
