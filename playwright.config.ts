import { defineConfig } from '@playwright/test';

const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '');
const baseURL = configuredBaseUrl || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: configuredBaseUrl ? 2 : undefined,
  retries: configuredBaseUrl ? 1 : 0,
  use: {
    baseURL,
    channel: 'chrome',
    trace: 'retain-on-failure',
    navigationTimeout: 60_000,
  },
  webServer: configuredBaseUrl ? undefined : {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
