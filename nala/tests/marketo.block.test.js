import { expect, test } from '../fixtures.js';
import features from '../features/marketo.block.spec.js';
import MarketoBlock from '../selectors/marketo.block.page.js';
import TEST_DATA from '../utils/marketo.test.data.js';

const UPDATE_PLACEHOLDERS = 'Please check placeholders.json';
const miloLibs = process.env.MILO_LIBS || '';
const cdnBranch = process.env.MARKETO_LIBS || '';
const marketoLibs = cdnBranch ? `${miloLibs ? '&' : '?'}marketolibs=${cdnBranch}` : '';
const buildTestUrl = (baseURL, path) => `${baseURL}${path}${miloLibs}${marketoLibs}`.toLowerCase();

test.describe('Marketo block test suite', () => {
  let marketoBlock;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(process.env.CI ? 1000 * 60 * 3 : 1000 * 60 * 2);
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
          await expect(marketoBlock.stepIndicator).toHaveText(`Step 1 of ${totalSteps}`, { ignoreCase: true });
          await expect(marketoBlock.stepIndicator, UPDATE_PLACEHOLDERS).toHaveText(`Step 1 of ${totalSteps}`);
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
          await expect(marketoBlock.stepIndicator).toHaveText(`Step 2 of ${totalSteps}`, { ignoreCase: true });
          await expect(marketoBlock.stepIndicator, UPDATE_PLACEHOLDERS).toHaveText(`Step 2 of ${totalSteps}`);
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
            await expect(marketoBlock.stepIndicator).toHaveText(`Step 3 of ${totalSteps}`, { ignoreCase: true });
            await expect(marketoBlock.stepIndicator, UPDATE_PLACEHOLDERS).toHaveText(`Step 3 of ${totalSteps}`);
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
  // CDN routing tests: verify mkto/ path is used, old path never requested
  // Uses MARKETO_LIBS (set to the PR branch by nala.yml) as the ?marketolibs= value.
  // 'main'/'stage' are skipped — da-bacom maps them to http:// which browsers block as mixed content.
  // Once Akamai CDN is wired (target: Jun 23 2026) these can run against business.adobe.com directly.
  // -------------------------------------------------------------------------
  features.filter((f) => f.type === 'cdnRouting').forEach((feature) => {
    feature.path.forEach((path) => {
      test(`${feature.tcid}: ${feature.name}, ${feature.tags}, path: ${path}`, async ({ page, baseURL }) => {
        // MARKETO_LIBS is set to the PR branch by nala.yml (github.head_ref); unset on scheduled runs.
        // 'main' and 'stage' map to http:// in da-bacom getMarketoLibs — skip those to avoid mixed-content failures.
        test.skip(
          !cdnBranch || cdnBranch === 'main' || cdnBranch === 'stage',
          'CDN routing test requires MARKETO_LIBS env var set to a non-main/stage branch',
        );
        const testPage = buildTestUrl(baseURL, path);
        console.info(`[Test Page]: ${testPage}`);

        const responses = new Map();
        page.on('response', (res) => {
          const { pathname } = new URL(res.url());
          if (pathname.includes('/mkto/') || pathname.includes('/blocks/da-marketo/')) {
            responses.set(res.url(), res.status());
          }
        });

        await test.step('step-1: navigate and wait for form', async () => {
          await marketoBlock.navigateTo(testPage);
        });

        await test.step('step-2: mkto/libs.js returns 200', async () => {
          const entry = [...responses.entries()].find(([url]) => url.includes('/mkto/libs.js'));
          expect(entry, 'mkto/libs.js was not requested').toBeTruthy();
          expect(entry[1], `mkto/libs.js returned ${entry?.[1]}`).toBe(200);
        });

        await test.step('step-3: mkto/blocks/da-marketo/da-marketo.js returns 200', async () => {
          const entry = [...responses.entries()].find(([url]) => url.includes('/mkto/blocks/da-marketo/da-marketo.js'));
          expect(entry, 'mkto/blocks/da-marketo/da-marketo.js was not requested').toBeTruthy();
          expect(entry[1], `mkto/blocks/da-marketo/da-marketo.js returned ${entry?.[1]}`).toBe(200);
        });

        await test.step('step-4: no requests to old path (without /mkto/ prefix)', async () => {
          const oldPathReqs = [...responses.keys()].filter(
            (url) => /\/blocks\/da-marketo\//.test(url) && !/\/mkto\/blocks\/da-marketo\//.test(url),
          );
          expect(
            oldPathReqs,
            `old-path requests found: ${oldPathReqs.join(', ')}`,
          ).toHaveLength(0);
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
          const formParam = testPage.includes('?') ? '&form=off' : '?form=off';
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
