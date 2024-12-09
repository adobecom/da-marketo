/* eslint-disable import/no-unresolved */
import { LitElement, html, nothing } from 'https://da.live/nx/deps/lit/lit-core.min.js';
import getStyle from 'https://da.live/nx/utils/styles.js';

const style = await getStyle(import.meta.url);

export default class MarketoManager extends LitElement {
  static properties = { selectedTab: { type: String } };

  constructor() {
    super();
    this.selectedTab = 'page';
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  handleTabClick(tab) {
    this.selectedTab = tab;
  }

  renderPageForm() {
    return html`
      <form>
          <div class="form-row">
              <h2>Page Configuration</h2>
              <p>Update Marketo Page Blocks</p>
              <div class="org-repo-row">
                  <div>
                      <label>Find</label>
                      <input type="text" placeholder="Enter find text" name="term" value="template-1">
                  </div>
                  <div class="replace-pane">
                      <label>Replace</label><input type="text" placeholder="Enter replace text" name="replace"
                          value="template-2">
                  </div>
              </div><label for="urls">By Tree</label>

              <input type="text" name="repo" placeholder="repo" value="/resources">
              <div class="form-row">

                  <label for="urls">By URL</label><textarea id="urls" name="urls" placeholder="Add AEM URLs"></textarea>
              </div>
              <div class="form-row">
                  <input type="submit" class="accent" value="Search">
                  <input type="submit" class="accent" value="Update">
                  <button class="primary">Cancel</button>
              </div>
              <ul class="results">
                  <li>
                      <div class="path">Source</div>
                      <div class="status">Type</div>
                      <div class="link">Link</div>
                  </li>
              </ul>
          </div>
      </form>
    `;
  }

  renderSiteForm() {
    return html`
      <form>
          <div class="form-row">
              <h2>Site Configuration</h2>
              <p>Marketo Sitewide Configuration</p>
              <div class="org-repo-row">
                  <div>
                      <label>Form ID</label>
                      <input type="text" name="org" placeholder="org" value="2277">
                  </div>
                  <div>
                      <label>Munchkin ID</label>
                      <input type="text" name="repo" placeholder="repo" value="360-KCI-804">
                  </div>
                  <div>
                      <label>Marketo Host</label>
                      <input type="text" name="repo" placeholder="repo" value="business.adobe.com">
                  </div>
                  <div>
                      <label>Form Type</label>
                      <input type="text" name="repo" placeholder="repo" value="marketo_form">
                  </div>
              </div>
          </div>
          <div class="form-row">
              <input type="submit" class="accent" value="Update">
          </div>
      </form>
    `;
  }

  renderTemplatesForm() {
    return html`
      <form>
        <div class="form-row">
          <h2>Templates</h2>
          <p>Manage templates here.</p>
          <!-- Add your form fields here -->
        </div>
      </form>
    `;
  }

  render() {
    return html`
    <div class="marketo-manager">
      <div class="da-tablist" role="tablist" aria-label="Dark Alley content">
        <button type="button" role="tab" id="tab-page" aria-selected="${this.selectedTab === 'page'}" aria-controls="tabpanel-page" @click="${() => this.handleTabClick('page')}">
          <span class="focus">Page Configuration</span>
        </button>
        <button type="button" role="tab" id="tab-search" aria-selected="${this.selectedTab === 'site'}" aria-controls="tabpanel-site" @click="${() => this.handleTabClick('site')}">
          <span class="focus">Site Configuration</span>
        </button>
        <button type="button" role="tab" id="tab-templates" aria-selected="${this.selectedTab === 'templates'}" aria-controls="tabpanel-templates" @click="${() => this.handleTabClick('templates')}">
          <span class="focus">Templates</span>
        </button>
      </div>
      <h1>Marketo Manager</h1>
      ${this.selectedTab === 'page' ? this.renderPageForm() : nothing}
      ${this.selectedTab === 'site' ? this.renderSiteForm() : nothing}
      ${this.selectedTab === 'templates' ? this.renderTemplatesForm() : nothing}
    </div>
    `;
  }
}

customElements.define('da-marketo-manager', MarketoManager);
