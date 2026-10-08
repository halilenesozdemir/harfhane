import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa'];
const FAILING_IMPACTS = new Set(['serious', 'critical']);

// Modals fade in over 0.3s (tailwind.config.js `fade-in`); Playwright's
// visibility check ignores opacity, so a scan right after an element
// becomes "visible" can land mid-transition and see blended, transiently
// low-contrast colors — flaky, and not a real violation. Wait for every
// running Web Animation to settle first.
async function waitForAnimationsToSettle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)))
  );
}

// Scans the current page state for WCAG 2 A/AA violations and fails the test
// on any serious or critical one. Moderate/minor violations are reported but
// do not fail the gate (Plan 009 R3): they still show up in the test output
// for follow-up, without blocking the journey on cosmetic nits.
export async function assertNoSeriousA11yViolations(page: Page): Promise<void> {
  await waitForAnimationsToSettle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blocking = results.violations.filter((violation) => FAILING_IMPACTS.has(violation.impact ?? ''));

  const describe = (violation: (typeof results.violations)[number]): string =>
    `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
      .map((node) => node.target.join(' '))
      .join(', ')}`;

  expect(blocking.map(describe), 'serious/critical axe violations').toEqual([]);
}
