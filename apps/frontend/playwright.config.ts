import { defineConfig, devices } from '@playwright/test';

const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Mobile-sized viewport keeps the desktop sidebar (lg: breakpoint)
        // out of the DOM, so game selectors stay unambiguous.
        viewport: { width: 420, height: 900 },
      },
    },
  ],
  webServer: {
    command: `pnpm exec vite preview --port ${PREVIEW_PORT} --strict-port`,
    port: PREVIEW_PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
