import { CONFIG_PATH, SOURCE_PATHS } from './poi-manager.js';

const SOURCES = {
  'fields.json': 'Field catalog',
  'poi/values.json': 'Product catalog',
  'poi/rules.json': 'Product picklists',
  'poi-filter/rules.json': 'Filter lists',
  [CONFIG_PATH]: 'Configurator options',
};
const sameCode = (left, right) => left.trim().toLowerCase() === right.trim().toLowerCase();
const ACTIVE_POI_KEY = 'poi-manager:active-poi';
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
      <div><p class="eyebrow">DA Marketo</p><h1>POI Manager</h1></div>
      <div class="catalog-actions">
        <span class="catalog-count muted"></span>
        <button type="button" class="open-add primary">Add POIs +</button>
      </div>
    </header>
    <details class="sources">
      <summary><span class="source-status">Sources not loaded</span><span class="source-disclosure muted">Details</span></summary>
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
        <div class="product-actions">
          <button type="button" class="open-code-update">Update Backend Code</button>
          <button type="button" class="open-label-update">Update Labels</button>
        </div>
        <section class="catalog-labels" aria-label="Catalog availability and labels"></section>
        <section class="advanced">
          <h3>Advanced</h3>
          <label>New membership prefix <input class="prefix" value="1" inputmode="numeric"></label>
          <p class="muted">Existing prefixes are preserved.</p>
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
          <p id="${id}-code-help" class="muted">Use the code expected by the backend system. Codes are matched case-insensitively; their stored spelling is preserved.</p>
          <fieldset class="new-catalogs"><legend>Enable in</legend>
            <label><input type="checkbox" name="designer" checked> Marketo Designer</label>
            <label><input type="checkbox" name="configurator"> Configurator</label>
          </fieldset>
          <p id="${id}-add-error" class="form-error" role="alert"></p>
          <div class="panel-footer"><span class="muted">Nothing is saved yet.</span><button class="primary">Continue to lists</button></div>
        </fieldset>
      </form>
      <section class="creation-assignment" hidden>
        <h3 class="new-product-title"></h3><p class="muted">Choose lists for this product. You can also continue without assigning any lists.</p>
        <fieldset><legend class="sr-only">New POI list memberships</legend>
          ${membershipMarkup('new')}
          <section class="advanced"><h3>Advanced</h3>
            <label>Membership Prefix<input class="prefix" value="1" inputmode="numeric"></label>
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
    <dialog class="code-update" aria-labelledby="${id}-code-title">
      <h2 id="${id}-code-title">Update backend code</h2>
      <p class="muted">Updates existing entries in Designer, Configurator, and filter lists together.
        Nothing is saved until you review changes and save drafts.</p>
      <form novalidate>
        <fieldset><legend class="sr-only">Backend code update</legend>
          <p>Current backend code: <code class="current-code"></code></p>
          <label>New backend code <input name="code" required aria-describedby="${id}-code-error"></label>
          <p id="${id}-code-error" class="form-error" role="alert"></p>
          <div class="panel-footer">
            <button type="button" class="cancel-code-update">Cancel</button>
            <button type="submit" class="primary">Update local draft</button>
          </div>
        </fieldset>
      </form>
    </dialog>
    <dialog class="label-update" aria-labelledby="${id}-labels-title">
      <h2 id="${id}-labels-title">Update labels</h2>
      <p class="muted">Edit labels in both catalogs or choose which duplicate to keep.
        Nothing is saved until you review changes and save drafts.</p>
      <div class="label-editors"></div>
      <p class="label-error form-error" role="alert"></p>
      <div class="panel-footer">
        <button type="button" class="cancel-label-update">Cancel</button>
        <button type="button" class="apply-label-update primary">Update local draft</button>
      </div>
    </dialog>
    <dialog class="review-dialog" aria-labelledby="${id}-review-title">
      <p class="eyebrow">Ready when you are</p><h2 id="${id}-review-title" tabindex="-1">Review your changes</h2>
      <div class="review-content">
        <p>Save source drafts only. This does not preview or publish.</p>
        <ul class="change-summary"></ul>
        <details class="technical-diff"><summary>Technical details &amp; full before/after diff</summary><div class="diffs"></div></details>
        <p class="muted">Files are saved separately, not as an atomic transaction. Read-before-write checks cannot guarantee conflict-free concurrent editing.</p>
        <form method="dialog" class="panel-footer">
          <button value="cancel" autofocus>Back to editing</button><button value="save" class="primary">Save drafts</button>
        </form>
      </div>
      <section class="save-result" hidden>
        <p class="save-progress" role="status" aria-live="polite"></p>
        <p class="save-error form-error" role="alert" hidden></p>
        <ol class="next-steps change-summary" hidden></ol>
        <p class="next-steps-note muted" hidden>These steps are manual. Nothing has been published automatically.</p>
        <form method="dialog" class="panel-footer" hidden>
          <button class="primary">Done</button>
        </form>
      </section>
    </dialog>`;

  const get = (selector) => root.querySelector(selector);
  const picker = get('.product');
  const popup = get('.product-popup');
  const creation = get('.creation');
  const codeUpdate = get('.code-update');
  const labelUpdate = get('.label-update');
  const review = get('.review-dialog');
  const saveResult = get('.save-result');
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
  const chosen = () => manager.products.find((item) => selected
    && sameCode(item.code, selected.code))
    || (selected && { ...selected, designer: false, configurator: false, isNew: false });
  const newCatalogs = () => ['designer', 'configurator']
    .filter((catalog) => get('.add').elements[catalog].checked);
  const pendingLabels = () => labelUpdate.open && (
    !!labelUpdate.querySelector('[data-keep]')
    || [...labelUpdate.querySelectorAll('.alias-editor')]
      .some((form) => !form.elements.label.disabled
        && form.elements.label.value !== form.dataset.label)
  );

  function closePicker() {
    popup.hidden = true;
    picker.setAttribute('aria-expanded', 'false');
    picker.removeAttribute('aria-activedescendant');
    activeOption = -1;
  }

  function selectProduct(item) {
    selected = item;
    picker.value = chosen()?.label || '';
    try {
      if (item) window.sessionStorage.setItem(ACTIVE_POI_KEY, item.code);
      else window.sessionStorage.removeItem(ACTIVE_POI_KEY);
    } catch {
      // Embedded storage may be blocked; selection must still work.
    }
    closePicker();
    render();
    return true;
  }

  function renderOptions() {
    get('.path-clear-btn').hidden = !picker.value && !chosen();
    if (blocked()) return;
    const query = picker.value.trim().toLowerCase();
    const products = manager.products.filter((item) => `${item.labels.join(' ')} ${item.code}`.toLowerCase().includes(query));
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
      if (item.configurator) option.append(element('span', 'Configurator', { class: 'badge configurator' }));
      if (item.designer) option.append(element('span', 'Dropdown', { class: 'badge dropdown' }));
      if (manager.hasDuplicates(item.code, 'designer') || manager.hasDuplicates(item.code, 'configurator')) {
        option.append(element('span', 'Duplicates', { class: 'badge duplicates' }));
      }
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
    manager.updateMemberships(code, selection, get('.product-info .prefix').value);
    message = 'Membership changes added to your local draft.';
  }

  const applyLabels = () => {
    const forms = [...labelUpdate.querySelectorAll('.alias-editor')]
      .filter((form) => !form.elements.label.disabled
        && form.elements.label.value !== form.dataset.label);
    const edits = forms.map((form) => ({
      code: labelUpdate.dataset.code,
      catalog: form.closest('.catalog-editor').dataset.catalog,
      oldLabel: form.dataset.label,
      label: form.elements.label.value,
    }));
    try {
      manager.renameAliases(edits);
      labelUpdate.querySelectorAll('[data-keep]').forEach((section) => {
        const form = [...section.querySelectorAll('.alias-editor')]
          .find((entry) => entry.dataset.label === section.dataset.keep);
        manager.mergeDuplicates(
          labelUpdate.dataset.code,
          section.dataset.catalog,
          form.elements.label.value.trim(),
        );
      });
      return true;
    } catch (error) {
      const form = forms[edits.indexOf(error.labelEdit)];
      if (form) {
        form.elements.label.setAttribute('aria-invalid', 'true');
        showError(error, form.querySelector('.form-error'));
        form.elements.label.focus();
      } else showError(error, labelUpdate.querySelector('.label-error'));
      return false;
    }
  };

  function renderCatalogs(item) {
    const container = get('.catalog-labels');
    container.dataset.code = item.code;
    container.replaceChildren();
    ['designer', 'configurator'].forEach((catalog) => {
      const title = catalog === 'designer' ? 'Marketo Designer' : 'Configurator';
      const section = element('fieldset', undefined, { class: 'catalog-editor', 'data-catalog': catalog });
      section.disabled = blocked();
      const legend = element('legend', title);
      if (manager.hasDuplicates(item.code, catalog)) {
        legend.append(' ', element('span', 'Duplicates', {
          class: 'badge duplicates',
          title: 'Duplicate entries. Use Update labels to merge them.',
        }));
      }
      section.append(legend);
      const availability = element('label', undefined, { class: 'catalog-availability' });
      const checkbox = element('input', undefined, { type: 'checkbox', class: 'catalog-enabled' });
      checkbox.checked = !!item[catalog];
      availability.append(checkbox, element('span', 'Enabled'));
      section.append(availability);
      const enableLabel = element('label', 'Label when enabling');
      const enableInput = element('input', undefined, { class: 'enable-label', value: item.label });
      enableLabel.append(enableInput);
      enableLabel.hidden = !!item[catalog];
      section.append(enableLabel);
      checkbox.addEventListener('change', () => {
        local(() => {
          manager.setEnabled(item.code, catalog, checkbox.checked, enableInput.value);
          message = `${title} availability updated in your local draft. Other catalogs are unchanged.`;
        });
        get(`[data-catalog="${catalog}"] .catalog-enabled`).focus();
      });
      manager.aliases(item.code, catalog).forEach((alias) => {
        const summary = element('div', undefined, { class: 'alias-summary', 'data-label': alias.label });
        const code = element('p', '', { class: 'muted catalog-code' });
        code.append(element('code', [...alias.codes].join(', ')));
        summary.append(code, element('p', alias.label, { class: 'catalog-label' }));
        section.append(summary);
      });
      container.append(section);
    });
  }

  function renderLabelEditors(item) {
    const container = labelUpdate.querySelector('.label-editors');
    container.replaceChildren();
    labelUpdate.dataset.code = item.code;
    labelUpdate.querySelector('.label-error').textContent = '';
    ['designer', 'configurator'].forEach((catalog) => {
      const title = catalog === 'designer' ? 'Marketo Designer' : 'Configurator';
      const section = element('fieldset', undefined, { class: 'catalog-editor', 'data-catalog': catalog });
      section.append(element('legend', title));
      const aliases = manager.aliases(item.code, catalog);
      const duplicates = manager.hasDuplicates(item.code, catalog);
      const note = element('p', 'Duplicates will be merged when you update the local draft.', { class: 'muted', hidden: '' });
      aliases.forEach((alias, index) => {
        const form = element('form', undefined, { class: 'alias-editor', novalidate: '', 'data-label': alias.label });
        const label = element('label', `Display label ${index + 1}`);
        const input = element('input', undefined, { name: 'label', value: alias.label, required: '' });
        label.append(input);
        const error = element('p', undefined, { class: 'form-error', role: 'alert', id: `${id}-${catalog}-${index}-error` });
        input.setAttribute('aria-describedby', error.id);
        const code = element('p', '', { class: 'muted catalog-code' });
        code.append(element('code', [...alias.codes].join(', ')));
        form.append(code);
        form.append(label, error);
        input.addEventListener('input', () => {
          input.removeAttribute('aria-invalid');
          error.textContent = '';
        });
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          get('.apply-label-update').click();
        });
        if (duplicates) {
          const merge = element('button', 'Merge duplicates: keep this label', {
            type: 'button',
            class: 'alert merge-duplicates',
            'aria-pressed': 'false',
          });
          merge.addEventListener('click', () => {
            const undo = section.dataset.keep !== undefined;
            if (undo) delete section.dataset.keep;
            else section.dataset.keep = alias.label;
            section.querySelectorAll('.alias-editor').forEach((entry) => {
              entry.hidden = !undo && entry !== form;
              entry.elements.label.disabled = entry.hidden;
            });
            merge.textContent = undo ? 'Merge duplicates: keep this label' : 'Undo merge';
            merge.classList.toggle('alert', undo);
            merge.setAttribute('aria-pressed', String(!undo));
            note.hidden = undo;
          });
          form.append(merge);
        }
        section.append(form);
      });
      if (!aliases.length) section.append(element('p', 'No labels in this catalog.', { class: 'muted' }));
      section.append(note);
      container.append(section);
    });
  }

  function renderLists(scope, isNew = false) {
    const item = isNew ? proposed : chosen();
    if (!item) return;
    const selection = isNew ? newSelection : manager.memberships(item.code);
    const original = new Set(manager.originalLists.filter((list) => !list.error
      && list.entries.some((entry) => sameCode(entry.code, item.code))).map((list) => list.index));
    const container = scope.querySelector('.lists');
    const expanded = new Set([...container.querySelectorAll('details[open]')]
      .map((details) => details.dataset.index));
    const focusIndex = container.contains(document.activeElement)
      ? document.activeElement.dataset.index : undefined;
    container.replaceChildren();
    const labels = new Map(manager.products
      .map((product) => [product.code.toLowerCase(), product.label]));
    manager.lists.forEach((list) => {
      const included = selection.has(list.index);
      const changed = !list.error && included !== original.has(list.index);
      const card = element('div', undefined, { class: `list${changed ? ' changed' : ''}` });
      const row = element('div', undefined, { class: 'list-heading' });
      const label = element('label', undefined, { class: 'membership-label' });
      const input = element('input', undefined, { type: 'checkbox', 'data-index': list.index });
      input.checked = included;
      input.disabled = blocked() || !!list.error;
      input.addEventListener('change', () => {
        const next = new Set(selection);
        if (input.checked) next.add(list.index);
        else next.delete(list.index);
        if (isNew) {
          newSelection = next;
          renderLists(scope, true);
        } else local(() => updateExisting(next));
      });
      const title = element('span', list.title || 'Untitled list');
      const membership = list.entries.find((entry) => sameCode(entry.code, item.code));
      if (membership) {
        title.append(' ', element('span', `Prefix: ${membership.prefix}`, { class: 'badge membership-prefix' }));
      }
      label.append(input, title);
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
      details.append(element('summary', `${list.entries.length} products - view details`));
      const entries = element('ul', undefined, { class: 'list-products' });
      list.entries.forEach((entry) => {
        const entryRow = element('li');
        entryRow.append(
          element('span', labels.get(entry.code.toLowerCase()) || entry.code),
          element('code', entry.code),
          ' ',
          element('span', `Prefix: ${entry.prefix}`, { class: 'badge entry-prefix' }),
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
    scope.querySelector('.select-all').disabled = blocked();
    scope.querySelector('.clear').disabled = blocked();
    if (!manager.lists.length) {
      container.append(element('p', 'No recognized filter lists. Load the appropriate POI-filter Rules workbook.', { class: 'empty-lists' }));
    }
    if (focusIndex !== undefined) {
      container.querySelector(`input[data-index="${focusIndex}"]`)?.focus({ preventScroll: true });
    }
  }

  const renderDraftBar = () => {
    const { changed } = manager;
    const count = manager.reviewChanges.length;
    get('.review').disabled = blocked() || !changed.length;
    get('.draft-label').textContent = count ? `${count} unsaved changes` : 'No unsaved changes';
    get('.draft-count').textContent = `${changed.length} of ${SOURCE_PATHS.length} drafts changed · Not published`;
    get('.draft-bar').classList.toggle('has-changes', changed.length > 0);
  };

  render = () => {
    const busy = operation || manager.busy;
    const item = chosen();
    const { changed } = manager;
    root.setAttribute('aria-busy', String(busy));
    root.querySelectorAll('fieldset').forEach((fieldset) => { fieldset.disabled = blocked(); });
    get('.open-add').disabled = blocked();
    get('.open-code-update').disabled = blocked() || !item;
    get('.open-label-update').disabled = blocked() || !(item?.designer || item?.configurator);
    get('.path-clear-btn').hidden = !picker.value && !item;
    get('.path-clear-btn').disabled = blocked();
    get('.product-info .prefix').disabled = blocked();
    get('.reload').disabled = busy;
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
        href: `https://da.live/sheet#/adobecom/da-marketo/${path === CONFIG_PATH ? path : `marketodesigner/${path}`}`,
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
    get('.workspace').hidden = !item;
    get('.empty-state').hidden = !!item;
    if (item) {
      get('.product-title').textContent = item.label;
      get('.product-code').textContent = item.code;
      get('.product-code').hidden = item.designer || item.configurator;
      get('.product-state').hidden = !item.isNew;
      renderCatalogs(item);
      renderLists(existingScope);
    }
    if (proposed && !newScope.hidden) renderLists(newScope, true);
    renderDraftBar();
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

  const showReview = () => {
    if (blocked() || !applyLabels()) return;
    if (chosen()) picker.value = chosen().label;
    render();
    if (!manager.changed.length) return;
    get('.review-content').hidden = false;
    saveResult.hidden = true;
    review.querySelector('.eyebrow').hidden = false;
    review.querySelector('h2').textContent = 'Review your changes';
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
  };

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
    if (blocked() || !selectProduct()) return;
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
  const closeLabelUpdate = () => {
    labelUpdate.close();
    labelUpdate.querySelector('.label-editors').replaceChildren();
  };
  get('.open-label-update').addEventListener('click', () => {
    if (blocked() || !chosen()) return;
    renderLabelEditors(chosen());
    closePicker();
    labelUpdate.showModal();
    labelUpdate.querySelector('input')?.focus();
  });
  labelUpdate.addEventListener('cancel', () => {
    labelUpdate.querySelector('.label-editors').replaceChildren();
  });
  get('.cancel-label-update').addEventListener('click', closeLabelUpdate);
  get('.apply-label-update').addEventListener('click', () => {
    if (blocked() || !labelUpdate.open || !applyLabels()) return;
    closeLabelUpdate();
    message = 'Label updates and duplicate merges added to your local draft.';
    picker.value = chosen()?.label || '';
    render();
  });
  get('.open-code-update').addEventListener('click', () => {
    if (blocked() || !chosen()) return;
    render();
    const form = codeUpdate.querySelector('form');
    codeUpdate.querySelector('.current-code').textContent = chosen().code;
    form.elements.code.value = chosen().code;
    form.elements.code.removeAttribute('aria-invalid');
    form.querySelector('.form-error').textContent = '';
    closePicker();
    codeUpdate.showModal();
    form.elements.code.focus();
    form.elements.code.select();
  });
  get('.cancel-code-update').addEventListener('click', () => codeUpdate.close());
  codeUpdate.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (blocked() || !chosen()) return;
    const form = event.currentTarget;
    form.elements.code.removeAttribute('aria-invalid');
    form.querySelector('.form-error').textContent = '';
    try {
      const code = manager.renameCode(chosen().code, form.elements.code.value);
      codeUpdate.close();
      message = 'Backend code updated in your local draft across both catalogs and filter lists.';
      selectProduct(manager.products.find((item) => sameCode(item.code, code)));
    } catch (error) {
      showError(error, form.querySelector('.form-error'));
      form.elements.code.setAttribute('aria-invalid', 'true');
      form.elements.code.focus();
    }
  });
  get('.add').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
    form.querySelector('.form-error').textContent = '';
    try {
      proposed = manager.validateAddition(form.elements.label.value, form.elements.code.value);
      const catalogs = newCatalogs();
      if (!catalogs.length) throw new Error('Choose at least one catalog.');
      proposed.designer = catalogs.includes('designer');
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
      const catalogs = newCatalogs();
      const code = manager.add(get('.add').elements.label.value, get('.add').elements.code.value, catalogs);
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
  function showNextSteps(paths) {
    const list = saveResult.querySelector('.next-steps');
    list.replaceChildren();
    if (paths.includes(CONFIG_PATH)) {
      const step = element('li');
      step.append('Publish the ', element('a', 'Configurator options', {
        href: `https://da.live/sheet#/adobecom/da-marketo/${CONFIG_PATH}`,
        target: '_blank',
        rel: 'noopener',
      }), ' sheet.');
      list.append(step);
    }
    if (paths.some((path) => path !== CONFIG_PATH)) {
      list.append(element('li', 'Update the stage form in Marketo Designer to apply the POI list/value changes.'));
    }
    list.hidden = !list.childElementCount;
  }

  bindMemberships(existingScope);
  bindMemberships(newScope, true);
  get('.review').addEventListener('click', showReview);
  review.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (blocked() || get('.review-content').hidden) return;
    const confirmed = event.submitter?.value === 'save';
    if (confirmed) {
      get('.review-content').hidden = true;
      review.querySelector('.eyebrow').hidden = true;
      review.querySelector('h2').textContent = 'Saving drafts';
      saveResult.hidden = false;
      const progress = saveResult.querySelector('.save-progress');
      progress.hidden = false;
      progress.textContent = 'Checking source drafts before saving...';
      saveResult.querySelector('.save-error').hidden = true;
      saveResult.querySelector('.next-steps').hidden = true;
      saveResult.querySelector('.next-steps-note').hidden = true;
      saveResult.querySelector('form').hidden = true;
      review.querySelector('h2').focus();
      run(async () => {
        try {
          const paths = await manager.save((path, phase) => {
            message = `${phase} ${SOURCES[path].toLowerCase()}...`;
            get('.status').textContent = message;
            progress.textContent = message;
          });
          showNextSteps(paths);
          review.querySelector('h2').textContent = 'Drafts saved';
          progress.textContent = 'Your changes were saved and verified. Next steps:';
          saveResult.querySelector('.next-steps-note').hidden = false;
          return `Verified saves: ${paths.map((path) => SOURCES[path]).join(', ')}. Drafts saved; nothing published.`;
        } catch (error) {
          review.querySelector('h2').textContent = 'Save needs attention';
          progress.hidden = true;
          showError(error, saveResult.querySelector('.save-error'));
          throw error;
        } finally {
          saveResult.querySelector('form').hidden = false;
          saveResult.querySelector('button').focus();
        }
      }, 'Checking source drafts before saving...');
    } else {
      review.close();
      get('.product-title').focus();
    }
  });
  review.addEventListener('cancel', (event) => {
    if (operation || manager.busy) event.preventDefault();
  });

  async function reload() {
    if ((manager.changed.length || manager.reloadRequired || pendingLabels())
      // eslint-disable-next-line no-alert
      && !window.confirm('Discard local drafts and reload all source data?')) return;
    await run(async () => {
      await manager.load();
      closeLabelUpdate();
      review.close();
      selected = undefined;
      picker.value = '';
      get('.catalog-labels').replaceChildren();
      delete get('.catalog-labels').dataset.code;
      return '';
    }, 'Loading source drafts...');
    if (blocked()) return;
    let code;
    try {
      code = window.sessionStorage.getItem(ACTIVE_POI_KEY);
    } catch {
      return;
    }
    if (code !== null) {
      selectProduct(manager.products.find((item) => sameCode(item.code, code)));
    }
  }
  get('.reload').addEventListener('click', reload);
  const beforeUnload = (event) => {
    const form = get('.add');
    const creating = creation.open && (form.elements.label.value || form.elements.code.value);
    const changingCode = codeUpdate.open
      && codeUpdate.querySelector('[name="code"]').value !== codeUpdate.querySelector('.current-code').textContent;
    if (manager.changed.length || manager.busy || operation || creating || changingCode
      || pendingLabels()) {
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
      if (codeUpdate.open) codeUpdate.close();
      if (labelUpdate.open) labelUpdate.close();
      if (review.open) review.close();
      root.replaceChildren();
    },
  };
}
