const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  timeout: 60 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10 * 1000,
    ignoreHTTPSErrors: true,
    // Artifacts: only keep screenshots/videos/traces on failure (keeps CI artifacts small)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  // Write test artifacts (videos/traces) and reporters here
  outputDir: 'test-results',
  reporter: [ ['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }] ],
  webServer: {
    command: 'npm start',
    cwd: path.join(__dirname),
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
