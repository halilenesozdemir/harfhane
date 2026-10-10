import { test as base, expect } from '@playwright/test';

const HAS_SEEN_HELP_KEY = 'harfhane:has-seen-help';

// Unlike e2e/support/fixtures.ts (the stubbed project), this fixture stubs
// nothing and freezes no clock: the point of the real-backend project is to
// exercise the real `wrangler dev --local` backend, seeded with today's
// Turkey-day daily word (apps/backend/tests/fixtures/e2e-seed.sql), so the
// page's wall clock must match the server's.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, JSON.stringify(true));
      },
      { key: HAS_SEEN_HELP_KEY }
    );
    await use(page);
  },
});

export { expect };
