import { defineConfig } from '@playwright/test';

const desktopBrowsers = [
  { name: 'OS X Sequoia-safari', bsCaps: { browser: 'playwright-webkit', browser_version: '18.2', os: 'OS X', os_version: 'Sequoia' } },
  { name: 'OS X Sequoia-chrome', bsCaps: { browser: 'chrome', browser_version: 'latest', os: 'OS X', os_version: 'Sequoia' } },
  { name: 'Windows 11-chrome', bsCaps: { browser: 'chrome', browser_version: 'latest', os: 'Windows', os_version: '11' } },
  { name: 'Windows 11-firefox', bsCaps: { browser: 'playwright-firefox', browser_version: '130.0', os: 'Windows', os_version: '11' } },
];

export default defineConfig({
  testDir: './nala/tests',
  outputDir: './nala/results/test-results',

  timeout: 90 * 1000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  workers: 10,
  forbidOnly: !!process.env.CI,
  retries: 1,
  bail: 5,

  reporter: [['list']],

  use: {
    actionTimeout: 45000,
    baseURL: process.env.BASE_URL || 'https://main--da-bacom--adobecom.aem.live',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: desktopBrowsers.map(({ name, bsCaps }) => ({
    name,
    use: { bsCaps },
  })),
});
