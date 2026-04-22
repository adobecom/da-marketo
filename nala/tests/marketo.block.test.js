import { expect, test } from '../fixtures.js';
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
  features.filter((f) => f.type === 'redirect' && f.formType !== 'multi-step').forEach((feature) => {
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
        });
      });
    });
  });

  // -------------------------------------------------------------------------
  // Message tests: verify thank-you message appears and form fields hide
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'message' && f.formType !== 'multi-step').forEach((feature) => {
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
  // Multi-step tests: verify 2-step / 3-step flow, Back-navigation
  // preserves entered values, and final submission behaves as redirect/message
  // -------------------------------------------------------------------------
  features.filter((f) => f.formType === 'multi-step').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ page, baseURL }, testInfo) => {
        const testPage = buildTestUrl(baseURL, path);
        const testData = { ...TEST_DATA, email: `test+w${testInfo.workerIndex}t${feature.tcid}@adobetest.com` };
        const { totalSteps } = feature;
        console.info(`[Test Page]: ${testPage}`);

        await test.step('Navigate and verify multi-step structure', async () => {
          await marketoBlock.navigateTo(testPage);
          expect(await marketoBlock.isMultiStep()).toBe(true);
          expect(await marketoBlock.getTotalSteps()).toBe(totalSteps);
          expect(await marketoBlock.getCurrentStep()).toBe(1);
          await expect(marketoBlock.stepIndicator).toHaveText(`Step 1 of ${totalSteps}`);
          await expect(marketoBlock.nextButton).toBeVisible();
          await expect(marketoBlock.submitButton).toHaveClass(/mktoHidden/);
          await expect(marketoBlock.backButton).toHaveCount(0);
        });

        await test.step('Verify validation warnings on empty Next', async () => {
          await marketoBlock.nextButton.click();
          await marketoBlock.checkMultiStepValidation();
          expect(await marketoBlock.getCurrentStep()).toBe(1);
        });

        await test.step('Fill step 1 and advance', async () => {
          await marketoBlock.fillMultiStepStep(1, testData);
          await marketoBlock.clickNext();
          expect(await marketoBlock.getCurrentStep()).toBe(2);
          await expect(marketoBlock.stepIndicator).toHaveText(`Step 2 of ${totalSteps}`);
          await expect(marketoBlock.backButton).toBeVisible();
        });

        await test.step('Back-navigation preserves entered values', async () => {
          await marketoBlock.clickBack();
          expect(await marketoBlock.getCurrentStep()).toBe(1);
          await expect(marketoBlock.email).toHaveValue(testData.email);
          await marketoBlock.clickNext();
          expect(await marketoBlock.getCurrentStep()).toBe(2);
        });

        await test.step('Fill remaining steps and reach final step', async () => {
          await marketoBlock.fillMultiStepStep(2, testData);
          if (totalSteps === 3) {
            await marketoBlock.clickNext();
            expect(await marketoBlock.getCurrentStep()).toBe(3);
            await expect(marketoBlock.stepIndicator).toHaveText('Step 3 of 3');
            await marketoBlock.fillMultiStepStep(3, testData);
          }
        });

        await test.step('Verify final-step UI shows Submit, hides Next', async () => {
          await expect(marketoBlock.nextButton).toHaveClass(/mktoHidden/);
          await expect(marketoBlock.submitButton).toBeVisible();
          await expect(marketoBlock.submitButton).not.toHaveClass(/mktoHidden/);
        });

        await test.step('Submit the form', async () => {
          await marketoBlock.submitButton.click();
        });

        await test.step(`Verify ${feature.type} after submission`, async () => {
          if (feature.type === 'redirect') {
            await expect(page).toHaveURL(/\?submissionid/, { timeout: 30000 });
          } else {
            await expect(marketoBlock.message).toBeAttached({ timeout: 30000 });
            await expect(page).toHaveURL(testPage);
          }
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
