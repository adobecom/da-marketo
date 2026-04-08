import { expect, test } from '@playwright/test';
import features from '../features/marketo.block.spec.js';
import MarketoBlock from '../selectors/marketo.block.page.js';
import TEST_DATA from '../utils/marketo.test.data.js';

const miloLibs = process.env.MILO_LIBS || '';
const buildTestUrl = (baseURL, path) => `${baseURL}${path}${miloLibs}`.toLowerCase();

test.describe('Marketo block test suite', () => {
  let marketoBlock;

  test.beforeAll(async () => {
    if (process.env.CI) test.setTimeout(1000 * 60 * 3);
  });

  test.beforeEach(async ({ page }) => {
    marketoBlock = new MarketoBlock(page);
  });

  // -------------------------------------------------------------------------
  // Redirect tests: verify URL changes to ?submissionid after submission
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'redirect').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ page, baseURL }, testInfo) => {
        const testPage = buildTestUrl(baseURL, path);
        const testData = { ...TEST_DATA, email: `test+w${testInfo.workerIndex}t${feature.tcid}@adobetest.com` };
        console.info(`[Test Page]: ${testPage}`);

        await test.step('step-1: Navigate to the test page', async () => {
          await marketoBlock.navigateTo(testPage);
        });

        await test.step('step-2: Verify input field placeholders', async () => {
          await marketoBlock.checkInputPlaceholders();
        });

        await test.step('step-3: Verify error messages on empty submit', async () => {
          await marketoBlock.submitButton.click();
          await marketoBlock.checkForErrorMessages();
        });

        await test.step('step-4: Submit the form with valid inputs', async () => {
          await marketoBlock.submitForm(feature.formType, testData);
        });

        await test.step('step-5: Verify redirect after submission', async () => {
          await expect(page).toHaveURL(/\?submissionid/, { timeout: 30000 });
          await expect(marketoBlock.submitButton).toBeHidden();
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Message tests: verify thank-you message appears and form fields hide
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'message').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ page, baseURL }, testInfo) => {
        const testPage = buildTestUrl(baseURL, path);
        const testData = { ...TEST_DATA, email: `test+w${testInfo.workerIndex}t${feature.tcid}@adobetest.com` };
        console.info(`[Test Page]: ${testPage}`);

        await test.step('step-1: Navigate to the test page', async () => {
          await marketoBlock.navigateTo(testPage);
        });

        await test.step('step-2: Verify input field placeholders', async () => {
          await marketoBlock.checkInputPlaceholders();
        });

        await test.step('step-3: Verify error messages on empty submit', async () => {
          await marketoBlock.submitButton.click();
          await marketoBlock.checkForErrorMessages();
        });

        await test.step('step-4: Submit the form with valid inputs', async () => {
          await marketoBlock.submitForm(feature.formType, testData);
        });

        await test.step('step-5: Verify thank-you message and form fields are hidden', async () => {
          await expect(marketoBlock.message).toBeAttached({ timeout: 30000 });
          await expect(page).toHaveURL(testPage);

          const elements = marketoBlock.getFormElements(feature.formType);
          await Promise.all(elements.map(async (el) => {
            await expect(el).toBeHidden();
          }));
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Show/hide tests: verify pre/post-submission content post form submission
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'showHide').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ baseURL }, testInfo) => {
        const testPage = buildTestUrl(baseURL, path);
        const testData = { ...TEST_DATA, email: `test+w${testInfo.workerIndex}t${feature.tcid}@adobetest.com` };
        console.info(`[Test Page]: ${testPage}`);

        await test.step('step-1: Navigate to the show/hide test page', async () => {
          await marketoBlock.navigateTo(testPage);
        });

        await test.step('step-2: Verify initial content state before submission', async () => {
          await expect(marketoBlock.postSubmissionContent).toBeHidden();
          await expect(marketoBlock.preSubmissionContent).toBeVisible();
        });

        await test.step('step-3: Submit the form', async () => {
          await marketoBlock.submitForm(feature.formType, testData);
          await expect(marketoBlock.message).toBeVisible({ timeout: 30000 });
        });

        await test.step('step-4: Verify content state toggles after submission', async () => {
          await expect(marketoBlock.postSubmissionContent).toBeVisible();
          await expect(marketoBlock.preSubmissionContent).toBeHidden();
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Form-off tests: verify post-submission state is shown via ?form=off param
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'formOff').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ page, baseURL }) => {
        const testPage = buildTestUrl(baseURL, path);
        console.info(`[Test Page]: ${testPage}`);

        await test.step('step-1: Navigate to the show/hide test page', async () => {
          await marketoBlock.navigateTo(testPage);
        });

        await test.step('step-2: Verify initial content state before form=off', async () => {
          await expect(marketoBlock.postSubmissionContent).toBeHidden();
          await expect(marketoBlock.preSubmissionContent).toBeVisible();
        });

        await test.step('step-3: Navigate with form=off param', async () => {
          const formParam = miloLibs ? '&form=off' : '?form=off';
          await page.goto(`${testPage}${formParam}`);
          await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Verify content reflects post-submission state with form=off', async () => {
          await expect(marketoBlock.postSubmissionContent).toBeVisible();
          await expect(marketoBlock.preSubmissionContent).toBeHidden();
        });
      });
    });
  });
});
