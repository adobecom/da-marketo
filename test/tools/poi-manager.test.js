import { expect } from '@esm-bundle/chai';
import { PoiManager, SOURCE_PATHS } from '../../tools/poi-manager/poi-manager.js';
import mountManager from '../../tools/poi-manager/ui.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
const worksheet = (data) => ({ total: data.length, limit: data.length, offset: 0, data });
const rows = (...values) => values.map((Values) => ({ Values, extra: 'preserve' }));
const assignment = (value, label) => ({ value, label: `mktoFormsPrimaryProductInterest = ${label}`, extra: 'keep' });

function fixtures() {
  return {
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
        const path = url.split('/marketodesigner/')[1];
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
  it('loads authenticated source drafts, deduplicates exact codes and never writes on load', async () => {
    const { manager, calls, writes } = setup();
    await manager.load();
    expect(manager.products.map(({ code }) => code)).to.deep.equal(['A', 'a', 'B', 'OLD']);
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
    expect(manager.drafts['poi/values.json'].data.slice(1, 3).map((row) => row.Values))
      .to.deep.equal(['Renamed|A', 'Renamed|A']);
    expect(manager.drafts['poi/rules.json'].data.data[1])
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

  it('permits stale removals and retaining memberships but rejects adding stale codes atomically', async () => {
    const { manager } = setup();
    await manager.load();
    manager.updateMemberships('OLD', new Set([2]), '1');
    expect(manager.changed).to.have.length(0);
    expect(() => manager.updateMemberships('OLD', new Set([0]), '1')).to.throw('removal-only');
    expect(manager.changed).to.have.length(0);
    manager.updateMemberships('OLD', new Set(), '1');
    expect(manager.lists[2].label).to.equal('mktoFormsPrimaryProductInterest = none');
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

describe('POI Manager draft saves', () => {
  it('writes only changed sources sequentially and verifies each before marking clean', async () => {
    const { manager, writes, calls, remote } = setup();
    await manager.load();
    manager.add('New', 'NEW');
    expect(await manager.save()).to.deep.equal(SOURCE_PATHS.slice(0, 2));
    expect(writes().map(({ path }) => path)).to.deep.equal(SOURCE_PATHS.slice(0, 2));
    expect(manager.changed).to.have.length(0);
    expect(manager.drafts['poi/values.json']).to.deep.equal(remote['poi/values.json']);
    const operations = calls.slice(4).map(({ path, options }) => `${options.method || 'GET'} ${path}`);
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

describe('POI Manager browser controls', () => {
  let root;
  let app;
  let context;
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

  beforeEach(async () => {
    root = document.createElement('main');
    document.body.append(root);
    context = setup();
    app = mountManager(root, context.manager);
    await app.load();
  });

  afterEach(() => {
    app.destroy();
    root.remove();
  });

  it('keeps sources collapsed, with friendly links to source workbooks', () => {
    expect(get('.sources').open).to.equal(false);
    expect(get('.source-status').textContent).to.equal('Sources loaded · 0 drafts changed');
    expect(get('.status').hidden).to.equal(true);
    expect(root.querySelectorAll('.sources tbody tr')).to.have.length(4);
    expect(get('.sources tbody a').textContent).to.equal('Field catalog');
    expect(get('.sources tbody a').href).to.include('/adobecom/da-marketo/marketodesigner/fields.json');
    const productLink = get('.sources tbody tr:nth-child(2) a');
    expect(productLink.textContent).to.equal('Product catalog');
    expect(productLink.href).to.equal('https://da.live/sheet#/adobecom/da-marketo/marketodesigner/poi/values.json');
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

  it('keeps collapsed contents inline, expands full-width, and wraps narrow list rows', async () => {
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
      expect(details.getBoundingClientRect().width).to.be.greaterThan(600);
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

  it('keeps stale codes removal-only and permits undo after removing the last membership', () => {
    select('OLD');
    expect(get('.warning').textContent).to.include('Removal only');
    expect(get('.memberships input[data-index="0"]').disabled).to.equal(true);
    toggle(2);
    expect(context.manager.memberships('OLD').size).to.equal(0);
    get('.memberships .undo').click();
    expect(context.manager.memberships('OLD')).to.deep.equal(new Set([2]));
    expect(context.manager.changed).to.have.length(0);
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
    expect(get('.draft-count').textContent).to.include('3 of 3 drafts changed');
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

  it('keeps rename and advanced controls visible before and after renaming', () => {
    select('A');
    expect(get('.rename input').getClientRects().length).to.be.greaterThan(0);
    expect(get('.product-info .advanced .prefix').getClientRects().length).to.be.greaterThan(0);
    get('.rename').elements.label.value = 'New name';
    get('.rename').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(get('.product-title').textContent).to.equal('New name');
    expect(get('.product').value).to.equal('New name');
    expect(context.manager.memberships('A')).to.deep.equal(new Set([0]));
    expect(get('.rename input').getClientRects().length).to.be.greaterThan(0);
    select('B');
    expect(get('.rename input').getClientRects().length).to.be.greaterThan(0);
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
    expect(context.manager.changed).to.have.length(2);
    get('.review').click();
    get('.review-dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    get('.review-dialog').close();
    await tick();
    expect(context.writes()).to.have.length(0);
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
    expect(get('.draft-count').textContent).to.include('0 of 3 drafts changed');
    expect(get('.source-status').textContent).to.include('0 drafts changed');
    expect(root.getAttribute('aria-busy')).to.equal('false');
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
    expect(get('.draft-count').textContent).to.include('1 of 3 drafts changed');
    expect(get('.review').disabled).to.equal(true);
    expect(get('.product-info .prefix').disabled).to.equal(true);
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
      expect(context.calls.length - reads).to.equal(4);
      expect(context.manager.changed).to.have.length(0);
    } finally {
      window.confirm = originalConfirm;
    }
  });
});
