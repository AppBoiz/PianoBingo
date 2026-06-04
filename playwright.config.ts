import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/e2e/**/*.spec.ts', '**/integration/**/*.spec.ts'],
  timeout: 60000,
  expect: { timeout: 5000 },
  webServer: {
    command: 'npm run build && npx serve dist -p 3000',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
