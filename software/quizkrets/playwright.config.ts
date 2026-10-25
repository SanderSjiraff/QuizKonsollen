import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright-konfigurasjon.
 *
 * Port og base-URL er konfigurerbare via miljøvariabler slik at tester aldri
 * trenger hardkodede nettadresser:
 *   TEST_PORT (standard 3000)
 *   TEST_BASE_URL (standard http://localhost:<TEST_PORT>)
 *
 * Kjør mot en allerede kjørende server (f.eks. på port 3002):
 *   TEST_BASE_URL=http://localhost:3002 npx playwright test
 */

const PORT = process.env.TEST_PORT ?? '3000';
const BASE_URL = process.env.TEST_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
