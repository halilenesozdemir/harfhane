import { defineConfig, devices } from '@playwright/test';

const PREVIEW_PORT = 4173;

// `real-backend` project (Plan 009 U3, R4/AE3): runs the daily journey against
// a real `wrangler dev --local` backend and a local-only D1 persist
// directory, never --remote. Only runs when E2E_REAL_BACKEND=1, set by
// scripts/test-e2e-real-backend.mjs (root) — keep REAL_BACKEND_API_PORT,
// REAL_BACKEND_DIST_DIR and REAL_BACKEND_PERSIST_DIR in sync with that
// script. `pnpm test:e2e` never sets this flag and always runs with
// --project=stubbed, so the default stubbed project and command are
// unaffected.
const REAL_BACKEND = process.env.E2E_REAL_BACKEND === '1';
const REAL_BACKEND_API_PORT = 8788;
const REAL_BACKEND_DIST_DIR = 'dist-e2e-real-backend';
const REAL_BACKEND_PERSIST_DIR = '.wrangler/state-e2e-real-backend';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'stubbed',
      // real-backend/** has its own fixtures (no API stubbing) and must
      // never run under this project.
      testIgnore: ['real-backend/**'],
      use: {
        ...devices['Desktop Chrome'],
        // Mobile-sized viewport keeps the desktop sidebar (lg: breakpoint)
        // out of the DOM, so game selectors stay unambiguous.
        viewport: { width: 420, height: 900 },
      },
    },
    {
      name: 'real-backend',
      testMatch: ['real-backend/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 420, height: 900 },
      },
    },
  ],
  webServer: REAL_BACKEND
    ? [
        {
          // Local-only: --local + --persist-to a gitignored directory. Never
          // --remote; the migrated+seeded state here comes from
          // scripts/test-e2e-real-backend.mjs, which runs before this.
          command: `pnpm exec wrangler dev --local --port ${REAL_BACKEND_API_PORT} --persist-to ${REAL_BACKEND_PERSIST_DIR}`,
          cwd: '../backend',
          port: REAL_BACKEND_API_PORT,
          reuseExistingServer: false,
          timeout: 60_000,
        },
        {
          // Serves the real-backend build (VITE_API_URL baked in by the
          // script) from its own outDir, so it never collides with the
          // stubbed build's plain `dist`.
          command: `pnpm exec vite preview --outDir ${REAL_BACKEND_DIST_DIR} --port ${PREVIEW_PORT} --strict-port`,
          port: PREVIEW_PORT,
          reuseExistingServer: false,
          timeout: 30_000,
        },
      ]
    : {
        command: `pnpm exec vite preview --port ${PREVIEW_PORT} --strict-port`,
        port: PREVIEW_PORT,
        // Always start a fresh preview server: with several git worktrees on
        // this machine, reusing "whatever is already on 4173" can silently
        // test a different worktree's build. --strict-port fails loudly
        // instead if that port is genuinely taken.
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
