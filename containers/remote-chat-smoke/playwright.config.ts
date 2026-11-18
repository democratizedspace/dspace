import { defineConfig } from '@playwright/test';

// Remote-only: no preview server, app build, install helper, or TLS bypass.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'remote-chat-smoke.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: '/artifacts/playwright',
  use: {
    baseURL: process.env.BASE_URL,
    headless: true,
    ignoreHTTPSErrors: false,
    serviceWorkers: 'block',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
