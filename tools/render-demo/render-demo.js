/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-unresolved */
import getStyle from 'styles';
import { LitElement, html } from 'da-lit';
import { STRINGS, getString } from './config/strings.js';
import { DEFAULT_RENDER_CONFIG, PRESETS, getConfigForTemplate } from './config/presets.js';
import * as engine from './engine/index.js';

const style = await getStyle(import.meta.url.split('?')[0]);

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
];

const TEMPLATES = [
  { value: 'flex_contact', labelKey: 'templateFlexContact' },
  { value: 'flex_event', labelKey: 'templateFlexEvent' },
  { value: 'flex_content', labelKey: 'templateFlexContent' },
];

const SUBTYPE_OPTIONS = [
  { value: 'request_for_information', labelKey: 'subtypeRequestForInformation' },
  { value: 'strategy_webinar', labelKey: 'subtypeStrategyWebinar' },
  { value: 'whitepaper_form', labelKey: 'subtypeWhitepaperForm' },
];

const MODULE_KEYS = ['multiStep', 'progressiveProfiling', 'companyEnrichment', 'privacyByCountry', 'conditionalVisibility'];

const KNOWN_USER_STORAGE_PREFIX = 'form_demo_known_';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class FormEngineDemo extends LitElement {
  static styles = style;

  static properties = {
    locale: { type: String },
    formLanguage: { type: String },
    showFullModuleCode: { type: Boolean },
    modulesEnabled: { type: Object },
    currentConfig: { type: Object },
    delayMs: { type: Number },
    presetId: { type: String },
    engineState: { type: Object },
    eventLog: { type: Array },
  };

  constructor() {
    super();
    this.locale = 'en';
    this.formLanguage = 'en';
    this.showFullModuleCode = true;
    this.modulesEnabled = Object.fromEntries(MODULE_KEYS.map((k) => [k, true]));
    this.currentConfig = deepClone(DEFAULT_RENDER_CONFIG);
    this.delayMs = 500;
    this.presetId = '';
    this.engineState = null;
    this.eventLog = [];
    this._engineHasRunOnce = false;
  }

  firstUpdated() {
    engine.onStateChange((state) => {
      if (state && typeof state === 'object' && state.type !== 'event') {
        this.engineState = state;
      }
      this.eventLog = engine.getEventLog();
      this.requestUpdate();
    });
    engine.onEvent(() => {
      this.eventLog = engine.getEventLog();
      this.requestUpdate();
    });
    this.runEngine();
    this._engineHasRunOnce = true;
  }

  onCopySnapshot() {
    const snap = engine.getStateSnapshot();
    if (!snap) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(snap, null, 2));
    } catch (e) {
      // ignore
    }
  }

  onCopyLog() {
    const log = engine.getEventLog();
    try {
      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    } catch (e) {
      // ignore
    }
  }

  onResetForm() {
    engine.reset();
    this.runEngine();
  }

  updated(changedProperties) {
    const configRelated = changedProperties.has('currentConfig') || changedProperties.has('locale') || changedProperties.has('formLanguage') || changedProperties.has('modulesEnabled') || changedProperties.has('delayMs');
    if (this._engineHasRunOnce && configRelated) {
      this.runEngine();
    }
  }

  async runEngine() {
    const container = this.shadowRoot?.querySelector('.form-demo-preview-inner');
    if (!container || !this.currentConfig) return;
    const cfg = this.currentConfig;
    const features = cfg.features || {};
    const effectiveFeatures = Object.fromEntries(
      MODULE_KEYS.map((k) => [k, !!(features[k] && this.modulesEnabled?.[k])]),
    );
    const effectiveConfig = { ...cfg, features: { ...features, ...effectiveFeatures } };
    await engine.run(effectiveConfig, {
      delayMs: Number(this.delayMs) || 0,
      container,
      locale: this.formLanguage,
    });
  }

  onLocaleChange(e) {
    this.locale = e.target?.value || 'en';
  }

  onFormLanguageChange(e) {
    this.formLanguage = e.target?.value || 'en';
  }

  onShowFullModuleCodeChange(e) {
    this.showFullModuleCode = e.target?.checked ?? true;
  }

  onModuleEnabledChange(moduleKey, e) {
    const checked = e.target?.checked ?? true;
    this.modulesEnabled = { ...this.modulesEnabled, [moduleKey]: checked };
  }

  onTemplateChange(e) {
    this.presetId = '';
    const template = e.target.value;
    const templateConfig = getConfigForTemplate(template);
    this.currentConfig = {
      ...templateConfig,
      features: this.currentConfig?.features || templateConfig.features,
      success: this.currentConfig?.success || templateConfig.success,
    };
  }

  onSubtypeChange(e) {
    this.presetId = '';
    this.currentConfig = { ...this.currentConfig, subtype: e.target?.value || '' };
  }

  onFeatureChange(feature, e) {
    this.presetId = '';
    const checked = e.target?.checked ?? false;
    this.currentConfig = {
      ...this.currentConfig,
      features: { ...this.currentConfig.features, [feature]: checked },
    };
  }

  onSuccessTypeChange(e) {
    this.presetId = '';
    this.currentConfig = {
      ...this.currentConfig,
      success: { ...this.currentConfig.success, type: e.target.value },
    };
  }

  onSuccessContentChange(e) {
    this.presetId = '';
    this.currentConfig = {
      ...this.currentConfig,
      success: { ...this.currentConfig.success, content: e.target.value },
    };
  }

  onDelayChange(e) {
    const seconds = Number(e.target?.value) || 0;
    this.delayMs = Math.min(3000, Math.max(0, Math.round(seconds * 1000)));
  }

  onPresetChange(e) {
    const id = e.target?.value || '';
    this.presetId = id;
    if (id) {
      const preset = PRESETS.find((p) => p.id === id);
      if (preset) this.currentConfig = deepClone(preset.config);
    } else {
      this.currentConfig = deepClone(DEFAULT_RENDER_CONFIG);
    }
  }

  onResetKnownUser() {
    try {
      localStorage.removeItem(`${KNOWN_USER_STORAGE_PREFIX}${this.currentConfig?.formId || 'demo-2277'}`);
    } catch (e) {
      // ignore
    }
    this.runEngine();
  }

  render() {
    const s = (key) => getString(this.locale, key);
    const cfg = this.currentConfig || DEFAULT_RENDER_CONFIG;
    const features = cfg.features || {};

    return html`
      <div class="form-engine-demo">
        <div class="form-demo-main-row">
        <section class="form-demo-configurator" aria-label="${s('configuratorTitle')}">
          <h2 class="form-demo-configurator-title">${s('configuratorTitle')}</h2>

          <div class="form-demo-control">
            <label for="form-demo-locale-select" class="form-demo-label">${s('locale')}</label>
            <select id="form-demo-locale-select" class="form-demo-locale-select" .value=${this.locale} @change=${this.onLocaleChange}>
              ${LOCALES.map((loc) => html`<option value="${loc.value}">${loc.label}</option>`)}
            </select>
          </div>

          <div class="form-demo-control">
            <label for="form-demo-preset-select" class="form-demo-label">${s('preset')}</label>
            <select id="form-demo-preset-select" class="form-demo-preset-select" .value=${this.presetId} @change=${this.onPresetChange}>
              <option value="">—</option>
              ${PRESETS.map((p) => html`<option value="${p.id}">${s(p.labelKey)}</option>`)}
            </select>
          </div>

          <div class="form-demo-control">
            <label for="form-demo-template-select" class="form-demo-label">${s('template')}</label>
            <select id="form-demo-template-select" class="form-demo-template-select" .value=${cfg.template} @change=${this.onTemplateChange}>
              ${TEMPLATES.map((t) => html`<option value="${t.value}">${s(t.labelKey)}</option>`)}
            </select>
          </div>

          <div class="form-demo-control">
            <label for="form-demo-subtype" class="form-demo-label">${s('subtype')}</label>
            <select id="form-demo-subtype" class="form-demo-template-select" .value=${cfg.subtype || ''} @change=${this.onSubtypeChange}>
              ${SUBTYPE_OPTIONS.map((opt) => html`<option value="${opt.value}">${s(opt.labelKey)}</option>`)}
            </select>
          </div>

          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${features.multiStep} @change=${(e) => this.onFeatureChange('multiStep', e)} />
              ${s('multiStep')}
            </label>
          </div>
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${features.progressiveProfiling} @change=${(e) => this.onFeatureChange('progressiveProfiling', e)} />
              ${s('progressiveProfiling')}
            </label>
          </div>
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${features.companyEnrichment} @change=${(e) => this.onFeatureChange('companyEnrichment', e)} />
              ${s('companyEnrichment')}
            </label>
          </div>
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${features.privacyByCountry} @change=${(e) => this.onFeatureChange('privacyByCountry', e)} />
              ${s('privacyByCountry')}
            </label>
          </div>
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${features.conditionalVisibility} @change=${(e) => this.onFeatureChange('conditionalVisibility', e)} />
              ${s('conditionalVisibility')}
            </label>
          </div>

          <div class="form-demo-control">
            <label for="form-demo-success-type" class="form-demo-label">${s('successType')}</label>
            <select id="form-demo-success-type" class="form-demo-success-select" .value=${cfg.success?.type} @change=${this.onSuccessTypeChange}>
              <option value="message">${s('successTypeMessage')}</option>
              <option value="redirect">${s('successTypeRedirect')}</option>
            </select>
          </div>
          <div class="form-demo-control">
            <label for="form-demo-success-content" class="form-demo-label">${s('successContent')}</label>
            <input id="form-demo-success-content" class="form-demo-input" type="text" .value=${cfg.success?.content || ''} @input=${this.onSuccessContentChange} placeholder="${cfg.success?.type === 'redirect' ? 'https://...' : s('successThankYou')}" />
          </div>

        </section>

        <section class="form-demo-preview" aria-label="${s('formPreviewTitle')}">
          <div class="form-demo-preview-inner"></div>
        </section>

        <section class="form-demo-actions" aria-label="${s('resetActionsTitle')}">
          <div class="form-demo-control">
            <label for="form-demo-form-language-select" class="form-demo-label">${s('formLanguage')}</label>
            <select id="form-demo-form-language-select" class="form-demo-locale-select" .value=${this.formLanguage} @change=${this.onFormLanguageChange}>
              ${LOCALES.map((loc) => html`<option value="${loc.value}">${loc.label}</option>`)}
            </select>
          </div>
          ${MODULE_KEYS.map((key) => html`
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${this.modulesEnabled?.[key]} @change=${(e) => this.onModuleEnabledChange(key, e)} />
              ${s(`runModule${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            </label>
          </div>
          `)}
          <div class="form-demo-control form-demo-control-row">
            <label class="form-demo-checkbox-label">
              <input type="checkbox" ?checked=${this.showFullModuleCode} @change=${this.onShowFullModuleCodeChange} />
              ${s('showFullModuleCode')}
            </label>
          </div>
          <div class="form-demo-control">
            <label for="form-demo-delay" class="form-demo-label">${s('artificialDelay')}</label>
            <input id="form-demo-delay" class="form-demo-input form-demo-input-number" type="number" min="0" max="3" step="0.5" .value=${(this.delayMs / 1000)} @input=${this.onDelayChange} />
          </div>
          <div class="form-demo-control">
            <button type="button" class="form-demo-button" @click=${this.onResetKnownUser}>${s('resetKnownUser')}</button>
          </div>
          <div class="form-demo-control">
            <button type="button" class="form-demo-button" @click=${this.onResetForm}>${s('debugResetForm')}</button>
          </div>
        </section>
        </div>

        <div class="form-demo-debug-row">
          <section class="form-demo-debug-section" aria-label="${s('debugConfig')}">
            <h3 class="form-demo-debug-heading">${s('debugConfig')}</h3>
            ${this.showFullModuleCode ? html`
              <pre class="form-demo-debug-pre">${JSON.stringify(this.currentConfig, null, 2)}</pre>
            ` : html`<p class="form-demo-debug-muted">${s('debugConfigMuted')}</p>`}
          </section>
          <section class="form-demo-debug-section" aria-label="${s('debugState')}">
            <h3 class="form-demo-debug-heading">${s('debugState')}</h3>
            <div class="form-demo-debug-actions">
              <button type="button" class="form-demo-button" @click=${this.onCopySnapshot}>${s('debugCopySnapshot')}</button>
            </div>
            <pre class="form-demo-debug-pre">${this.engineState ? JSON.stringify({ phase: this.engineState.phase, currentStepIndex: this.engineState.formState?.currentStepIndex, effectiveStepsCount: this.engineState.formState?.effectiveSteps?.length, fieldsCount: this.engineState.formState?.fields?.length }, null, 2) : '—'}</pre>
          </section>
          <section class="form-demo-debug-section" aria-label="${s('debugEventLog')}">
            <h3 class="form-demo-debug-heading">${s('debugEventLog')}</h3>
            <div class="form-demo-debug-actions">
              <button type="button" class="form-demo-button" @click=${this.onCopyLog}>${s('debugCopyLog')}</button>
            </div>
            <div class="form-demo-event-log-list">
              ${(this.eventLog || []).slice(-50).reverse().map((entry) => html`
                <div class="form-demo-event-entry">
                  <span class="form-demo-event-time">${new Date(entry.t).toLocaleTimeString()}</span>
                  <span class="form-demo-event-name">${entry.name}</span>
                  ${entry.payload && Object.keys(entry.payload).length ? html`<pre class="form-demo-event-payload">${JSON.stringify(entry.payload)}</pre>` : ''}
                </div>
              `)}
            </div>
          </section>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('form-engine-demo')) {
  customElements.define('form-engine-demo', FormEngineDemo);
}
