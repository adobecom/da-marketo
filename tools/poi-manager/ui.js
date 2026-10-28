const SOURCES = {
  'fields.json': 'Field catalog',
  'poi/values.json': 'Product catalog',
  'poi/rules.json': 'Product picklists',
  'poi-filter/rules.json': 'Filter lists',
};
let nextId = 0;

function element(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

export default function mountManager(root, manager) {
  nextId += 1;
  const id = `poi-${nextId}`;
  const membershipMarkup = (scope) => `
    <div class="list-actions">
      <button type="button" class="select-all quiet">Select all</button>
      <button type="button" class="clear quiet">Clear selection</button>
    </div>
    <p class="counts" aria-live="polite"></p>
    <div class="lists" data-scope="${scope}"></div>`;
  root.classList.add('poi-manager');
  root.innerHTML = `
    <header class="app-header">
      <div><p class="eyebrow">Product catalog</p><h1>POI Manager</h1></div>
      <div class="catalog-actions">
        <span class="catalog-count muted"></span>
        <button type="button" class="open-add primary">Add POIs +</button>
      </div>
    </header>
    <details class="sources">
      <summary><span class="source-status">Sources not loaded</span><span class="source-disclosure">Details</span></summary>
      <table><caption class="sr-only">Source draft status</caption>
        <thead><tr><th scope="col">Source</th><th scope="col">Status</th></tr></thead>
        <tbody></tbody>
      </table>
      <button type="button" class="reload quiet">Reload sources</button>
    </details>
    <p class="status" role="status" aria-live="polite"></p>
    <p class="error" role="alert"></p>
    <fieldset class="toolbar">
      <legend class="sr-only">Find or add a POI</legend>
      <div class="product-picker">
        <label for="${id}-product">Find an existing POI</label>
        <div class="product-input">
          <input id="${id}-product" class="product" role="combobox" autocomplete="off"
            aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-options"
            placeholder="Search by product name or backend code">
          <button type="button" class="path-clear-btn quiet" aria-label="Clear POI search" title="Clear POI search" hidden><span aria-hidden="true">×</span></button>
        </div>
        <div class="product-popup" hidden>
          <ul id="${id}-options" class="product-options" role="listbox" aria-label="Matching POIs"></ul>
          <div class="no-products" hidden>
            <p>No matching POIs</p><button type="button" class="add-from-search quiet">Add POI</button>
          </div>
        </div>
        <span class="product-results sr-only" role="status"></span>
      </div>
    </fieldset>
    <section class="empty-state">
      <p class="muted">Changes stay local until you review and save drafts.</p>
    </section>
    <section class="workspace" hidden aria-label="Selected POI">
      <aside class="product-info">
        <p class="eyebrow">Selected product</p>
        <h2 class="product-title" tabindex="-1"></h2>
        <code class="product-code"></code>
        <p class="product-state badge" hidden>New POI - unsaved</p>
        <p class="warning"></p>
        <section class="rename-panel">
          <h3>Rename POI</h3>
          <form class="rename" novalidate>
            <fieldset><legend class="sr-only">Rename selected POI</legend>
              <label>New display label <input name="label" value="" aria-describedby="${id}-rename-error" required></label>
              <p class="muted">Updates existing labels in all locales. The backend code stays unchanged.</p>
              <p id="${id}-rename-error" class="form-error" role="alert"></p>
              <button>Apply rename</button>
            </fieldset>
          </form>
        </section>
        <section class="advanced">
          <h3>Advanced</h3>
          <label>New membership prefix <input class="prefix" value="1" inputmode="numeric"></label>
          <p class="muted">Applies only to new memberships. Existing prefixes are preserved.</p>
        </section>
      </aside>
      <section class="memberships" aria-label="Product memberships">
        <div class="section-heading"><h2>Filter lists</h2><span class="muted">Draft changes only</span></div>
        <p class="muted">Choose where this product belongs. Changes are added to your local draft immediately.</p>
        <fieldset class="membership-controls"><legend class="sr-only">Edit filter memberships</legend>
          ${membershipMarkup('existing')}
        </fieldset>
      </section>
    </section>
    <footer class="draft-bar">
      <div><strong class="draft-label">No unsaved changes</strong><span class="draft-count muted"></span></div>
      <button type="button" class="review primary">Review changes</button>
    </footer>
    <dialog class="creation" aria-labelledby="${id}-add-title">
      <div class="panel-heading"><div><p class="eyebrow">New product</p><h2 id="${id}-add-title">Add POI</h2></div>
        <button type="button" class="cancel-add quiet">Cancel</button>
      </div>
      <ol class="steps" aria-label="Add POI steps">
        <li aria-current="step">1. Product details</li><li>2. Assign lists</li><li>3. Review &amp; save</li>
      </ol>
      <form class="add" novalidate>
        <fieldset><legend class="sr-only">New product details</legend>
          <label>Display label <input name="label" aria-describedby="${id}-add-error" required></label>
          <label>Backend code <input name="code" aria-describedby="${id}-code-help ${id}-add-error" required></label>
          <p id="${id}-code-help" class="muted">Use the code expected by the backend system. Codes are case-sensitive and cannot be changed after creation.</p>
          <p id="${id}-add-error" class="form-error" role="alert"></p>
          <div class="panel-footer"><span class="muted">Nothing is saved yet.</span><button class="primary">Continue to lists</button></div>
        </fieldset>
      </form>
      <section class="creation-assignment" hidden>
        <h3 class="new-product-title"></h3><p class="muted">Choose lists for this product. You can also continue without assigning any lists.</p>
        <fieldset><legend class="sr-only">New POI list memberships</legend>
          ${membershipMarkup('new')}
          <section class="advanced"><h3>Advanced</h3>
            <label>New membership prefix <input class="prefix" value="1" inputmode="numeric"></label>
            <p class="muted">Default: 1. Applies only to this product's new memberships.</p>
          </section>
          <p class="form-error" role="alert"></p>
          <div class="panel-footer">
            <button type="button" class="back-add quiet">Back</button>
            <button type="button" class="finish-add primary">Review new POI</button>
          </div>
        </fieldset>
      </section>
    </dialog>
    <dialog class="review-dialog" aria-labelledby="${id}-review-title">
      <p class="eyebrow">Ready when you are</p><h2 id="${id}-review-title">Review your changes</h2>
      <p>Save source drafts only. This does not preview or publish.</p>
      <ul class="change-summary"></ul>
      <details class="technical-diff"><summary>Technical details &amp; full before/after diff</summary><div class="diffs"></div></details>
      <p class="muted">Files are saved separately, not as an atomic transaction. Read-before-write checks cannot guarantee conflict-free concurrent editing.</p>
      <form method="dialog" class="panel-footer">
        <button value="cancel" autofocus>Back to editing</button><button value="save" class="primary">Save drafts</button>
      </form>
    </dialog>`;

  const get = (selector) => root.querySelector(selector);
  const picker = get('.product');
  const popup = get('.product-popup');
  const creation = get('.creation');
  const review = get('.review-dialog');
  const existingScope = get('.memberships');
  const newScope = get('.creation-assignment');
  let selected;
  let proposed;
  let newSelection = new Set();
  let activeOption = -1;
  let operation = false;
  let message = '';
  let render;

  const blocked = () => operation || manager.busy || !manager.loaded || manager.reloadRequired;
  const chosen = () => manager.products.find((item) => item.code === selected?.code) || selected;

  function closePicker() {
    popup.hidden = true;
    picker.setAttribute('aria-expanded', 'false');
    picker.removeAttribute('aria-activedescendant');
    activeOption = -1;
  }

  function selectProduct(item) {
    selected = item;
    picker.value = item.label;
    closePicker();
    render();
  }

  function renderOptions() {
    get('.path-clear-btn').hidden = !picker.value && !chosen();
    if (blocked()) return;
    const query = picker.value.trim().toLowerCase();
    const products = manager.products.filter((item) => `${item.label} ${item.code}`.toLowerCase().includes(query));
    const listbox = get('.product-options');
    listbox.replaceChildren();
    products.forEach((item, index) => {
      const option = element('li', undefined, {
        role: 'option',
        id: `${id}-option-${index}`,
        'aria-selected': String(activeOption === index),
        'data-code': item.code,
      });
      option.append(element('strong', item.label), element('span', item.code, { class: 'muted' }));
      if (item.stale) option.append(element('span', 'Removal only', { class: 'badge' }));
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('click', () => selectProduct(item));
      listbox.append(option);
    });
    popup.hidden = false;
    picker.setAttribute('aria-expanded', 'true');
    get('.no-products').hidden = products.length !== 0;
    get('.product-results').textContent = `${products.length} matching POIs`;
    picker.removeAttribute('aria-activedescendant');
    if (activeOption >= 0 && activeOption < products.length) {
      const option = listbox.children[activeOption];
      picker.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  function showError(error, container = get('.error')) {
    container.textContent = error.message;
    container.hidden = false;
  }

  function local(action) {
    if (blocked()) return;
    get('.error').textContent = '';
    try {
      action();
    } catch (error) {
      showError(error);
    }
    render();
  }

  function updateExisting(selection) {
    const { code } = chosen();
    if (!selection.size && !manager.memberships(code).size) return;
    if (chosen().stale) {
      selection.forEach((index) => {
        if (!manager.memberships(code).has(index)) manager.undoMembership(code, index);
      });
    }
    manager.updateMemberships(code, selection, get('.product-info .prefix').value);
    message = 'Membership changes added to your local draft.';
  }

  function renderLists(scope, isNew = false) {
    const item = isNew ? proposed : chosen();
    if (!item) return;
    const selection = isNew ? newSelection : manager.memberships(item.code);
    const original = new Set(manager.originalLists.filter((list) => !list.error
      && list.entries.some((entry) => entry.code === item.code)).map((list) => list.index));
    const container = scope.querySelector('.lists');
    const expanded = new Set([...container.querySelectorAll('details[open]')]
      .map((details) => details.dataset.index));
    const focusIndex = container.contains(document.activeElement)
      ? document.activeElement.dataset.index : undefined;
    container.replaceChildren();
    const labels = new Map(manager.products.map((product) => [product.code, product.label]));
    manager.lists.forEach((list) => {
      const included = selection.has(list.index);
      const changed = !list.error && included !== original.has(list.index);
      const card = element('div', undefined, { class: `list${changed ? ' changed' : ''}` });
      const row = element('div', undefined, { class: 'list-heading' });
      const label = element('label', undefined, { class: 'membership-label' });
      const input = element('input', undefined, { type: 'checkbox', 'data-index': list.index });
      input.checked = included;
      input.disabled = blocked() || !!list.error || (item.stale && !original.has(list.index));
      input.addEventListener('change', () => {
        const next = new Set(selection);
        if (input.checked) next.add(list.index);
        else next.delete(list.index);
        if (isNew) {
          newSelection = next;
          renderLists(scope, true);
        } else local(() => updateExisting(next));
      });
      label.append(input, element('span', list.title || 'Untitled list'));
      row.append(label);
      if (changed) {
        row.append(element('span', included ? 'Added' : 'Removed', { class: `badge ${included ? 'added' : 'removed'}` }));
        if (!isNew) {
          const undo = element('button', 'Undo', { type: 'button', class: 'quiet undo', 'aria-label': `Undo membership change in ${list.title}` });
          undo.disabled = blocked();
          undo.addEventListener('click', () => local(() => {
            manager.undoMembership(item.code, list.index);
            message = 'Membership change undone.';
          }));
          row.append(undo);
        }
      }
      const details = element('details', undefined, { 'data-index': list.index });
      details.open = expanded.has(String(list.index));
      details.append(element('summary', `${list.entries.length} products - view contents`));
      const entries = element('ul', undefined, { class: 'list-products' });
      list.entries.forEach((entry) => {
        const entryRow = element('li');
        entryRow.append(
          element('span', labels.get(entry.code) || entry.code),
          element('code', entry.code),
        );
        entries.append(entryRow);
      });
      if (!list.entries.length) entries.append(element('li', 'No products in this list yet.'));
      details.append(entries);
      const technical = element('details', undefined, { class: 'rule-label' });
      technical.append(element('summary', 'Rule label'), element('pre', list.label));
      details.append(technical);
      card.append(row, details);
      if (list.error) card.append(element('p', `${list.error} This list cannot be edited.`, { role: 'alert' }));
      container.append(card);
    });
    scope.querySelector('.counts').textContent = `${selection.size} of ${manager.lists.length} lists selected`;
    if (!manager.lists.length) {
      container.append(element('p', 'No recognized filter lists. Load the appropriate POI-filter Rules workbook.', { class: 'empty-lists' }));
    }
    if (focusIndex !== undefined) {
      container.querySelector(`input[data-index="${focusIndex}"]`)?.focus({ preventScroll: true });
    }
  }

  render = () => {
    const busy = operation || manager.busy;
    const item = chosen();
    const { changed } = manager;
    const actions = manager.reviewChanges;
    root.setAttribute('aria-busy', String(busy));
    root.querySelectorAll('fieldset').forEach((fieldset) => { fieldset.disabled = blocked(); });
    get('.open-add').disabled = blocked();
    get('.path-clear-btn').hidden = !picker.value && !item;
    get('.path-clear-btn').disabled = blocked();
    get('.product-info .prefix').disabled = blocked();
    get('.reload').disabled = busy;
    get('.review').disabled = blocked() || changed.length === 0;
    get('.source-status').textContent = manager.loaded
      ? `Sources loaded · ${changed.length} drafts changed` : 'Loading sources';
    get('.catalog-count').textContent = manager.loaded
      ? `${manager.products.filter((product) => !product.stale).length} products` : '';
    const sourceRows = get('.sources tbody');
    sourceRows.replaceChildren();
    Object.entries(SOURCES).forEach(([path, name]) => {
      const row = element('tr');
      const cell = element('td');
      cell.append(element('a', name, {
        href: `https://da.live/sheet#/adobecom/da-marketo/marketodesigner/${path}`,
        target: '_blank',
        rel: 'noopener',
      }));
      let state = changed.includes(path) ? 'Changed draft' : 'Unchanged';
      if (path === 'fields.json') state = 'Read-only';
      row.append(cell, element('td', manager.loaded ? state : 'Not loaded'));
      sourceRows.append(row);
    });
    get('.status').textContent = message;
    get('.status').hidden = !message;
    get('.error').hidden = !get('.error').textContent;
    get('.draft-label').textContent = changed.length ? `${actions.length} unsaved changes` : 'No unsaved changes';
    get('.draft-count').textContent = `${changed.length} of 3 drafts changed · Not published`;
    get('.draft-bar').classList.toggle('has-changes', changed.length > 0);
    get('.workspace').hidden = !item;
    get('.empty-state').hidden = !!item;
    if (item) {
      get('.product-title').textContent = item.label;
      get('.product-code').textContent = item.code;
      get('.product-state').hidden = item.stale || !actions.some((text) => text.startsWith(`Add ${item.label} (${item.code})`));
      get('.warning').textContent = item.stale
        ? 'Removal only: this code is missing from the product catalog. Keep or remove its existing memberships; it cannot join other lists.' : '';
      get('.warning').hidden = !item.stale;
      get('.rename-panel').hidden = !!item.stale;
      renderLists(existingScope);
    }
    if (proposed && !newScope.hidden) renderLists(newScope, true);
  };

  async function run(action, progress) {
    if (operation) return;
    operation = true;
    get('.error').textContent = '';
    message = progress;
    closePicker();
    render();
    try {
      message = await action();
    } catch (error) {
      message = '';
      showError(error);
    } finally {
      operation = false;
      render();
    }
  }

  function setStep(assign) {
    get('.add').hidden = assign;
    newScope.hidden = !assign;
    creation.querySelectorAll('.steps li').forEach((step, index) => {
      step.removeAttribute('aria-current');
      if (index === Number(assign)) step.setAttribute('aria-current', 'step');
    });
    if (assign) {
      get('.new-product-title').textContent = `${proposed.label} (${proposed.code})`;
      renderLists(newScope, true);
      (newScope.querySelector('input[type="checkbox"]:not(:disabled)') || get('.finish-add')).focus();
    } else get('.add input').focus();
  }

  function openCreation() {
    if (blocked()) return;
    const form = get('.add');
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    creation.querySelectorAll('.form-error').forEach((error) => { error.textContent = ''; });
    newScope.querySelector('.prefix').value = '1';
    newSelection = new Set();
    proposed = undefined;
    closePicker();
    creation.showModal();
    setStep(false);
  }

  function showReview() {
    const summary = get('.change-summary');
    summary.replaceChildren(...manager.reviewChanges.map((text) => element('li', text)));
    const diffs = get('.diffs');
    diffs.replaceChildren();
    manager.changed.forEach((path) => {
      const details = element('details');
      details.append(
        element('summary', SOURCES[path]),
        element('p', manager.summary(path)),
        element('h3', 'Before'),
        element('pre', JSON.stringify(manager.originals[path], null, 2)),
        element('h3', 'After'),
        element('pre', JSON.stringify(manager.drafts[path], null, 2)),
      );
      diffs.append(details);
    });
    get('.technical-diff').open = false;
    review.showModal();
  }

  function bindMemberships(scope, isNew = false) {
    scope.querySelector('.select-all').addEventListener('click', () => {
      const item = isNew ? proposed : chosen();
      const next = new Set(isNew ? newSelection : manager.memberships(item.code));
      const allowed = manager.originalLists
        .filter((list) => list.entries.some((entry) => entry.code === item.code));
      manager.lists.filter((list) => !list.error
        && (!item.stale || allowed.some((entry) => entry.index === list.index)))
        .forEach((list) => next.add(list.index));
      if (isNew) {
        newSelection = next;
        renderLists(scope, true);
      } else local(() => updateExisting(next));
    });
    scope.querySelector('.clear').addEventListener('click', () => {
      if (isNew) {
        newSelection.clear();
        renderLists(scope, true);
      } else local(() => updateExisting(new Set()));
    });
  }

  picker.addEventListener('focus', () => {
    activeOption = -1;
    renderOptions();
  });
  picker.addEventListener('input', () => {
    activeOption = -1;
    renderOptions();
  });
  get('.path-clear-btn').addEventListener('click', () => {
    if (blocked()) return;
    selected = undefined;
    picker.value = '';
    activeOption = -1;
    render();
    picker.focus();
    renderOptions();
  });
  picker.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (popup.hidden) renderOptions();
      const count = get('.product-options').children.length;
      if (count) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (activeOption === -1) activeOption = direction === 1 ? 0 : count - 1;
        else activeOption = (activeOption + direction + count) % count;
        renderOptions();
      }
    } else if (event.key === 'Enter' && !popup.hidden) {
      event.preventDefault();
      get('.product-options').children[Math.max(0, activeOption)]?.click();
    } else if (event.key === 'Escape' && !popup.hidden) {
      event.preventDefault();
      closePicker();
    } else if (event.key === 'Tab' && get('.no-products').hidden) closePicker();
  });
  const outsidePicker = (event) => {
    if (!get('.product-picker').contains(event.target)) closePicker();
  };
  document.addEventListener('click', outsidePicker);
  document.addEventListener('focusin', outsidePicker);
  get('.open-add').addEventListener('click', openCreation);
  get('.add-from-search').addEventListener('click', openCreation);
  get('.cancel-add').addEventListener('click', () => creation.close());
  get('.back-add').addEventListener('click', () => setStep(false));
  get('.add').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    form.querySelector('.form-error').textContent = '';
    try {
      proposed = manager.validateAddition(form.elements.label.value, form.elements.code.value);
      setStep(true);
    } catch (error) {
      showError(error, form.querySelector('.form-error'));
      const field = error.message.includes('label') ? form.elements.label : form.elements.code;
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    }
  });
  get('.finish-add').addEventListener('click', () => {
    const { drafts } = manager;
    try {
      const code = manager.add(get('.add').elements.label.value, get('.add').elements.code.value);
      manager.updateMemberships(code, newSelection, newScope.querySelector('.prefix').value);
      creation.close();
      selectProduct(manager.products.find((item) => item.code === code));
      message = 'New POI and list assignments added to your local draft.';
      get('.add').reset();
      render();
      showReview();
    } catch (error) {
      manager.drafts = drafts;
      showError(error, newScope.querySelector('.form-error'));
    }
  });
  get('.rename').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.querySelector('.form-error').textContent = '';
    form.elements.label.removeAttribute('aria-invalid');
    try {
      manager.rename(chosen().code, form.elements.label.value);
      selected = chosen();
      picker.value = selected.label;
      form.reset();
      message = 'Product rename added to your local draft.';
      render();
    } catch (error) {
      form.elements.label.setAttribute('aria-invalid', 'true');
      showError(error, form.querySelector('.form-error'));
    }
  });
  bindMemberships(existingScope);
  bindMemberships(newScope, true);
  get('.review').addEventListener('click', showReview);
  review.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const confirmed = event.submitter?.value === 'save';
    review.close();
    if (confirmed) {
      run(async () => {
        const paths = await manager.save((path, phase) => {
          message = `${phase} ${SOURCES[path].toLowerCase()}...`;
          get('.status').textContent = message;
        });
        return `Verified saves: ${paths.map((path) => SOURCES[path]).join(', ')}. Drafts saved; nothing published.`;
      }, 'Checking source drafts before saving...');
    } else get('.product-title').focus();
  });

  async function reload() {
    if ((manager.changed.length || manager.reloadRequired)
      // eslint-disable-next-line no-alert
      && !window.confirm('Discard local drafts and reload all source data?')) return;
    await run(async () => {
      await manager.load();
      selected = undefined;
      picker.value = '';
      return '';
    }, 'Loading source drafts...');
  }
  get('.reload').addEventListener('click', reload);
  const beforeUnload = (event) => {
    const form = get('.add');
    const creating = creation.open && (form.elements.label.value || form.elements.code.value);
    if (manager.changed.length || manager.busy || operation || creating) {
      event.preventDefault();
      event.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', beforeUnload);
  render();
  return {
    load: reload,
    destroy: () => {
      document.removeEventListener('click', outsidePicker);
      document.removeEventListener('focusin', outsidePicker);
      window.removeEventListener('beforeunload', beforeUnload);
      if (creation.open) creation.close();
      if (review.open) review.close();
      root.replaceChildren();
    },
  };
}
