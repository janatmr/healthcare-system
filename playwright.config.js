const { defineConfig, devices } = require('@playwright/test');
const { FRONTEND_PORT } = require('./tests/e2e/ports');

const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${FRONTEND_PORT}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.js$/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/e2e/start-test-stack.js',
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
