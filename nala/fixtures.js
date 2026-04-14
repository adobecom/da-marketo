import { test as base, chromium, firefox, webkit } from '@playwright/test';

const BS_USER = process.env.BROWSERSTACK_USERNAME;
const BS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

const buildCdpUrl = (caps) => `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
  ...caps,
  build: 'da-marketo-nala',
  projectName: 'da-marketo',
  'browserstack.username': BS_USER,
  'browserstack.accessKey': BS_KEY,
  networkLogs: true,
  consoleLogs: 'info',
}))}`;

const browserTypes = { chromium, firefox, webkit };

export const test = base.extend({
  bsCaps: [null, { option: true }],

  context: async ({ bsCaps, browserName, launchOptions }, use) => {
    if (bsCaps) {
      const bsBrowserType = { 'playwright-webkit': webkit, 'playwright-firefox': firefox }[bsCaps.browser] ?? chromium;
      const browser = await bsBrowserType.connect(buildCdpUrl(bsCaps));
      const context = await browser.newContext();
      await use(context);
      await context.close();
      await browser.close();
    } else {
      const browser = await browserTypes[browserName].launch(launchOptions);
      const context = await browser.newContext();
      await use(context);
      await context.close();
      await browser.close();
    }
  },
});

export { expect } from '@playwright/test';
