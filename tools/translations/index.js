/* eslint-disable import/no-unresolved */
import DA_SDK from 'da-sdk';
import { initIms } from 'da-fetch';
import { LitElement, html, nothing } from 'da-lit';
import {
  FIELDS, LANGUAGES, validateLangCode, normalizeCell,
  countTranslated, addLanguageColumn, checkExportReady, composeExportColumn,
} from './translations-core.js';
import { readFieldSheet, saveFieldSheet } from './da-sheets.js';

await DA_SDK;

class MktoTranslations extends LitElement {
  static properties = {
    field: { state: true },
    rows: { state: true },
    target: { state: true }, // target language code
    status: { state: true },
    langs: { state: true }, // languages present in the loaded sheet
  };

  // Render into light DOM so nexter.css / index.css apply.
  createRenderRoot() { return this; }

  constructor() {
    super();
    this.field = null;
    this.rows = [];
    this.target = '';
    this.status = '';
    this.langs = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    await initIms();
  }

  async loadField(fieldDef) {
    this.status = `Loading ${fieldDef.label}…`;
    const rows = await readFieldSheet(fieldDef.path);
    if (!rows) { this.status = `Could not load ${fieldDef.label}.`; return; }
    this.field = fieldDef;
    this.rows = rows;
    this.target = '';
    this.langs = LANGUAGES.filter((l) => rows.some((r) => l in r));
    this.status = '';
  }

  addLanguage() {
    const input = this.querySelector('#new-lang').value;
    const res = validateLangCode(input, this.langs);
    if (!res.ok) { this.status = res.error; return; }
    this.rows = addLanguageColumn(this.rows, res.code);
    this.langs = [...this.langs, res.code];
    this.target = res.code;
    this.querySelector('#new-lang').value = '';
    this.status = `Added "${res.code}". Fill every row before exporting.`;
  }

  editCell(rowIndex, raw) {
    const row = this.rows[rowIndex];
    const { value, valid } = normalizeCell(raw, row.value);
    const next = [...this.rows];
    next[rowIndex] = { ...row, [this.target]: value };
    this.rows = next;
    if (!valid) this.status = `Row "${row.value}": stray "|" — enter the label only.`;
  }

  async save() {
    this.status = 'Saving…';
    const ok = await saveFieldSheet(this.field.path, this.rows);
    this.status = ok ? 'Saved.' : 'Save failed.';
  }

  async export() {
    const gate = checkExportReady(this.rows, this.target);
    if (!gate.ready) {
      this.status = `Cannot export: ${gate.blanks} blank, ${gate.invalids} invalid cell(s).`;
      return;
    }
    const text = composeExportColumn(this.rows, this.target);
    await navigator.clipboard.writeText(text);
    this.status = `Copied ${this.rows.length} rows for "${this.target}" to clipboard.`;
  }

  renderPicker() {
    return html`<div class="picker">
      ${FIELDS.map((f) => html`<button @click=${() => this.loadField(f)}>${f.label}</button>`)}
    </div>`;
  }

  renderToolbar() {
    const progress = this.target ? countTranslated(this.rows, this.target) : null;
    return html`<div class="toolbar">
      <input id="new-lang" placeholder="new code e.g. ar" aria-label="New language code" />
      <button @click=${() => this.addLanguage()}>Add language</button>
      <select @change=${(e) => { this.target = e.target.value; }} aria-label="Language to edit">
        <option value="">— edit language —</option>
        ${this.langs.map((l) => html`<option value=${l} ?selected=${l === this.target}>${l}</option>`)}
      </select>
      <button @click=${() => this.save()} ?disabled=${!this.rows.length}>Save</button>
      <button @click=${() => this.export()} ?disabled=${!this.target}>Export column</button>
      ${progress ? html`<span class="progress">${progress.done}/${progress.total} translated</span>` : nothing}
    </div>`;
  }

  renderGrid() {
    return html`<div class="grid-wrap"><table class="grid">
      <thead><tr>
        <th class="sticky">label</th>
        <th>value</th>
        ${this.langs.map((l) => html`<th class=${l === this.target ? 'target' : ''}>${l}</th>`)}
      </tr></thead>
      <tbody>
        ${this.rows.map((r, i) => html`<tr>
          <td class="sticky">${r.label}</td>
          <td>${r.value}</td>
          ${this.langs.map((l) => (l === this.target
    ? html`<td class="target"><input .value=${r[l] ?? ''}
        @change=${(e) => this.editCell(i, e.target.value)} /></td>`
    : html`<td>${r[l] ?? ''}</td>`))}
        </tr>`)}
      </tbody>
    </table></div>`;
  }

  render() {
    return html`
      <h1>Marketo Select-List Translations</h1>
      ${this.renderPicker()}
      ${this.status ? html`<p class="status">${this.status}</p>` : nothing}
      ${this.field ? html`<h2>${this.field.label}</h2>${this.renderToolbar()}${this.renderGrid()}` : nothing}
    `;
  }
}

customElements.define('mkto-translations', MktoTranslations);
