import { defineConfig, devices } from '@playwright/test';

const USER_AGENT_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.6900.0 Safari/537.36 NALA-DA-BAcom';
const USER_AGENT_MOBILE_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.6900.0 Mobile Safari/537.36 NALA-DA-BAcom';
const USER_AGENT_MOBILE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 NALA-DA-BAcom';
const CHROME_LAUNCH_OPTIONS = { args: ['--disable-features=BlockInsecurePrivateNetworkRequests,LocalNetworkAccessChecks'] };

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './nala/tests',
  outputDir: './nala/results/test-results',

  /* Maximum time one test can run for */
  timeout: 60 * 1000,

  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if test.only is accidentally left in */
  forbidOnly: !!process.env.CI,

  retries: 1,

  workers: 2,

  /* Reporter */
  reporter: process.env.CI
    ? [['github'], ['list']]
    : [['html', { outputFolder: 'nala/results/test-html-results', open: 'never' }], ['list']],

  use: {
    /* Per-action timeout */
    actionTimeout: 30000,

    /* Base URL for the da-marketo project — override with env vars as needed */
    baseURL: process.env.BASE_URL || 'https://main--da-bacom--adobecom.aem.live',

    /* Collect trace on first retry for debugging */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], userAgent: USER_AGENT_DESKTOP, launchOptions: CHROME_LAUNCH_OPTIONS },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], userAgent: USER_AGENT_DESKTOP },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], userAgent: USER_AGENT_DESKTOP },
    },
    {
      name: 'mobile-chrome-pixel7',
      use: { ...devices['Pixel 7'], userAgent: USER_AGENT_MOBILE_CHROME, launchOptions: CHROME_LAUNCH_OPTIONS },
    },
    {
      name: 'mobile-safari-iphone15',
      use: { ...devices['iPhone 15'], userAgent: USER_AGENT_MOBILE_SAFARI },
    },
    {
      name: 'tablet-safari-ipad-pro-11',
      use: { ...devices['iPad Pro 11'], userAgent: USER_AGENT_MOBILE_SAFARI },
    },
  ],
});
