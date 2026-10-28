import { expect } from '@esm-bundle/chai';
import { PoiManager, SOURCE_PATHS, CONFIG_PATH } from '../../tools/poi-manager/poi-manager.js';
import mountManager from '../../tools/poi-manager/ui.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
const worksheet = (data) => ({ total: data.length, limit: data.length, offset: 0, data });
const rows = (...values) => values.map((Values) => ({ Values, extra: 'preserve' }));
const assignment = (value, label) => ({ value, label: `mktoFormsPrimaryProductInterest = ${label}`, extra: 'keep' });
const configOption = (Key, Name) => ({ Key, Name, Value: `${Name} (${Key})`, KeyValue: `${Key}:${Name} (${Key})`, MCZ: `${Name}|${Key}` });

function fixtures() {
  return {
    [CONFIG_PATH]: {
      poi: worksheet([
        configOption('A', 'Config alpha'), configOption('a', 'Alternate alpha'), configOption('C', 'Config only'),
      ]),
      'required-preferences': worksheet([
        { prop: 'program.poi', options: ':,A:Config alpha (A),a:Alternate alpha (a),C:Config only (C)', description: 'keep' },
        { prop: 'program.other', options: 'keep' },
      ]),
      metadata: worksheet([{ Sheet: 'keep', Title: 'Keep metadata' }]),
      ':names': ['poi', 'required-preferences', 'metadata'],
    },
    'fields.json': worksheet([
      { Folder: 'poi', Field: 'Product', Type: ' SELECT ' },
      { Folder: 'poi-filter', Field: 'Filter', Type: 'FieldSet' },
      { Folder: 'other', Type: 'text' },
    ]),
    'poi/values.json': worksheet(rows('Select|_', 'Alpha|A', 'Duplicate|A', 'Lower|a', 'Beta|B')),
    'poi/rules.json': {
      data: worksheet(rows('Select|_', 'Alpha| A ', 'Beta|B')),
      fr: worksheet(rows('Autre|A')),
      meta: worksheet([{ value: 'en', label: 'data' }]),
      settings: worksheet([{ action: 'Show' }]),
      ':names': ['data', 'fr', 'meta', 'settings'],
      ':type': 'multi-sheet',
    },
    'poi-filter/rules.json': {
      meta: worksheet([
        assignment('First', ' 7:A |2:B'),
        assignment('Second', 'none'),
        assignment('Stale', '3:OLD'),
        assignment('Invalid', '1:A|2:A'),
        { value: 'Locale', label: 'en_us' },
      ]),
      settings: worksheet([{ action: 'Show', field: 'keep' }]),
      ':names': ['meta', 'settings'],
      ':type': 'multi-sheet',
    },
  };
}

function backendFixtures() {
  const docs = fixtures();
  docs['poi/values.json'] = worksheet(rows('Select|_', 'Enterprise coworker|ADOBECXENTWORKER', 'Beta|B'));
  docs['poi/rules.json'].data = worksheet(rows('English label| adobecxentworker ', 'Beta|B'));
  docs['poi/rules.json'].fr = worksheet(rows('French label|ADOBECXENTWORKER'));
  docs['poi-filter/rules.json'].meta = worksheet([
    assignment('First', ' 7:ADOBECXENTWORKER |2:B'),
    assignment('Second', 'none'),
    assignment('Duplicates', '1:ADOBECXENTWORKER|2:adobecxentworker'),
    { value: 'Unrelated', label: 'ADOBECXENTWORKER' },
  ]);
  docs[CONFIG_PATH].poi = worksheet([
    configOption('AdobeCxEntWorker', 'Config label'), configOption('B', 'Beta'),
  ]);
  docs[CONFIG_PATH]['required-preferences'].data[0].options = [
    ':', 'adobecxentworker:Config label (adobecxentworker)', 'B:Beta (B)',
  ].join(',');
  return docs;
}

function setup(documents = fixtures(), context = {}) {
  const remote = copy(documents);
  const calls = [];
  let hook;
  const sdk = {
    org: 'adobecom',
    repo: 'da-marketo',
    ...context,
    actions: {
      daFetch: async (url, options) => {
        const path = url.includes('/marketodesigner/')
          ? url.split('/marketodesigner/')[1] : CONFIG_PATH;
        calls.push({ path, options, url });
        const override = await hook?.(path, options, calls);
        if (override) return override;
        if (options.method === 'PUT') {
          expect(options.body).to.be.instanceOf(FormData);
          remote[path] = JSON.parse(await options.body.get('data').text());
        }
        return new Response(JSON.stringify(remote[path]), { status: 200 });
      },
    },
  };
  return {
    manager: new PoiManager(sdk),
    remote,
    calls,
    setHook: (callback) => { hook = callback; },
    writes: () => calls.filter(({ options }) => options.method === 'PUT'),
  };
}

async function failure(action, text) {
  let caught;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  expect(caught?.message).to.include(text);
}

describe('POI Manager source editing', () => {
  it('loads both catalogs, groups case-insensitive codes and never writes on load', async () => {
    const { manager, calls, writes } = setup();
    await manager.load();
    expect(manager.products.map(({ code }) => code)).to.deep.equal(['A', 'B', 'C', 'OLD']);
    expect(manager.products[0].label).to.equal('Alpha');
    expect(manager.changed).to.deep.equal([]);
    expect(manager.drafts).not.to.equal(manager.originals);
    expect(manager.lists).to.have.length(4);
    expect(manager.lists[3].error).to.include('Malformed');
    expect(writes()).to.have.length(0);
    expect(calls.every(({ url, options }) => url.startsWith('https://admin.da.live/source/adobecom/da-marketo/')
      && options.cache === 'no-store')).to.equal(true);
  });

  it('rejects explicit foreign SDK context and accepts omitted context', () => {
    expect(() => setup(undefined, { org: 'other' })).to.throw('only supports');
    expect(() => setup(undefined, { repo: 'other' })).to.throw('only supports');
    expect(() => setup(undefined, { org: undefined, repo: undefined })).not.to.throw();
    expect(() => new PoiManager({})).to.throw('DA sign-in');
  });

  it('blocks malformed values and field types but accepts an empty backend sheet', async () => {
    for (const invalid of [{ Values: 7 }, { Values: 'No code' }, { Values: 'X|bad code' }]) {
      const docs = fixtures();
      docs['poi/values.json'].data = [invalid];
      await failure(() => setup(docs).manager.load(), invalid.Values === 7 ? 'string Values' : 'Malformed');
    }
    const docs = fixtures();
    docs['fields.json'].data[1].Type = 'text';
    await failure(() => setup(docs).manager.load(), 'poi-filter field');
    docs['fields.json'].data[1].Type = 'select';
    docs['poi/values.json'] = worksheet([]);
    const { manager } = setup(docs);
    await manager.load();
    expect(manager.loaded).to.equal(true);
  });

  it('reports authentication, permission and JSON source failures', async () => {
    for (const status of [401, 403]) {
      const context = setup();
      context.setHook(() => new Response('', { status }));
      await failure(() => context.manager.load(), 'DA sign-in and site permissions');
      expect(context.manager.busy).to.equal(false);
    }
    const context = setup();
    context.setHook(() => new Response('not json'));
    await failure(() => context.manager.load(), 'invalid JSON');
    expect(context.manager.loaded).to.equal(false);
  });

  it('appends locally to every product worksheet and preserves metadata and memberships', async () => {
    const { manager, writes } = setup();
    await manager.load();
    const original = copy(manager.originals);
    expect(manager.add(' New product ', ' NEW ')).to.equal('NEW');
    expect(manager.changed).to.deep.equal(SOURCE_PATHS.slice(0, 2));
    for (const path of ['data', 'fr']) {
      const target = manager.drafts['poi/rules.json'][path];
      expect(target.data.at(-1)).to.deep.equal({ Values: 'New product|NEW' });
      expect(target.total).to.equal(target.data.length);
      expect(target.limit).to.equal(target.data.length);
      expect(target.data.slice(0, -1)).to.deep.equal(original['poi/rules.json'][path].data);
    }
    expect(manager.drafts['poi/rules.json'].meta).to.deep.equal(original['poi/rules.json'].meta);
    expect(manager.drafts['poi-filter/rules.json']).to.deep.equal(original['poi-filter/rules.json']);
    expect(manager.originals).to.deep.equal(original);
    expect(writes()).to.have.length(0);
  });

  it('rejects invalid or duplicate additions atomically, including locale-only duplicates', async () => {
    const docs = fixtures();
    docs['poi/rules.json'].fr.data.push({ Values: 'Local only|LOCALE' });
    const { manager } = setup(docs);
    await manager.load();
    for (const [label, code] of [
      ['', 'NEW'], ['A|B', 'NEW'], ['A\nB', 'NEW'], ['X', '_'],
      ['X', 'bad code'], ['X', 'A'], ['X', 'LOCALE'], ['X', ''],
    ]) {
      expect(() => manager.add(label, code)).to.throw();
      expect(manager.changed).to.deep.equal([]);
    }
    manager.drafts['poi/rules.json'].fr.data.push({ Values: 'broken' });
    const before = copy(manager.drafts);
    expect(() => manager.add('New', 'NEW')).to.throw('Malformed');
    expect(manager.drafts).to.deep.equal(before);
  });

  it('renames every matching row while preserving code whitespace, absent locales, and filters', async () => {
    const { manager } = setup();
    await manager.load();
    manager.rename('A', ' Renamed ');
    expect(manager.drafts['poi/values.json'].data.filter((row) => /[|]a$/i.test(row.Values))
      .map((row) => row.Values)).to.deep.equal(['Renamed|A', 'Renamed|A', 'Renamed|a']);
    expect(manager.drafts['poi/rules.json'].data.data.find((row) => row.Values.includes(' A ')))
      .to.deep.equal({ Values: 'Renamed| A ', extra: 'preserve' });
    expect(manager.drafts['poi/rules.json'].fr.data[0].Values).to.equal('Renamed|A');
    const before = copy(manager.drafts);
    manager.rename('A', 'Renamed');
    expect(manager.drafts).to.deep.equal(before);
    manager.rename('B', 'Beta renamed');
    expect(manager.drafts['poi/rules.json'].fr.data).to.have.length(1);
    expect(manager.drafts['poi-filter/rules.json']).to.deep.equal(manager.originals['poi-filter/rules.json']);
    expect(() => manager.rename('OLD', 'Stale')).to.throw('existing backend');
  });

  it('preserves literal membership entries and prefixes, and changes only target labels', async () => {
    const { manager } = setup();
    await manager.load();
    manager.updateMemberships('B', new Set([0, 1]), '9');
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest =  7:A |2:B');
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = 9:B');
    manager.updateMemberships('B', new Set([1]), '4');
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest =  7:A ');
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = 9:B');
    manager.updateMemberships('A', new Set(), '1');
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest = none');
    const filters = manager.drafts['poi-filter/rules.json'];
    const original = manager.originals['poi-filter/rules.json'];
    expect(filters.meta.data[3]).to.deep.equal(original.meta.data[3]);
    expect(filters.meta.data[4]).to.deep.equal(original.meta.data[4]);
    expect(filters.settings).to.deep.equal(original.settings);
    expect(filters.meta.data[0].extra).to.equal('keep');
  });

  it('allows list-only codes to retain, add, remove and restore memberships', async () => {
    const { manager } = setup();
    await manager.load();
    manager.updateMemberships('OLD', new Set([2]), '1');
    expect(manager.changed).to.have.length(0);
    manager.updateMemberships('OLD', new Set([0, 2]), '1');
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest =  7:A |2:B|1:OLD');
    manager.updateMemberships('OLD', new Set(), '1');
    expect(manager.lists[2].label).to.equal('mktoFormsPrimaryProductInterest = none');
    manager.updateMemberships('OLD', new Set([1]), '4');
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = 4:OLD');
    manager.undoMembership('OLD', 2);
    expect(manager.lists[2].label).to.equal(manager.originalLists[2].label);
  });

  it('supports legacy single-sheet filter documents without interpreting locale picklists as lists', async () => {
    const docs = fixtures();
    docs['poi-filter/rules.json'] = docs['poi-filter/rules.json'].meta;
    const { manager } = setup(docs);
    await manager.load();
    manager.updateMemberships('B', new Set([1]), '2');
    expect(manager.drafts['poi-filter/rules.json'].data[1].label)
      .to.equal('mktoFormsPrimaryProductInterest = 2:B');
    expect(manager.lists).to.have.length(4);
  });

  it('undoes a removed membership with its exact prefix and whitespace without discarding other product edits', async () => {
    const { manager } = setup();
    await manager.load();
    manager.updateMemberships('A', new Set([1]), '1');
    manager.updateMemberships('B', new Set([0, 1]), '4');
    manager.undoMembership('A', 0);
    expect(manager.lists[0].label).to.equal(manager.originalLists[0].label);
    expect(manager.memberships('A')).to.deep.equal(new Set([0, 1]));
    expect(manager.memberships('B')).to.deep.equal(new Set([0, 1]));
    manager.undoMembership('A', 1);
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = 4:B');
    expect(() => manager.undoMembership('A', 3)).to.throw('cannot be edited');
  });

  it('produces human-readable net changes without false renames from duplicate backend rows', async () => {
    const { manager } = setup();
    await manager.load();
    manager.validateAddition('New', 'NEW');
    expect(manager.changed).to.have.length(0);
    manager.add('New', 'NEW');
    manager.updateMemberships('NEW', new Set([1]), '1');
    expect(manager.reviewChanges).to.deep.equal([
      'Add New (NEW) to the product catalog.',
      'Update product picklists across affected worksheets, including existing locale entries.',
      'Include New (NEW) in Second.',
    ]);
    manager.rename('A', 'Renamed');
    expect(manager.reviewChanges).to.include('Rename Alpha to Renamed (A).');
  });

  it('disables malformed lists without rewriting them or unrelated workbook properties', async () => {
    const docs = fixtures();
    const invalid = ['0:A', '-1:A', '1:bad code', '1:A|', 'A', '1:A|2:A', ''];
    docs['poi-filter/rules.json'].meta.data = invalid.map((label) => assignment('Invalid', label));
    docs['poi/rules.json'].description = { author: 'Keep metadata' };
    const { manager } = setup(docs);
    await manager.load();
    expect(manager.lists.every((list) => !!list.error)).to.equal(true);
    manager.updateMemberships('A', new Set(), '1');
    expect(manager.changed).to.have.length(0);
    manager.add('New', 'NEW');
    expect(manager.drafts['poi/rules.json'].description).to.deep.equal({ author: 'Keep metadata' });
  });
});

describe('POI Manager shared catalog workspace', () => {
  it('includes picklist-only and program.poi-only codes and searches all case-insensitive aliases', async () => {
    const docs = fixtures();
    docs['poi/rules.json'].fr.data.push({ Values: 'Locale only|LOCALE' });
    docs[CONFIG_PATH]['required-preferences'].data[0].options += ',PROGRAM:Program only (PROGRAM)';
    const { manager, writes } = setup(docs);
    await manager.load();
    expect(manager.products.map(({ code }) => code)).to.deep.equal(['A', 'B', 'C', 'LOCALE', 'OLD', 'PROGRAM']);
    const alpha = manager.products.find((item) => item.code === 'A');
    expect(alpha.designer).to.equal(true);
    expect(alpha.configurator).to.equal(true);
    expect(alpha.labels).to.include.members(['Alpha', 'Duplicate', 'Lower', 'Autre', 'Config alpha', 'Alternate alpha']);
    expect(manager.aliases('a', 'configurator').map((alias) => alias.label))
      .to.deep.equal(['Alternate alpha', 'Config alpha']);
    expect(writes()).to.have.length(0);
  });

  it('adds a configurator-only POI alphabetically with derived columns and no designer edits', async () => {
    const { manager, writes } = setup();
    await manager.load();
    manager.add('Brand new', 'NEW', ['configurator']);
    expect(manager.changed).to.deep.equal([CONFIG_PATH]);
    const document = manager.drafts[CONFIG_PATH];
    expect(document.poi.data.map((row) => row.Name))
      .to.deep.equal(['Alternate alpha', 'Brand new', 'Config alpha', 'Config only']);
    expect(document.poi.data[1]).to.deep.equal(configOption('NEW', 'Brand new'));
    expect(document.poi.total).to.equal(4);
    expect(document.poi.limit).to.equal(4);
    expect(document['required-preferences'].data[0].options)
      .to.equal(':,a:Alternate alpha (a),NEW:Brand new (NEW),A:Config alpha (A),C:Config only (C)');
    expect(() => manager.add('Duplicate', 'new')).to.throw('already exists');
    expect(writes()).to.have.length(0);
  });

  it('enables either catalog independently while preserving its existing labels', async () => {
    const { manager } = setup();
    await manager.load();
    manager.setEnabled('c', 'designer', true, 'Designer name');
    expect(manager.drafts['poi/values.json'].data).to.deep.include({ Values: 'Designer name|c' });
    expect(manager.drafts['poi/rules.json'].fr.data).to.deep.include({ Values: 'Designer name|c' });
    expect(manager.drafts[CONFIG_PATH]).to.deep.equal(manager.originals[CONFIG_PATH]);
    const designer = copy(manager.drafts['poi/values.json']);
    manager.setEnabled('B', 'configurator', true, 'Separate label');
    expect(manager.drafts[CONFIG_PATH].poi.data).to.deep.include(configOption('B', 'Separate label'));
    expect(manager.drafts['poi/values.json']).to.deep.equal(designer);
  });

  it('removes all designer case variants and memberships from all three sources only', async () => {
    const { manager } = setup();
    await manager.load();
    manager.setEnabled('a', 'designer', false);
    expect(manager.drafts['poi/values.json'].data.map((row) => row.Values))
      .to.deep.equal(['Select|_', 'Beta|B']);
    expect(manager.drafts['poi/rules.json'].data.data.map((row) => row.Values))
      .to.deep.equal(['Select|_', 'Beta|B']);
    expect(manager.drafts['poi/rules.json'].fr.data).to.deep.equal([]);
    expect(manager.drafts['poi/rules.json'].fr.total).to.equal(0);
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest = 2:B');
    expect(manager.lists[3].label).to.equal('mktoFormsPrimaryProductInterest = none');
    expect(manager.drafts[CONFIG_PATH]).to.deep.equal(manager.originals[CONFIG_PATH]);
    expect(manager.products.find((item) => item.code.toLowerCase() === 'a').designer).to.equal(false);
    manager.undoMembership('A', 0);
    expect(manager.lists[0].label).to.equal(manager.originalLists[0].label);
    expect(manager.products.find((item) => item.code === 'A').designer).to.equal(false);
  });

  it('removes all configurator aliases from both representations without touching other preferences', async () => {
    const { manager } = setup();
    await manager.load();
    manager.setEnabled('a', 'configurator', false);
    expect(manager.changed).to.deep.equal([CONFIG_PATH]);
    const document = manager.drafts[CONFIG_PATH];
    expect(document.poi.data).to.deep.equal([configOption('C', 'Config only')]);
    expect(document['required-preferences'].data[0].options).to.equal(':,C:Config only (C)');
    expect(document['required-preferences'].data[0].description).to.equal('keep');
    expect(document['required-preferences'].data[1]).to.deep.equal({ prop: 'program.other', options: 'keep' });
    expect(document.metadata).to.deep.equal(manager.originals[CONFIG_PATH].metadata);
  });

  it('renames one configurator alias and updates derived fields without changing the others', async () => {
    const { manager } = setup();
    await manager.load();
    manager.drafts[CONFIG_PATH].poi.data[0].extra = 'preserve';
    manager.renameAlias('a', 'configurator', 'Config alpha', 'Zeta');
    const document = manager.drafts[CONFIG_PATH];
    expect(document.poi.data.map((row) => row.Name)).to.deep.equal(['Alternate alpha', 'Config only', 'Zeta']);
    expect(document.poi.data[2]).to.deep.equal({ ...configOption('A', 'Zeta'), extra: 'preserve' });
    expect(document['required-preferences'].data[0].options)
      .to.equal(':,a:Alternate alpha (a),C:Config only (C),A:Zeta (A)');
    expect(manager.changed).to.deep.equal([CONFIG_PATH]);
    const before = copy(manager.drafts);
    expect(() => manager.renameAlias('a', 'configurator', 'Zeta', 'Bad,label')).to.throw('commas');
    expect(manager.drafts).to.deep.equal(before);
  });

  it('merges configurator duplicates using the chosen label and preserved backend spelling', async () => {
    const { manager } = setup();
    await manager.load();
    expect(manager.hasDuplicates('a', 'configurator')).to.equal(true);
    manager.mergeDuplicates('A', 'configurator', 'Alternate alpha');
    expect(manager.drafts[CONFIG_PATH].poi.data)
      .to.deep.equal([configOption('a', 'Alternate alpha'), configOption('C', 'Config only')]);
    expect(manager.drafts[CONFIG_PATH]['required-preferences'].data[0].options)
      .to.equal(':,a:Alternate alpha (a),C:Config only (C)');
    expect(manager.hasDuplicates('A', 'configurator')).to.equal(false);
    expect(manager.changed).to.deep.equal([CONFIG_PATH]);
  });

  it('merges designer duplicates per worksheet while retaining unique locale labels and prefixes', async () => {
    const { manager } = setup();
    await manager.load();
    manager.mergeDuplicates('a', 'designer', 'Duplicate');
    expect(manager.drafts['poi/values.json'].data.map((row) => row.Values))
      .to.deep.equal(['Select|_', 'Beta|B', 'Duplicate|A']);
    expect(manager.drafts['poi/rules.json'].fr.data[0].Values).to.equal('Autre|A');
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest =  7:A |2:B');
    expect(manager.lists[3].label).to.equal('mktoFormsPrimaryProductInterest = 1:A');
    expect(manager.hasDuplicates('A', 'designer')).to.equal(false);
    expect(manager.drafts[CONFIG_PATH]).to.deep.equal(manager.originals[CONFIG_PATH]);
  });

  it('matches memberships case-insensitively without rewriting their stored codes', async () => {
    const { manager } = setup();
    await manager.load();
    manager.updateMemberships('a', new Set([0, 1]), '4');
    expect(manager.lists[0].label).to.equal(manager.originalLists[0].label);
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = 4:A');
    manager.undoMembership('a', 1);
    expect(manager.changed).to.deep.equal([]);
  });

  it('allows configurator-only codes to join and leave filter lists', async () => {
    const docs = fixtures();
    docs['poi-filter/rules.json'].meta.data.push(assignment('Pending removal', '3:c'));
    const { manager } = setup(docs);
    await manager.load();
    const item = manager.products.find((entry) => entry.code === 'C');
    expect(item.stale).to.equal(true);
    expect(item.configurator).to.equal(true);
    expect(item.designer).to.equal(false);
    manager.updateMemberships('c', new Set([0, 5]), '1');
    expect(manager.memberships('C')).to.deep.equal(new Set([0, 5]));
    manager.updateMemberships('C', new Set(), '1');
    expect(manager.lists.at(-1).label).to.equal('mktoFormsPrimaryProductInterest = none');
    expect(manager.changed).to.deep.equal(['poi-filter/rules.json']);
  });

  it('rejects malformed configurator source before making any edits', async () => {
    const docs = fixtures();
    docs[CONFIG_PATH]['required-preferences'].data[0].prop = 'other';
    const { manager, writes } = setup(docs);
    await failure(() => manager.load(), 'program.poi');
    expect(manager.loaded).to.equal(false);
    expect(writes()).to.have.length(0);
  });

  it('saves and verifies only the configurator draft and detects concurrent sheet changes', async () => {
    const { manager, writes, remote } = setup();
    await manager.load();
    manager.setEnabled('B', 'configurator', true, 'Config beta');
    remote[CONFIG_PATH].metadata.data[0].Title = 'Concurrent change';
    await failure(() => manager.save(), 'source changed');
    expect(writes()).to.have.length(0);
    remote[CONFIG_PATH] = copy(manager.originals[CONFIG_PATH]);
    expect(await manager.save()).to.deep.equal([CONFIG_PATH]);
    expect(writes()).to.have.length(1);
    expect(writes()[0].url).to.equal('https://admin.da.live/source/adobecom/da-marketo/tools/marketo-options.json');
    expect(manager.changed).to.deep.equal([]);
  });
});

describe('POI Manager draft saves', () => {
  it('writes only changed sources sequentially and verifies each before marking clean', async () => {
    const { manager, writes, calls, remote } = setup();
    await manager.load();
    manager.add('New', 'NEW');
    expect(await manager.save()).to.deep.equal(SOURCE_PATHS.slice(0, 2));
    expect(writes().map(({ path }) => path)).to.deep.equal(SOURCE_PATHS.slice(0, 2));
    expect(manager.changed).to.have.length(0);
    expect(manager.drafts['poi/values.json']).to.deep.equal(remote['poi/values.json']);
    const operations = calls.slice(5).map(({ path, options }) => `${options.method || 'GET'} ${path}`);
    expect(operations).to.deep.equal([
      'GET fields.json', 'GET poi/values.json', 'GET poi/rules.json',
      'GET poi/values.json', 'PUT poi/values.json', 'GET poi/values.json',
      'GET poi/rules.json', 'PUT poi/rules.json', 'GET poi/rules.json',
    ]);
  });

  it('detects changed field definitions and changed sources before any write', async () => {
    for (const conflict of ['fields.json', 'poi/rules.json']) {
      const { manager, remote, writes } = setup();
      await manager.load();
      manager.add('New', 'NEW');
      if (conflict === 'fields.json') remote[conflict].data[0].Field = 'Changed definition';
      else remote[conflict].fr.data[0].Values = 'Changed|A';
      await failure(() => manager.save(), 'Reload and review');
      expect(writes()).to.have.length(0);
      expect(manager.changed).to.have.length(2);
    }
  });

  it('checks each source again immediately before writing and records partial success', async () => {
    const context = setup();
    const { manager, remote, writes } = context;
    await manager.load();
    manager.add('New', 'NEW');
    context.setHook((path, options) => {
      if (path === 'poi/values.json' && options.method === 'PUT') {
        remote['poi/rules.json'].fr.data[0].Values = 'Concurrent|A';
      }
    });
    await failure(() => manager.save(), 'Verified saves: poi/values.json');
    expect(writes()).to.have.length(1);
    expect(manager.changed).to.deep.equal(['poi/rules.json']);
    expect(manager.busy).to.equal(false);
  });

  it('requires reload for removed field definitions but permits unrelated catalog changes', async () => {
    const { manager, remote, writes } = setup();
    await manager.load();
    manager.add('New', 'NEW');
    remote['fields.json'].data[0].Type = 'text';
    await failure(() => manager.save(), 'Reload and review');
    expect(writes()).to.have.length(0);
    remote['fields.json'].data[0].Type = 'select';
    remote['fields.json'].data[2].Type = 'textarea';
    await manager.save();
    expect(writes()).to.have.length(2);
  });

  it('retains failed drafts, reports uncertain verification, and requires reload before retry', async () => {
    const context = setup();
    const { manager, writes, remote } = context;
    await manager.load();
    manager.add('New', 'NEW');
    context.setHook((path, options) => {
      if (path === 'poi/rules.json' && options.method === 'PUT') {
        return new Response('', { status: 500 });
      }
      return undefined;
    });
    await failure(() => manager.save(), 'may already have been saved. Reload before retrying');
    expect(manager.changed).to.deep.equal(['poi/rules.json']);
    expect(manager.originals['poi/values.json']).to.deep.equal(remote['poi/values.json']);
    expect(writes()).to.have.length(2);
    expect(manager.reloadRequired).to.equal(true);
    await failure(() => manager.save(), 'Editing unavailable');
    context.setHook(undefined);
    await manager.load();
    expect(manager.changed).to.have.length(0);
    expect(manager.reloadRequired).to.equal(false);
  });

  it('does not mark a successful PUT clean when readback differs or fails', async () => {
    for (const mode of ['different', 'failure']) {
      const context = setup();
      const { manager, calls } = context;
      await manager.load();
      manager.updateMemberships('B', new Set([1]), '1');
      context.setHook((path, options) => {
        const written = calls.some((call) => call.options.method === 'PUT');
        if (path === 'poi-filter/rules.json' && written && options.method !== 'PUT') {
          return mode === 'failure' ? new Response('', { status: 503 })
            : new Response(JSON.stringify(fixtures()[path]));
        }
        return undefined;
      });
      await failure(() => manager.save(), 'may already have been saved');
      expect(manager.changed).to.have.length(1);
      expect(manager.reloadRequired).to.equal(true);
    }
  });

  it('locks editing and competing operations while a save is in progress', async () => {
    const context = setup();
    await context.manager.load();
    context.manager.add('New', 'NEW');
    let release;
    context.setHook(async (path) => {
      if (path === 'fields.json') await new Promise((resolve) => { release = resolve; });
    });
    const saving = context.manager.save();
    expect(() => context.manager.add('Other', 'OTHER')).to.throw('Editing unavailable');
    await failure(() => context.manager.load(), 'already running');
    release();
    await saving;
  });
});

describe('POI Manager backend code updates', () => {
  it('updates both catalogs and every filter reference without changing labels or source originals', async () => {
    const docs = backendFixtures();
    const { manager, writes } = setup(docs);
    await manager.load();
    manager.renameCode('ADOBECXENTWORKER', 'ADOBECXENTCOWORKER');
    expect(manager.drafts['poi/values.json'].data.map((row) => row.Values))
      .to.deep.equal(['Select|_', 'Enterprise coworker|ADOBECXENTCOWORKER', 'Beta|B']);
    expect(manager.drafts['poi/rules.json'].data.data[0].Values)
      .to.equal('English label| ADOBECXENTCOWORKER ');
    expect(manager.drafts['poi/rules.json'].fr.data[0].Values)
      .to.equal('French label|ADOBECXENTCOWORKER');
    expect(manager.drafts['poi/rules.json'].settings).to.deep.equal(docs['poi/rules.json'].settings);
    expect(manager.drafts[CONFIG_PATH].poi.data.find((row) => row.Name === 'Config label'))
      .to.deep.equal(configOption('ADOBECXENTCOWORKER', 'Config label'));
    expect(manager.drafts[CONFIG_PATH]['required-preferences'].data[0].options)
      .to.include('ADOBECXENTCOWORKER:Config label (ADOBECXENTCOWORKER)');
    expect(manager.drafts[CONFIG_PATH].metadata).to.deep.equal(docs[CONFIG_PATH].metadata);
    expect(manager.lists.map((list) => list.label)).to.deep.equal([
      'mktoFormsPrimaryProductInterest =  7:ADOBECXENTCOWORKER |2:B',
      'mktoFormsPrimaryProductInterest = none',
      'mktoFormsPrimaryProductInterest = 1:ADOBECXENTCOWORKER|2:ADOBECXENTCOWORKER',
    ]);
    expect(manager.drafts['poi-filter/rules.json'].meta.data[3].label).to.equal('ADOBECXENTWORKER');
    expect(manager.products.some((item) => item.code.toLowerCase() === 'adobecxentworker')).to.equal(false);
    expect(manager.products.find((item) => item.code === 'ADOBECXENTCOWORKER').isNew).to.equal(false);
    expect(manager.reviewChanges).to.include('Change backend code ADOBECXENTWORKER to ADOBECXENTCOWORKER.');
    expect(manager.reviewChanges.some((text) => /^(Add|Remove|Include) /.test(text))).to.equal(false);
    expect(manager.originals)
      .to.deep.equal(Object.fromEntries(SOURCE_PATHS.map((path) => [path, docs[path]])));
    expect(writes()).to.have.length(0);
  });

  it('keeps membership undo and chained renames tied to the same original POI', async () => {
    const { manager } = setup(backendFixtures());
    await manager.load();
    manager.updateMemberships('ADOBECXENTWORKER', new Set([0, 1]), '4');
    manager.renameCode('ADOBECXENTWORKER', 'INTERMEDIATE');
    manager.renameCode('INTERMEDIATE', 'ADOBECXENTCOWORKER');
    expect(manager.memberships('ADOBECXENTCOWORKER')).to.deep.equal(new Set([0, 1]));
    manager.updateMemberships('ADOBECXENTCOWORKER', new Set([1]), '1');
    manager.undoMembership('ADOBECXENTCOWORKER', 0);
    expect(manager.lists[0].label).to.equal('mktoFormsPrimaryProductInterest =  7:ADOBECXENTCOWORKER |2:B');
    manager.undoMembership('ADOBECXENTCOWORKER', 1);
    expect(manager.lists[1].label).to.equal('mktoFormsPrimaryProductInterest = none');
    expect(manager.reviewChanges.filter((text) => text.startsWith('Change backend code')))
      .to.deep.equal(['Change backend code ADOBECXENTWORKER to ADOBECXENTCOWORKER.']);
  });

  it('rejects invalid codes and collisions without modifying drafts, but permits case-only corrections', async () => {
    const { manager } = setup(backendFixtures());
    await manager.load();
    const before = copy(manager.drafts);
    ['', 'bad code', '_', 'B'].forEach((code) => {
      expect(() => manager.renameCode('ADOBECXENTWORKER', code)).to.throw();
      expect(manager.drafts).to.deep.equal(before);
      expect(manager.codeRenames.size).to.equal(0);
    });
    manager.renameCode('ADOBECXENTWORKER', 'adobecxentworker');
    expect(manager.aliases('adobecxentworker', 'designer')
      .every((alias) => [...alias.codes].every((code) => code === 'adobecxentworker'))).to.equal(true);
    expect(manager.aliases('adobecxentworker', 'configurator')[0].codes)
      .to.deep.equal(new Set(['adobecxentworker']));
  });

  it('reviews a renamed unsaved POI as an addition rather than renaming a saved code', async () => {
    const { manager } = setup();
    await manager.load();
    manager.add('New', 'NEW', ['designer', 'configurator']);
    manager.renameCode('NEW', 'UPDATED');
    expect(manager.reviewChanges).to.include('Add New (UPDATED) to the product catalog.');
    expect(manager.reviewChanges.some((text) => text.startsWith('Change backend code'))).to.equal(false);
    expect(manager.products.find((item) => item.code === 'UPDATED').isNew).to.equal(true);
  });
});

describe('POI Manager browser controls', () => {
  let root;
  let app;
  let context;
  let storedPoi;
  const activePoiKey = 'poi-manager:active-poi';
  const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });
  const get = (selector) => root.querySelector(selector);
  const waitForStatus = (text) => new Promise((resolve, reject) => {
    let timer;
    const observer = new MutationObserver(() => {
      if (get('.status').textContent.includes(text)) {
        clearTimeout(timer);
        observer.disconnect();
        resolve();
      }
    });
    timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Status did not include ${text}: ${get('.status').textContent}`));
    }, 1500);
    observer.observe(get('.status'), { childList: true });
  });
  const typeProduct = (value) => {
    get('.product').value = value;
    get('.product').dispatchEvent(new Event('input'));
  };
  const select = (code) => {
    typeProduct(code);
    get(`.product-options [data-code="${code}"]`).click();
  };
  const key = (value) => get('.product')
    .dispatchEvent(new KeyboardEvent('keydown', { key: value, cancelable: true }));
  const submitDetails = (label = 'New', code = 'NEW') => {
    get('.add').elements.label.value = label;
    get('.add').elements.code.value = code;
    get('.add').dispatchEvent(new Event('submit', { cancelable: true }));
  };
  const toggle = (index, scope = '.memberships') => get(`${scope} .lists input[data-index="${index}"]`).click();
  const editLabel = (label, value, catalog = 'designer') => {
    if (!get('.label-update').open) get('.open-label-update').click();
    const input = get(`.label-update [data-catalog="${catalog}"] [data-label="${label}"] input`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    return input;
  };
  const selectBackendFixture = async () => {
    app.destroy();
    context = setup(backendFixtures());
    app = mountManager(root, context.manager);
    await app.load();
    select('ADOBECXENTWORKER');
  };

  beforeEach(async () => {
    storedPoi = window.sessionStorage.getItem(activePoiKey);
    window.sessionStorage.removeItem(activePoiKey);
    root = document.createElement('main');
    document.body.append(root);
    context = setup();
    app = mountManager(root, context.manager);
    await app.load();
  });

  afterEach(() => {
    app.destroy();
    root.remove();
    if (storedPoi === null) window.sessionStorage.removeItem(activePoiKey);
    else window.sessionStorage.setItem(activePoiKey, storedPoi);
  });

  it('restores the active POI after remounting and reloading source data', async () => {
    select('B');
    app.destroy();
    app = mountManager(root, context.manager);
    await app.load();
    expect(get('.product').value).to.equal('Beta');
    expect(get('.product-code').textContent).to.equal('B');
    expect(get('.workspace').hidden).to.equal(false);
    await app.load();
    expect(get('.product').value).to.equal('Beta');
    expect(context.manager.changed).to.deep.equal([]);
  });

  it('remembers explicit selections, not search queries, and forgets them when cleared', async () => {
    select('A');
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal('A');
    typeProduct('Beta');
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal('A');
    select('B');
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal('B');
    get('.path-clear-btn').click();
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal(null);
    await app.load();
    expect(get('.workspace').hidden).to.equal(true);
    expect(get('.product').value).to.equal('');
  });

  it('matches stored codes case-insensitively and discards codes absent from loaded sources', async () => {
    window.sessionStorage.setItem(activePoiKey, 'old');
    await app.load();
    expect(get('.product-code').textContent).to.equal('OLD');
    expect(get('.product-code').hidden).to.equal(false);
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal('OLD');
    window.sessionStorage.setItem(activePoiKey, 'MISSING');
    await app.load();
    expect(get('.workspace').hidden).to.equal(true);
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal(null);
  });

  it('keeps selection, clearing and loading usable when session storage is blocked', async () => {
    const { getItem, setItem, removeItem } = Storage.prototype;
    try {
      const blockedStorage = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
      Storage.prototype.getItem = blockedStorage;
      Storage.prototype.setItem = blockedStorage;
      Storage.prototype.removeItem = blockedStorage;
      select('B');
      expect(get('.product-code').textContent).to.equal('B');
      get('.path-clear-btn').click();
      expect(get('.workspace').hidden).to.equal(true);
      await app.load();
      expect(get('.error').hidden).to.equal(true);
      select('A');
      expect(get('.product-code').textContent).to.equal('A');
    } finally {
      Storage.prototype.getItem = getItem;
      Storage.prototype.setItem = setItem;
      Storage.prototype.removeItem = removeItem;
    }
  });

  it('cancels the backend code modal without changing any source drafts', async () => {
    await selectBackendFixture();
    get('.open-code-update').click();
    expect(get('.code-update').open).to.equal(true);
    const form = get('.code-update form');
    expect(get('.code-update .current-code').textContent).to.equal('ADOBECXENTWORKER');
    expect(form.elements.namedItem('current')).to.equal(null);
    const unchanged = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unchanged);
    expect(unchanged.defaultPrevented).to.equal(false);
    form.elements.code.value = 'ADOBECXENTCOWORKER';
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).to.equal(true);
    get('.cancel-code-update').click();
    expect(get('.code-update').open).to.equal(false);
    expect(context.manager.changed).to.deep.equal([]);
    expect(get('.product-code').textContent).to.equal('ADOBECXENTWORKER');
    expect(context.writes()).to.have.length(0);
  });

  it('updates both catalog codes locally, keeps other edits, and saves only through review', async () => {
    await selectBackendFixture();
    editLabel('Enterprise coworker', 'New display label');
    get('.apply-label-update').click();
    toggle(1);
    get('.open-code-update').click();
    const form = get('.code-update form');
    form.elements.code.value = '';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(form.querySelector('.form-error').textContent).to.include('valid');
    expect(form.elements.code.getAttribute('aria-invalid')).to.equal('true');
    expect(get('.code-update').open).to.equal(true);
    form.elements.code.value = 'B';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(form.querySelector('.form-error').textContent).to.include('already exists');
    form.elements.code.value = 'ADOBECXENTCOWORKER';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(get('.code-update').open).to.equal(false);
    expect(get('.product-code').textContent).to.equal('ADOBECXENTCOWORKER');
    expect(window.sessionStorage.getItem(activePoiKey)).to.equal('ADOBECXENTCOWORKER');
    expect([...root.querySelectorAll('.catalog-code code')]
      .every((code) => code.textContent === 'ADOBECXENTCOWORKER')).to.equal(true);
    expect(context.manager.memberships('ADOBECXENTCOWORKER')).to.deep.equal(new Set([0, 1]));
    expect(get('[data-label="New display label"] .catalog-label').textContent).to.equal('New display label');
    expect(get('.product-state').hidden).to.equal(true);
    expect(context.writes()).to.have.length(0);
    get('.review').click();
    expect(get('.change-summary').textContent)
      .to.include('Change backend code ADOBECXENTWORKER to ADOBECXENTCOWORKER.');
    expect(get('.diffs').textContent).to.include('ADOBECXENTWORKER');
    get('.review-dialog button[value="cancel"]').click();
    await tick();
    expect(context.writes()).to.have.length(0);
    get('.review').click();
    const saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(4);
    expect(context.manager.codeRenames.size).to.equal(0);
    expect(get('.review').disabled).to.equal(true);
    await app.load();
    expect(get('.product-code').textContent).to.equal('ADOBECXENTCOWORKER');
  });

  it('keeps sources collapsed, with friendly links to source workbooks', () => {
    expect(get('.sources').open).to.equal(false);
    expect(get('.source-status').textContent).to.equal('Sources loaded · 0 drafts changed');
    expect(get('.status').hidden).to.equal(true);
    expect(root.querySelectorAll('.sources tbody tr')).to.have.length(5);
    expect(get('.sources tbody a').textContent).to.equal('Field catalog');
    expect(get('.sources tbody a').href).to.include('/adobecom/da-marketo/marketodesigner/fields.json');
    const productLink = get('.sources tbody tr:nth-child(2) a');
    expect(productLink.textContent).to.equal('Product catalog');
    expect(productLink.href).to.equal('https://da.live/sheet#/adobecom/da-marketo/marketodesigner/poi/values.json');
    expect(get('.sources tbody tr:last-child a').href)
      .to.equal('https://da.live/sheet#/adobecom/da-marketo/tools/marketo-options.json');
  });

  it('finds aliases, shows every label, and manages both catalogs in one workspace', () => {
    typeProduct('Alternate alpha');
    expect(root.querySelectorAll('[role="option"]')).to.have.length(1);
    get('[role="option"]').click();
    expect(get('.product-code').textContent).to.equal('A');
    expect(get('.product-code').hidden).to.equal(true);
    expect(root.querySelectorAll('[data-catalog="designer"] .alias-summary')).to.have.length(4);
    const designer = '[data-catalog="designer"]';
    expect(get(`${designer} [data-label="Alpha"] .catalog-code code`).textContent).to.equal('A');
    expect(get(`${designer} [data-label="Lower"] .catalog-code code`).textContent).to.equal('a');
    expect(root.querySelectorAll('[data-catalog="configurator"] .alias-summary')).to.have.length(2);
    const config = '[data-catalog="configurator"]';
    expect(get(`${config} [data-label="Config alpha"] .catalog-code code`).textContent).to.equal('A');
    expect(get(`${config} [data-label="Alternate alpha"] .catalog-code code`).textContent).to.equal('a');
    get('.open-label-update').click();
    get(`.label-update ${config} .merge-duplicates`).click();
    get('.apply-label-update').click();
    expect(context.manager.hasDuplicates('a', 'configurator')).to.equal(false);
    expect(root.querySelectorAll(`${config} .alias-summary`)).to.have.length(1);
    get(`${config} .catalog-enabled`).click();
    expect(context.manager.aliases('A', 'configurator')).to.deep.equal([]);
    expect(document.activeElement).to.equal(get(`${config} .catalog-enabled`));
    expect(get('[data-catalog="designer"] .catalog-enabled').checked).to.equal(true);
    get(`${config} .enable-label`).value = 'New configurator label';
    get(`${config} .catalog-enabled`).click();
    expect(context.manager.aliases('a', 'configurator').map((alias) => alias.label))
      .to.deep.equal(['New configurator label']);
    expect(context.writes()).to.have.length(0);
  });

  it('shows distinct code spellings beside each catalog label and preserves them on label edits', async () => {
    context.remote['poi/rules.json'].fr.data.push({ Values: 'Alpha|a' });
    context.remote[CONFIG_PATH]['required-preferences'].data[0].options = ':,a:Config alpha (a),C:Config only (C)';
    await app.load();
    select('A');
    const designer = get('[data-catalog="designer"] [data-label="Alpha"]');
    expect(designer.querySelector('.catalog-code code').textContent).to.equal('A, a');
    expect(designer.firstElementChild).to.equal(designer.querySelector('.catalog-code'));
    const code = '[data-catalog="configurator"] [data-label="Config alpha"] .catalog-code code';
    expect(get('.product-code').textContent).to.equal('A');
    expect(get(code).textContent).to.equal('A, a');
    expect(context.manager.changed).to.deep.equal([]);
    editLabel('Config alpha', 'Renamed config', 'configurator');
    get('.apply-label-update').click();
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('[data-label="Renamed config"] .catalog-code code').textContent).to.equal('A, a');
    expect(context.manager.drafts[CONFIG_PATH].poi.data.find((row) => row.Name === 'Renamed config').Key)
      .to.equal('A');
    expect(context.manager.drafts[CONFIG_PATH]['required-preferences'].data[0].options)
      .to.include('a:Renamed config (a)');
    expect(context.writes()).to.have.length(0);
  });

  it('creates a configurator-only POI with optional list memberships and no designer rows', () => {
    get('.open-add').click();
    get('.add').elements.designer.checked = false;
    get('.add').elements.configurator.checked = true;
    submitDetails('Config first', 'FUTURE');
    expect(get('.creation-assignment .select-all').disabled).to.equal(false);
    expect(root.querySelectorAll('.creation-assignment .lists input:not(:disabled)')).to.have.length(3);
    toggle(1, '.creation-assignment');
    get('.finish-add').click();
    expect(context.manager.changed).to.deep.equal(['poi-filter/rules.json', CONFIG_PATH]);
    expect(context.manager.memberships('FUTURE')).to.deep.equal(new Set([1]));
    expect(context.manager.drafts['poi/values.json']).to.deep.equal(context.manager.originals['poi/values.json']);
    expect(context.manager.drafts['poi/rules.json']).to.deep.equal(context.manager.originals['poi/rules.json']);
    expect(get('[data-catalog="designer"] .catalog-enabled').checked).to.equal(false);
    expect(get('[data-catalog="configurator"] .catalog-enabled').checked).to.equal(true);
    expect(get('.product-state').hidden).to.equal(false);
    expect(get('.change-summary').textContent).to.include('Configurator FUTURE');
    expect(context.writes()).to.have.length(0);
  });

  it('keeps both catalogs disabled after their removals have been saved', async () => {
    select('A');
    get('[data-catalog="designer"] .catalog-enabled').click();
    expect(get('.memberships .undo').disabled).to.equal(false);
    get('[data-catalog="configurator"] .catalog-enabled').click();
    get('.review').click();
    const saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(get('[data-catalog="designer"] .catalog-enabled').checked).to.equal(false);
    expect(get('[data-catalog="configurator"] .catalog-enabled').checked).to.equal(false);
    expect(context.manager.products.some((item) => item.code.toLowerCase() === 'a')).to.equal(false);
  });

  it('filters names and codes, supports keyboard selection and Escape, and requires explicit Add', () => {
    typeProduct('bEtA');
    expect(root.querySelectorAll('[role="option"]')).to.have.length(1);
    expect(get('[role="option"]').textContent).to.include('BetaB');
    key('ArrowDown');
    expect(get('.product').getAttribute('aria-activedescendant')).to.equal(get('[role="option"]').id);
    key('Enter');
    expect(get('.product-title').textContent).to.equal('Beta');
    expect(get('.product-code').textContent).to.equal('B');
    expect(get('.product').getAttribute('aria-expanded')).to.equal('false');
    typeProduct('');
    key('ArrowUp');
    expect(get('[aria-selected="true"]').dataset.code).to.equal('OLD');
    key('Escape');
    expect(get('.product').hasAttribute('aria-activedescendant')).to.equal(false);
    typeProduct('not a real product');
    expect(get('.no-products').hidden).to.equal(false);
    key('Enter');
    expect(get('.creation').open).to.equal(false);
    expect(context.manager.changed).to.have.length(0);
    get('.add-from-search').click();
    expect(get('.creation').open).to.equal(true);
    get('.cancel-add').click();
  });

  it('clears the POI query and workspace, restores all results and focus, and preserves drafts', () => {
    const clear = get('.path-clear-btn');
    expect(clear.hidden).to.equal(true);
    select('A');
    expect(clear.hidden).to.equal(false);
    toggle(1);
    const drafts = copy(context.manager.drafts);
    typeProduct('Beta');
    key('ArrowDown');
    expect(get('.product').hasAttribute('aria-activedescendant')).to.equal(true);
    clear.click();
    expect(get('.product').value).to.equal('');
    expect(document.activeElement).to.equal(get('.product'));
    expect(get('.product').getAttribute('aria-expanded')).to.equal('true');
    expect(get('.product').hasAttribute('aria-activedescendant')).to.equal(false);
    expect(root.querySelectorAll('[role="option"]')).to.have.length(context.manager.products.length);
    expect(clear.hidden).to.equal(true);
    expect(get('.workspace').hidden).to.equal(true);
    expect(get('.empty-state').hidden).to.equal(false);
    expect(context.manager.drafts).to.deep.equal(drafts);
    expect(get('.draft-bar').classList.contains('has-changes')).to.equal(true);
    select('A');
    expect(get('.workspace').hidden).to.equal(false);
    expect(context.manager.memberships('A')).to.deep.equal(new Set([0, 1]));
    typeProduct('');
    expect(clear.hidden).to.equal(false);
    clear.click();
    expect(get('.workspace').hidden).to.equal(true);
    expect(clear.hidden).to.equal(true);
    typeProduct('not a real product');
    clear.click();
    expect(get('.no-products').hidden).to.equal(true);
    expect(context.writes()).to.have.length(0);
  });

  it('shows every list and immediately drafts select-all and clear actions without writes', () => {
    select('A');
    expect(root.querySelectorAll('input[type="search"]')).to.have.length(0);
    expect(root.querySelectorAll('.memberships .list')).to.have.length(4);
    get('.select-all').click();
    expect(get('.counts').textContent).to.equal('3 of 4 lists selected');
    expect(context.manager.memberships('A')).to.deep.equal(new Set([0, 1, 2]));
    get('.clear').click();
    expect(context.manager.memberships('A').size).to.equal(0);
    expect(get('.counts').textContent).to.equal('0 of 4 lists selected');
    expect(root.querySelectorAll('.lists input:disabled')).to.have.length(1);
    expect(context.writes()).to.have.length(0);
  });

  it('shows current membership prefixes and refreshes them after edits, undo, and product changes', () => {
    const prefix = (index) => get(`.memberships input[data-index="${index}"]`)
      .closest('.list').querySelector('.membership-prefix')?.textContent;
    select('A');
    expect(prefix(0)).to.equal('Prefix: 7');
    expect(prefix(1)).to.equal(undefined);
    get('.product-info .prefix').value = '12';
    toggle(1);
    expect(prefix(0)).to.equal('Prefix: 7');
    expect(prefix(1)).to.equal('Prefix: 12');
    toggle(0);
    expect(prefix(0)).to.equal(undefined);
    get('.memberships .undo').click();
    expect(prefix(0)).to.equal('Prefix: 7');
    select('B');
    expect(prefix(0)).to.equal('Prefix: 2');
    expect(prefix(1)).to.equal(undefined);
    expect(context.writes()).to.have.length(0);
  });

  it('matches membership prefixes case-insensitively', async () => {
    await selectBackendFixture();
    expect(get('.memberships .membership-prefix').textContent).to.equal('Prefix: 7');
  });

  it('shows each product entry prefix in list details and refreshes it with draft changes', () => {
    const entries = (index) => [...get(`.memberships details[data-index="${index}"]`)
      .querySelectorAll('.list-products li')]
      .filter((row) => row.querySelector('code'))
      .map((row) => [row.querySelector('code').textContent, row.querySelector('.entry-prefix').textContent]);
    select('A');
    expect(entries(0)).to.deep.equal([['A', 'Prefix: 7'], ['B', 'Prefix: 2']]);
    expect(entries(1)).to.deep.equal([]);
    expect(entries(2)).to.deep.equal([['OLD', 'Prefix: 3']]);
    expect(entries(3)).to.deep.equal([['A', 'Prefix: 1']]);
    get('.product-info .prefix').value = '12';
    toggle(1);
    expect(entries(1)).to.deep.equal([['A', 'Prefix: 12']]);
    toggle(0);
    expect(entries(0)).to.deep.equal([['B', 'Prefix: 2']]);
    get('.memberships .undo').click();
    expect(entries(0)).to.deep.equal([['A', 'Prefix: 7'], ['B', 'Prefix: 2']]);
    expect(context.writes()).to.have.length(0);
  });

  it('keeps summaries right-aligned on expansion, shows full-width contents, and wraps narrow rows', async () => {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/tools/poi-manager/poi-manager.css';
    try {
      await new Promise((resolve, reject) => {
        stylesheet.onload = resolve;
        stylesheet.onerror = reject;
        document.head.append(stylesheet);
      });
      select('A');
      const card = get('.memberships .list');
      card.style.width = '700px';
      const heading = card.querySelector('.list-heading').getBoundingClientRect();
      const details = card.querySelector('details');
      const summary = details.querySelector('summary');
      const disclosure = summary.getBoundingClientRect();
      expect(disclosure.left).to.be.at.least(heading.right);
      expect(disclosure.top).to.be.lessThan(heading.bottom);
      summary.click();
      expect(details.open).to.equal(true);
      const expanded = summary.getBoundingClientRect();
      expect(expanded.right).to.be.closeTo(disclosure.right, 1);
      expect(expanded.top).to.be.closeTo(disclosure.top, 1);
      expect(details.querySelector('.list-products').getBoundingClientRect().width)
        .to.be.greaterThan(600);
      expect(details.querySelector('.list-products').getClientRects().length).to.be.greaterThan(0);
      summary.click();
      card.style.width = '280px';
      expect(card.scrollWidth).to.be.at.most(card.clientWidth);
      summary.click();
      toggle(1);
      expect(get('.memberships .list > details').open).to.equal(true);
      expect(context.writes()).to.have.length(0);
    } finally {
      stylesheet.remove();
    }
  });

  it('shows pending membership additions and removals and offers exact per-row undo', () => {
    select('A');
    toggle(0);
    expect(get('.memberships .badge.removed').textContent).to.equal('Removed');
    expect(context.manager.memberships('A').size).to.equal(0);
    get('.memberships .undo').click();
    expect(context.manager.changed).to.have.length(0);
    expect(context.manager.lists[0].label).to.equal(context.manager.originalLists[0].label);
    toggle(1);
    expect(get('.memberships .badge.added').textContent).to.equal('Added');
    get('.memberships .undo').click();
    expect(context.manager.changed).to.have.length(0);
  });

  it('shows enabled-sheet badges in the picker and updates them after catalog changes', () => {
    const badges = (code) => [...get(`.product-options [data-code="${code}"]`).querySelectorAll('.badge')]
      .map((badge) => badge.textContent);
    typeProduct('');
    expect(badges('A')).to.deep.equal(['Configurator', 'Dropdown', 'Duplicates']);
    expect(badges('B')).to.deep.equal(['Dropdown']);
    expect(badges('C')).to.deep.equal(['Configurator']);
    expect(badges('OLD')).to.deep.equal([]);
    select('A');
    get('[data-catalog="designer"] .catalog-enabled').click();
    typeProduct('');
    expect(badges('A')).to.deep.equal(['Configurator', 'Duplicates']);
    get('[data-catalog="configurator"] .catalog-enabled').click();
    typeProduct('');
    expect(badges('A')).to.deep.equal([]);
  });

  it('keeps the duplicates badge until duplicates in both catalogs have been merged', () => {
    const duplicates = () => get('.product-options [data-code="A"] .duplicates');
    const catalogDuplicates = (catalog) => get(`.catalog-labels [data-catalog="${catalog}"] legend .duplicates`);
    typeProduct('');
    expect(duplicates()).not.to.equal(null);
    select('A');
    expect(catalogDuplicates('designer').textContent).to.equal('Duplicates');
    expect(catalogDuplicates('configurator').textContent).to.equal('Duplicates');
    get('.open-label-update').click();
    get('.label-update [data-catalog="designer"] .merge-duplicates').click();
    get('.apply-label-update').click();
    expect(catalogDuplicates('designer')).to.equal(null);
    expect(catalogDuplicates('configurator')).not.to.equal(null);
    typeProduct('');
    expect(duplicates()).not.to.equal(null);
    get('.open-label-update').click();
    get('.label-update [data-catalog="configurator"] .merge-duplicates').click();
    get('.apply-label-update').click();
    expect(catalogDuplicates('configurator')).to.equal(null);
    typeProduct('');
    expect(duplicates()).to.equal(null);
    expect(get('.product-options [data-code="A"] .configurator')).not.to.equal(null);
    expect(get('.product-options [data-code="A"] .dropdown')).not.to.equal(null);
  });

  it('updates catalog duplicate warnings when switching products', () => {
    select('A');
    expect(root.querySelectorAll('.catalog-labels legend .duplicates')).to.have.length(2);
    select('B');
    expect(root.querySelectorAll('.catalog-labels legend .duplicates')).to.have.length(0);
    select('A');
    expect(root.querySelectorAll('.catalog-labels legend .duplicates')).to.have.length(2);
  });

  it('allows list-only POIs to join other lists and undo after removing the last membership', () => {
    select('OLD');
    expect(root.textContent).not.to.include('Removal only');
    expect(get('.memberships input[data-index="0"]').disabled).to.equal(false);
    toggle(0);
    expect(context.manager.memberships('OLD')).to.deep.equal(new Set([0, 2]));
    get('.memberships .undo').click();
    expect(context.manager.changed).to.have.length(0);
    toggle(2);
    expect(context.manager.memberships('OLD').size).to.equal(0);
    get('.memberships .undo').click();
    expect(context.manager.memberships('OLD')).to.deep.equal(new Set([2]));
    expect(context.manager.changed).to.have.length(0);
    select('C');
    expect(get('.memberships .select-all').disabled).to.equal(false);
    toggle(1);
    expect(context.manager.memberships('C')).to.deep.equal(new Set([1]));
  });

  it('keeps the header Add POI action disabled while reloading sources', async () => {
    const loading = app.load();
    expect(get('.open-add').disabled).to.equal(true);
    get('.open-add').click();
    expect(get('.creation').open).to.equal(false);
    await loading;
    expect(get('.open-add').disabled).to.equal(false);
    get('.open-add').click();
    expect(get('.creation').open).to.equal(true);
    get('.cancel-add').click();
  });

  it('creates a POI and assigns lists in one flow, with no draft mutation until the final review step', () => {
    get('.open-add').click();
    submitDetails();
    expect(get('.add').hidden).to.equal(true);
    expect(get('.creation-assignment').hidden).to.equal(false);
    expect(get('.creation-assignment .advanced .prefix').getClientRects().length).to.be.greaterThan(0);
    expect(context.manager.changed).to.have.length(0);
    expect(root.querySelectorAll('.creation-assignment .list')).to.have.length(4);
    get('.creation-assignment .select-all').click();
    expect(get('.creation-assignment .counts').textContent).to.equal('3 of 4 lists selected');
    get('.creation-assignment .clear').click();
    toggle(1, '.creation-assignment');
    expect(context.manager.changed).to.have.length(0);
    get('.finish-add').click();
    expect(get('.creation').open).to.equal(false);
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.product-code').textContent).to.equal('NEW');
    expect(get('.add').elements.label.value).to.equal('');
    expect(context.manager.memberships('NEW')).to.deep.equal(new Set([1]));
    expect(get('.draft-count').textContent).to.include('3 of 4 drafts changed');
    expect(get('.change-summary').textContent).to.include('Include New (NEW) in Second');
    expect(context.writes()).to.have.length(0);
  });

  it('supports back and cancel in creation without changing existing drafts', () => {
    select('A');
    toggle(1);
    const before = copy(context.manager.drafts);
    get('.open-add').click();
    submitDetails();
    toggle(0, '.creation-assignment');
    get('.back-add').click();
    expect(get('.add').elements.label.value).to.equal('New');
    submitDetails('New label', 'OTHER');
    expect(get('.new-product-title').textContent).to.equal('New label (OTHER)');
    get('.cancel-add').click();
    expect(context.manager.drafts).to.deep.equal(before);
  });

  it('shows inline creation errors and rolls back an invalid combined add-and-assign', () => {
    get('.open-add').click();
    submitDetails('Duplicate', 'A');
    expect(get('.add .form-error').textContent).to.include('already exists');
    expect(get('.add').elements.code.getAttribute('aria-invalid')).to.equal('true');
    expect(context.manager.changed).to.have.length(0);
    submitDetails('Bad|label', 'NEW');
    expect(get('.add .form-error').textContent).to.include('display label');
    submitDetails();
    get('.creation-assignment .prefix').value = '0';
    toggle(1, '.creation-assignment');
    get('.finish-add').click();
    expect(get('.creation-assignment .form-error').textContent).to.include('positive integer');
    expect(context.manager.changed).to.have.length(0);
    expect(get('.creation').open).to.equal(true);
  });

  it('cancels label edits and staged duplicate merges without changing source drafts', () => {
    select('A');
    editLabel('Alpha', 'Cancelled label');
    const section = get('.label-update [data-catalog="designer"]');
    const merge = section.querySelector('[data-label="Alpha"] .merge-duplicates');
    merge.click();
    expect(section.dataset.keep).to.equal('Alpha');
    expect(section.querySelector('[data-label="Duplicate"]').hidden).to.equal(true);
    expect(context.manager.hasDuplicates('A', 'designer')).to.equal(true);
    expect(context.manager.changed).to.deep.equal([]);
    const warning = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(warning);
    expect(warning.defaultPrevented).to.equal(true);
    get('.cancel-label-update').click();
    expect(get('.label-update').open).to.equal(false);
    expect(context.manager.changed).to.deep.equal([]);
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).to.equal(false);
    get('.open-label-update').click();
    expect(get('.label-update [data-label="Alpha"] input').value).to.equal('Alpha');
    expect(get('.label-update [data-keep]')).to.equal(null);
    expect(context.writes()).to.have.length(0);
  });

  it('stages and undoes duplicate merges, then applies kept labels in both catalogs together', () => {
    select('A');
    editLabel('Duplicate', '');
    editLabel('Alpha', 'Merged designer');
    const designer = get('.label-update [data-catalog="designer"]');
    const merge = designer.querySelector('[data-label="Alpha"] .merge-duplicates');
    merge.click();
    expect(merge.textContent).to.equal('Undo merge');
    expect(designer.querySelector('[data-label="Duplicate"] input').disabled).to.equal(true);
    merge.click();
    expect(designer.hasAttribute('data-keep')).to.equal(false);
    expect(designer.querySelector('[data-label="Duplicate"] input').disabled).to.equal(false);
    merge.click();
    const invalid = editLabel('Config alpha', '', 'configurator');
    get('.label-update [data-catalog="configurator"] [data-label="Config alpha"] .merge-duplicates').click();
    get('.apply-label-update').click();
    expect(get('.label-update').open).to.equal(true);
    expect(document.activeElement).to.equal(invalid);
    expect(context.manager.changed).to.deep.equal([]);
    expect(context.manager.hasDuplicates('A', 'designer')).to.equal(true);
    editLabel('Config alpha', 'Merged config', 'configurator');
    get('.apply-label-update').click();
    expect(get('.label-update').open).to.equal(false);
    expect(context.manager.hasDuplicates('A', 'designer')).to.equal(false);
    expect(context.manager.hasDuplicates('A', 'configurator')).to.equal(false);
    expect(context.manager.aliases('A', 'designer').map((alias) => alias.label))
      .to.deep.equal(['Autre', 'Merged designer']);
    expect(context.manager.aliases('A', 'configurator').map((alias) => alias.label))
      .to.deep.equal(['Merged config']);
    expect(get('.product-info [data-label="Merged config"] .catalog-code code').textContent).to.equal('A');
    expect(context.writes()).to.have.length(0);
    get('.review').click();
    expect(get('.diffs').textContent).to.include('Merged designer|A');
    expect(get('.diffs').textContent).to.include('Merged config');
  });

  it('edits labels in a single enabled catalog without enabling the other catalog', () => {
    select('OLD');
    expect(get('.open-label-update').disabled).to.equal(true);
    select('C');
    expect(get('.open-label-update').disabled).to.equal(false);
    editLabel('Config only', 'Updated config only', 'configurator');
    expect(get('.label-update [data-catalog="designer"]').textContent).to.include('No labels');
    get('.apply-label-update').click();
    expect(context.manager.aliases('C', 'designer')).to.deep.equal([]);
    expect(context.manager.aliases('C', 'configurator')[0].label).to.equal('Updated config only');
    expect(context.manager.changed).to.deep.equal([CONFIG_PATH]);
    expect(context.writes()).to.have.length(0);
  });

  it('edits all labels in one modal and reviews them together with membership changes', async () => {
    select('A');
    expect(get('.product-info .alias-editor')).to.equal(null);
    expect(get('.product-info .merge-duplicates')).to.equal(null);
    expect(get('.review').disabled).to.equal(true);
    toggle(1);
    editLabel('Duplicate', 'Another label');
    const selector = '.label-update .catalog-editor[data-catalog="designer"] .alias-editor';
    const form = get(selector);
    expect(get('.alias-editor button[type="submit"]')).to.equal(null);
    expect(form.elements.label.value).to.equal('Alpha');
    expect(form.elements.label.getClientRects().length).to.be.greaterThan(0);
    editLabel('Alpha', ' New name ');
    expect(context.manager.changed).to.deep.equal(['poi-filter/rules.json']);
    expect(get('.label-update [data-label="Alpha"] input').value).to.equal(' New name ');
    get('.apply-label-update').click();
    expect(get('.label-update').open).to.equal(false);
    expect(get('.product-info [data-label="New name"] .catalog-label').textContent).to.equal('New name');
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(context.manager.aliases('A', 'designer').map((alias) => alias.label))
      .to.deep.equal(['Another label', 'Autre', 'Lower', 'New name']);
    expect(context.manager.drafts[CONFIG_PATH])
      .to.deep.equal(context.manager.originals[CONFIG_PATH]);
    expect(context.manager.memberships('A')).to.deep.equal(new Set([0, 1]));
    expect(get('.diffs').textContent).to.include('New name|A');
    expect(get('.diffs').textContent).to.include('Another label|A');
    expect(get('.change-summary').textContent).to.include('Second');
    expect(context.writes()).to.have.length(0);
    get('.review-dialog button[value="cancel"]').click();
    await tick();
    expect(context.writes()).to.have.length(0);
    get('.open-label-update').click();
    expect(get(`${selector} input`).getClientRects().length).to.be.greaterThan(0);
    get('.cancel-label-update').click();
    select('B');
    get('.open-label-update').click();
    expect(get(`${selector} input`).getClientRects().length).to.be.greaterThan(0);
  });

  it('validates every label before applying edits and saves both catalogs only after confirmation', async () => {
    select('A');
    editLabel('Alpha', 'New name');
    const invalid = editLabel('Config alpha', '', 'configurator');
    get('.apply-label-update').click();
    expect(get('.review-dialog').open).to.equal(false);
    expect(invalid.getAttribute('aria-invalid')).to.equal('true');
    expect(document.activeElement).to.equal(invalid);
    expect(context.manager.changed).to.deep.equal([]);
    editLabel('Config alpha', 'Bad:name', 'configurator');
    get('.apply-label-update').click();
    expect(invalid.closest('form').querySelector('.form-error').textContent)
      .to.include('commas or colons');
    expect(context.manager.changed).to.deep.equal([]);
    editLabel('Config alpha', 'New config name', 'configurator');
    get('.label-update [data-label="Alpha"]').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(get('.label-update').open).to.equal(false);
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.change-summary').textContent).to.include('New config name');
    expect(context.writes()).to.have.length(0);
    const saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(3);
    expect(get('.review').disabled).to.equal(true);
    expect(context.remote['poi/values.json'].data.map((row) => row.Values)).to.include('New name|A');
    expect(context.remote[CONFIG_PATH].poi.data.map((row) => row.Name)).to.include('New config name');
  });

  it('applies simultaneous alias swaps without renaming another edited alias twice', () => {
    select('A');
    editLabel('Alpha', 'Duplicate');
    editLabel('Duplicate', 'Alpha');
    editLabel('Config alpha', 'Alternate alpha', 'configurator');
    editLabel('Alternate alpha', 'Config alpha', 'configurator');
    get('.apply-label-update').click();
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(context.manager.drafts['poi/values.json'].data.map((row) => row.Values))
      .to.include.members(['Alpha|A', 'Duplicate|A']);
    expect(context.manager.drafts['poi/rules.json'].data.data.map((row) => row.Values))
      .to.include('Duplicate| A ');
    expect(context.manager.drafts[CONFIG_PATH].poi.data.map((row) => row.MCZ))
      .to.include.members(['Alternate alpha|A', 'Config alpha|a']);
    expect(context.manager.drafts[CONFIG_PATH]['required-preferences'].data[0].options)
      .to.include('A:Alternate alpha (A),a:Config alpha (a)');
  });

  it('retains applied label edits across product navigation and ignores reverted modal edits', () => {
    select('A');
    editLabel('Alpha', 'New name');
    editLabel('Alpha', 'Alpha');
    expect(get('.review').disabled).to.equal(true);
    expect(get('.draft-label').textContent).to.equal('No unsaved changes');
    editLabel('Alpha', 'New name');
    get('.apply-label-update').click();
    select('B');
    editLabel('Beta', 'New beta');
    get('.apply-label-update').click();
    get('.path-clear-btn').click();
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.diffs').textContent).to.include('New name|A');
    expect(get('.diffs').textContent).to.include('New beta|B');
    expect(context.writes()).to.have.length(0);
  });

  it('does not write when cancelling review and exposes full before/after content', async () => {
    context.manager.add('New', 'NEW');
    select('NEW');
    get('.review').click();
    expect(get('.review-dialog').open).to.equal(true);
    expect(root.querySelectorAll('.diffs details')).to.have.length(2);
    expect(get('.diffs').textContent).to.include('New|NEW');
    expect(get('.technical-diff').open).to.equal(false);
    expect(get('.change-summary').textContent).to.include('Add New (NEW)');
    get('.review-dialog button[value="cancel"]').click();
    await tick();
    expect(context.writes()).to.have.length(0);
    expect(get('.review-dialog').open).to.equal(false);
    expect(context.manager.changed).to.have.length(2);
    get('.review').click();
    get('.review-dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    get('.review-dialog').close();
    await tick();
    expect(context.writes()).to.have.length(0);
  });

  it('keeps the same dialog open through sheet progress and verified next steps', async () => {
    context.manager.add('New', 'NEW');
    select('NEW');
    const pending = [];
    let signalWrite;
    const writeStarted = () => new Promise((resolve) => { signalWrite = resolve; });
    context.setHook(async (path, options) => {
      if (options.method === 'PUT') {
        await new Promise((resolve) => {
          pending.push({ path, release: resolve });
          signalWrite();
        });
      }
    });
    get('.review').click();
    const dialog = get('.review-dialog');
    const visibilityChanges = [];
    const observer = new MutationObserver((records) => {
      visibilityChanges.push(...records);
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    const saved = waitForStatus('Verified saves');
    const firstWrite = writeStarted();
    get('.review-dialog button[value="save"]').click();
    expect(dialog.open).to.equal(true);
    expect(dialog.querySelector('h2').textContent).to.equal('Saving drafts');
    expect(get('.save-progress').textContent).to.equal('Checking source drafts before saving...');
    expect(get('.review-content').hidden).to.equal(true);
    expect(get('.save-result form').hidden).to.equal(true);
    await firstWrite;
    expect(pending[0].path).to.equal('poi/values.json');
    expect(get('.save-progress').textContent).to.equal('Saving product catalog...');
    const escape = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(escape);
    expect(escape.defaultPrevented).to.equal(true);
    expect(dialog.open).to.equal(true);
    get('.review-dialog button[value="save"]').click();
    expect(context.writes()).to.have.length(1);
    const secondWrite = writeStarted();
    pending[0].release();
    await secondWrite;
    expect(pending[1].path).to.equal('poi/rules.json');
    expect(get('.save-progress').textContent).to.equal('Saving product picklists...');
    expect(dialog.open).to.equal(true);
    expect(get('.next-steps').hidden).to.equal(true);
    pending[1].release();
    await saved;
    expect(get('.review-dialog')).to.equal(dialog);
    expect(dialog.open).to.equal(true);
    expect([...visibilityChanges, ...observer.takeRecords()]).to.have.length(0);
    expect(dialog.querySelector('h2').textContent).to.equal('Drafts saved');
    expect(get('.next-steps').hidden).to.equal(false);
    expect(get('.save-result form').hidden).to.equal(false);
    expect(document.activeElement).to.equal(get('.save-result button'));
    observer.disconnect();
    get('.save-result button').click();
    expect(dialog.open).to.equal(false);
  });

  it('saves only after confirmation and refreshes source statuses', async () => {
    context.manager.add('New', 'NEW');
    select('NEW');
    get('.review').click();
    const saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(2);
    expect(get('.review').disabled).to.equal(true);
    expect(get('.draft-count').textContent).to.include('0 of 4 drafts changed');
    expect(get('.source-status').textContent).to.include('0 drafts changed');
    expect(root.getAttribute('aria-busy')).to.equal('false');
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.save-result').hidden).to.equal(false);
    expect(root.querySelectorAll('.next-steps li')).to.have.length(1);
    expect(get('.next-steps').textContent).to.include('Update the stage form in Marketo Designer');
    expect(get('.next-steps a')).to.equal(null);
    get('.save-result button').click();
    expect(get('.review-dialog').open).to.equal(false);
  });

  it('shows only the relevant next step after options-only and list-only saves', async () => {
    select('C');
    editLabel('Config only', 'Updated config', 'configurator');
    get('.apply-label-update').click();
    get('.review').click();
    expect(get('.save-result').hidden).to.equal(true);
    let saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(1);
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.save-result').hidden).to.equal(false);
    expect(root.querySelectorAll('.next-steps li')).to.have.length(1);
    expect(get('.next-steps').textContent).to.equal('Publish the Configurator options sheet.');
    expect(get('.next-steps a').href)
      .to.equal('https://da.live/sheet#/adobecom/da-marketo/tools/marketo-options.json');
    expect(get('.next-steps a').target).to.equal('_blank');
    get('.save-result button').click();
    toggle(1);
    get('.review').click();
    expect(get('.save-result').hidden).to.equal(true);
    expect(get('.review-dialog h2').textContent).to.equal('Review your changes');
    saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(2);
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.save-result').hidden).to.equal(false);
    expect(root.querySelectorAll('.next-steps li')).to.have.length(1);
    expect(get('.next-steps').textContent).to.include('Update the stage form in Marketo Designer');
    expect(get('.next-steps a')).to.equal(null);
  });

  it('shows both manual follow-ups after saving changes to both catalogs', async () => {
    context.manager.add('New', 'NEW', ['designer', 'configurator']);
    select('NEW');
    get('.review').click();
    const saved = waitForStatus('Verified saves');
    get('.review-dialog button[value="save"]').click();
    await saved;
    expect(context.writes()).to.have.length(3);
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.save-result').hidden).to.equal(false);
    expect(root.querySelectorAll('.next-steps li')).to.have.length(2);
    expect(root.querySelectorAll('.next-steps a')).to.have.length(1);
    expect(get('.next-steps').textContent).to.include('Publish the Configurator options sheet.');
    expect(get('.next-steps').textContent).to.include('Update the stage form in Marketo Designer');
    expect(get('.save-result').textContent).to.include('Nothing has been published automatically.');
  });

  it('shows load and partial save failures outside the collapsed sources and retains unsaved drafts', async () => {
    context.manager.add('New', 'NEW');
    select('NEW');
    context.setHook((path, options) => {
      if (path === 'poi/rules.json' && options.method === 'PUT') return new Response('', { status: 503 });
      return undefined;
    });
    const failed = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (get('.error').textContent.includes('may already have been saved')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(get('.error'), { childList: true });
    });
    get('.review').click();
    get('.review-dialog button[value="save"]').click();
    await failed;
    expect(get('.sources').open).to.equal(false);
    expect(get('.error').hidden).to.equal(false);
    expect(get('.error').textContent).to.include('Verified saves: poi/values.json');
    expect(get('.draft-count').textContent).to.include('1 of 4 drafts changed');
    expect(get('.review').disabled).to.equal(true);
    expect(get('.product-info .prefix').disabled).to.equal(true);
    expect(get('.review-dialog').open).to.equal(true);
    expect(get('.review-dialog h2').textContent).to.equal('Save needs attention');
    expect(get('.save-error').textContent).to.include('may already have been saved');
    expect(get('.save-error').hidden).to.equal(false);
    expect(get('.next-steps').hidden).to.equal(true);
    get('.save-result button').click();
    expect(get('.review-dialog').open).to.equal(false);
  });

  it('warns before navigation and asks before discarding on reload', async () => {
    context.manager.add('New', 'NEW');
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).to.equal(true);
    const originalConfirm = window.confirm;
    try {
      window.confirm = () => false;
      await app.load();
      expect(context.manager.changed).to.have.length(2);
      window.confirm = () => true;
      const reads = context.calls.length;
      await app.load();
      expect(context.calls.length - reads).to.equal(5);
      expect(context.manager.changed).to.have.length(0);
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('warns about unapplied label edits and discards them only on confirmed reload', async () => {
    select('A');
    editLabel('Alpha', 'Unapplied');
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).to.equal(true);
    const originalConfirm = window.confirm;
    try {
      window.confirm = () => false;
      await app.load();
      expect(get('.label-update [data-label="Alpha"] input').value).to.equal('Unapplied');
      window.confirm = () => true;
      await app.load();
      select('A');
      expect(get('.label-update').open).to.equal(false);
      get('.open-label-update').click();
      expect(get('.label-update [data-label="Alpha"] input').value).to.equal('Alpha');
      expect(context.manager.changed).to.deep.equal([]);
    } finally {
      window.confirm = originalConfirm;
    }
  });
});
