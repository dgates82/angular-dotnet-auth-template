import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // TOTP verification is inherently time-window sensitive; one retry absorbs a rare
  // window-boundary miss without masking a real failure (which won't pass on retry).
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Local-only fallback for machines without Chromium installed - CI only ever
    // installs/runs chromium (see ci.yml), so this stays out of that run entirely.
    ...(process.env.CI ? [] : [{
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    }]),
  ],
});
