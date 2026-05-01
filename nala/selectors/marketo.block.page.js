import { expect } from '@playwright/test';

function expectedMarketoLibsOrigin(branch) {
  if (!branch || !/^[a-zA-Z0-9_-]+$/.test(branch)) return null;
  if (branch === 'local') return null;
  if (branch === 'main') return 'https://main--da-marketo--adobecom.aem.live';
  return branch.includes('--')
    ? `https://${branch}.aem.live`
    : `https://${branch}--da-marketo--adobecom.aem.live`;
}

export default class MarketoBlock {
  constructor(page) {
    this.page = page;
    this.marketo = page.locator('.marketo');

    // -------------------------------------------------------------------------
    // Form fields – Essential (short / flex_content)
    // -------------------------------------------------------------------------
    this.firstName = this.marketo.locator('input[name="FirstName"]');
    this.lastName = this.marketo.locator('input[name="LastName"]');
    this.email = this.marketo.locator('input[name="Email"]');
    this.company = this.marketo.locator('input[name="mktoFormsCompany"]');
    this.country = this.marketo.locator('select[name="Country"]');

    // -------------------------------------------------------------------------
    // Form fields – Expanded (medium / flex_event)
    // -------------------------------------------------------------------------
    this.jobTitle = this.marketo.locator('select[name="mktoFormsJobTitle"]');
    this.functionalArea = this.marketo.locator('select[name="mktoFormsFunctionalArea"]');

    // -------------------------------------------------------------------------
    // Form fields – Full (RFI / flex_contact)
    // -------------------------------------------------------------------------
    this.phone = this.marketo.locator('input[name="Phone"]');
    this.state = this.marketo.locator('select[name="State"]');
    this.postalCode = this.marketo.locator('input[name="PostalCode"]');
    this.primaryProductInterest = this.marketo.locator('select[name="mktoFormsPrimaryProductInterest"]');

    // -------------------------------------------------------------------------
    // UI elements
    // -------------------------------------------------------------------------
    this.formEl = this.marketo.locator('form');
    this.submitButton = this.marketo.locator('#mktoButton_new');
    this.nextButton = this.marketo.locator('#mktoButton_next');
    this.backButton = this.marketo.locator('.back-btn');
    this.stepIndicator = this.marketo.locator('.step-details .step');
    this.message = this.marketo.locator('.ty-message');
    this.title = this.marketo.locator('.marketo-title');
    this.description = this.marketo.locator('.marketo-description');
    this.errorMessage = this.marketo.locator('.msg-error > .mktoVisible > div > div > div > div.mktoHtmlText');
    this.postSubmissionContent = page.getByText('shown post form submission');
    this.preSubmissionContent = page.getByText('hide post form submission');

    // -------------------------------------------------------------------------
    // Field map – enables dynamic field access by name
    // -------------------------------------------------------------------------
    this.fieldMap = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      company: this.company,
      country: this.country,
      jobTitle: this.jobTitle,
      functionalArea: this.functionalArea,
      phone: this.phone,
      state: this.state,
      postalCode: this.postalCode,
      primaryProductInterest: this.primaryProductInterest,
    };
  }

  async navigateTo(testPage) {
    const marketoLibsBranch = new URL(testPage).searchParams.get('marketolibs');
    const expectedOrigin = expectedMarketoLibsOrigin(marketoLibsBranch);

    await this.page.goto(testPage, { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(testPage);
    // Scroll the marketo block into view — on mobile the form is often below
    // the fold and won't render until it enters the viewport.
    await this.marketo.scrollIntoViewIfNeeded();
    // Form is ready once the email input is visible AND accepting input.
    // `toBeEnabled` guards against a brief window where MktoForms2 has
    // painted but not yet wired event listeners.
    await expect(this.email).toBeVisible({ timeout: 20000 });
    await expect(this.email).toBeEnabled();

    if (expectedOrigin) {
      // Milo's loadScript() appends <script src="..."> elements to document.head
      // synchronously — they persist in the DOM. Querying them is reliable on all
      // browsers, unlike performance.getEntriesByType() (cross-origin entries
      // omitted on mobile WebKit) or page.on('request') (misses dynamic import()
      // on WebKit and Firefox).
      await this.page.waitForFunction(
        () => !!document.querySelector('head > script[src*="/mkto/"]'),
        { timeout: 10000 },
      );

      const formCodeUrls = await this.page.evaluate(() => Array.from(
        document.querySelectorAll('head > script[src]'),
      ).map((s) => s.src).filter((url) => /\/mkto\/|\/blocks\/da-marketo\//.test(url)));

      expect(
        formCodeUrls,
        `?marketolibs=${marketoLibsBranch} set but no marketo form code requests were captured`,
      ).not.toHaveLength(0);
      const wrongOrigin = formCodeUrls.filter((u) => !u.startsWith(expectedOrigin));
      expect(
        wrongOrigin,
        `expected marketo form code from ${expectedOrigin}, but these came from elsewhere: ${wrongOrigin.join(', ')}`,
      ).toHaveLength(0);
    }
  }

  /**
   * Returns the Marketo form template identifier from the page.
   * Returns 'unknown' if the template cannot be determined.
   * @returns {Promise<string>} e.g. 'flex_contact', 'flex_event', 'unknown'
   */
  async getFormTemplate() {
    const template = await this.page.evaluate(
      () => window.mcz_marketoForm_pref?.form?.template,
    );
    return template || 'unknown';
  }

  // ---------------------------------------------------------------------------
  // Multi-step helpers
  // ---------------------------------------------------------------------------

  async isMultiStep() {
    return this.marketo.evaluate((el) => el.classList.contains('multi-step'));
  }

  async getTotalSteps() {
    return this.marketo.evaluate((el) => {
      const match = el.className.match(/\bmulti-(\d+)\b/);
      return match ? parseInt(match[1], 10) : null;
    });
  }

  async getCurrentStep() {
    const raw = await this.formEl.getAttribute('data-step');
    return parseInt(raw, 10) || 1;
  }

  /**
   * Waits for the step transition AND the block's post-step auto-focus
   * setTimeout. Without this, a subsequent `.fill()` can race the handler
   * and produce concatenated values on WebKit/Firefox.
   */
  async waitForStepTransition(direction, fromStep) {
    await this.page.waitForFunction(
      ({ dir, prev }) => {
        const form = document.querySelector('.marketo form');
        if (!form) return false;
        const now = parseInt(form.dataset.step, 10);
        const advanced = dir === 'next' ? now > prev : now < prev;
        if (!advanced) return false;
        // The block's auto-focus uses this exact selector — mirror it to
        // detect that the setTimeout has run and focus has landed.
        const expected = form.querySelector(
          `.mktoFormRowTop[data-validate="${now}"]:not(.mktoHidden) input`,
        );
        return !!expected && document.activeElement === expected;
      },
      { dir: direction, prev: fromStep },
      { timeout: 5000 },
    );
  }

  async clickNext() {
    const current = await this.getCurrentStep();
    await this.nextButton.click();
    await this.waitForStepTransition('next', current);
  }

  async clickBack() {
    const current = await this.getCurrentStep();
    await this.backButton.click();
    await this.waitForStepTransition('back', current);
  }

  async checkMultiStepValidation() {
    // Multi-step signals validation via `show-warnings` on the form,
    // not the single-step error banner.
    await expect(this.formEl).toHaveClass(/show-warnings/);
    await expect(this.errorMessage).toHaveText('This field is required..');
  }

  async fillPersonalDetails(data) {
    const { firstName, lastName, phone } = data;
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.phone.fill(phone);
    await this.jobTitle.selectOption({ index: 1 });
    await this.functionalArea.selectOption({ index: 1 });
  }

  async fillCompanyDetails(data) {
    const { company, postalCode } = data;
    await this.company.click();
    await this.company.fill(company);
    await this.postalCode.fill(postalCode);
    await this.primaryProductInterest.selectOption({ index: 2 });
    // State dropdown is conditional on country; skip if it doesn't appear within 2s.
    try {
      await this.state.waitFor({ state: 'visible', timeout: 2000 });
      await this.state.selectOption({ index: 1 });
    } catch { /* state not shown for this country */ }
  }

  async fillMultiStepStep(stepNum, data) {
    if (stepNum === 1) {
      await this.country.selectOption({ index: 1 });
      await this.email.fill(data.email);
      return;
    }
    const totalSteps = await this.getTotalSteps();
    if (totalSteps === 3) {
      if (stepNum === 2) await this.fillPersonalDetails(data);
      if (stepNum === 3) await this.fillCompanyDetails(data);
    } else {
      await this.fillPersonalDetails(data);
      await this.fillCompanyDetails(data);
    }
  }

  // ---------------------------------------------------------------------------
  // Form fill methods — composition pattern
  // Each method builds on the previous to avoid duplicating field interactions.
  // ---------------------------------------------------------------------------

  /**
   * Fills the Essential (short) form fields shared by all form types.
   * @param {{ firstName: string, lastName: string, email: string, company: string }} data
   */
  async fillEssentialForm(data) {
    const { firstName, lastName, email, company } = data;
    await this.country.selectOption({ index: 1 });
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.email.fill(email);
    await this.company.click();
    await this.company.fill(company);
  }

  /**
   * Fills the Expanded (medium) form fields, building on the Essential form.
   * @param {{ firstName: string, lastName: string, email: string, company: string }} data
   */
  async fillExpandedForm(data) {
    await this.fillEssentialForm(data);
    await this.jobTitle.selectOption({ index: 1 });
    await this.functionalArea.selectOption({ index: 1 });
  }

  /**
   * Fills the Full (RFI/contact) form fields, building on the Expanded form.
   * @param {{ firstName: string, lastName: string, email: string, company: string,
   *           phone: string, postalCode: string }} data
   */
  async fillFullForm(data) {
    const { phone, postalCode } = data;
    await this.fillExpandedForm(data);
    await this.phone.fill(phone);
    await this.postalCode.fill(postalCode);
    // index 0 is the blank "Select..." placeholder, index 1 is typically "None" —
    // use index 2 to guarantee a real product value is selected
    await this.primaryProductInterest.selectOption({ index: 2 });
    // State only renders for certain countries — interact only if visible
    await this.state.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
    if (await this.state.isVisible()) {
      await this.state.selectOption({ index: 1 });
    }
  }

  /**
   * Fills and submits the form for the given form type using the provided test data.
   * @param {'full'|'expanded'|'essential'} formType
   * @param {{ firstName: string, lastName: string, email: string, company: string,
   *           phone: string, postalCode: string }} data
   */
  async submitForm(formType, data) {
    if (formType === 'full') {
      await this.fillFullForm(data);
    } else if (formType === 'expanded') {
      await this.fillExpandedForm(data);
    } else {
      await this.fillEssentialForm(data);
    }
    await this.submitButton.click();
  }

  /**
   * Asserts that all visible text input fields have a non-empty placeholder.
   */
  async checkInputPlaceholders() {
    const template = await this.getFormTemplate();
    const fieldNames = ['firstName', 'lastName', 'email', 'company'];

    if (template === 'flex_contact') {
      fieldNames.push('phone', 'postalCode');
    }

    await Promise.all(fieldNames.map(async (name) => {
      await expect(this.fieldMap[name]).toHaveAttribute('placeholder', /.+/);
    }));
  }

  /**
   * Asserts that required fields display error styling and the error message
   * is visible after an empty form submission attempt.
   */
  async checkForErrorMessages() {
    // Blur the focused field so error styles are applied consistently —
    // the browser focuses the first invalid field on failed submission,
    // which suppresses its error border styling.
    await this.page.evaluate(() => document.activeElement?.blur());

    const template = await this.getFormTemplate();
    const fieldNames = ['firstName', 'lastName', 'email', 'company', 'country'];

    if (template === 'flex_contact') {
      fieldNames.push('phone', 'postalCode', 'jobTitle', 'functionalArea');
      fieldNames.push('primaryProductInterest');
    } else if (template === 'flex_event') {
      fieldNames.push('jobTitle', 'functionalArea');
    }

    // Check for the mktoInvalid class — browser-agnostic and more reliable
    // than CSS color checks which vary across browsers.
    await Promise.all(fieldNames.map(async (name) => {
      await expect(this.fieldMap[name]).toHaveClass(/mktoInvalid/);
    }));

    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText('This field is required..');
  }

  /**
   * Returns all form elements for the given form type,
   * used to assert they are hidden after message-type form submission.
   * Synchronous — uses the formType already known from the spec rather than
   * evaluating the page to discover the template at runtime.
   * @param {'full'|'expanded'|'essential'} formType
   */
  getFormElements(formType) {
    const fieldNames = ['firstName', 'lastName', 'email', 'company', 'country'];

    if (formType === 'full') {
      // State omitted — it renders conditionally based on country selection
      fieldNames.push('phone', 'jobTitle', 'functionalArea', 'postalCode');
      fieldNames.push('primaryProductInterest');
    } else if (formType === 'expanded') {
      fieldNames.push('jobTitle', 'functionalArea');
    }

    return [
      ...fieldNames.map((name) => this.fieldMap[name]),
      this.submitButton, this.title, this.description,
    ];
  }
}
