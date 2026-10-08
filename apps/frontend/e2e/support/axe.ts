import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// axe-core itself is only a transitive dependency of @axe-core/playwright,
// so its types are derived from AxeBuilder's own return type rather than
// imported directly.
type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

const WCAG_TAGS = ['wcag2a', 'wcag2aa'];
const FAILING_IMPACTS = new Set(['serious', 'critical']);
// Upper bound on how long we wait for in-flight animations before scanning.
// Protects against an animation that never settles (see the Infinity guard
// below) turning into a hang instead of a fast, deterministic scan.
const ANIMATION_SETTLE_TIMEOUT_MS = 2000;

// Modals fade in over 0.3s (tailwind.config.js `fade-in`); Playwright's
// visibility check ignores opacity, so a scan right after an element
// becomes "visible" can land mid-transition and see blended, transiently
// low-contrast colors — flaky, and not a real violation. Wait for every
// running *finite* Web Animation to settle first. An infinite-iteration
// animation's `finished` promise never resolves (e.g. a looping spinner),
// so those are skipped rather than hung on, and the whole wait is bounded
// in case something else unexpectedly never settles.
async function waitForAnimationsToSettle(page: Page): Promise<void> {
  await page.evaluate((timeoutMs) => {
    const finiteAnimations = document.getAnimations().filter((animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations;
      return iterations !== Infinity;
    });
    const settled = Promise.all(finiteAnimations.map((animation) => animation.finished.catch(() => undefined)));
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    return Promise.race([settled, timeout]);
  }, ANIMATION_SETTLE_TIMEOUT_MS);
}

function describeViolation(violation: AxeViolation): string {
  return `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
    .map((node) => node.target.join(' '))
    .join(', ')}`;
}

// Scans the current page state for WCAG 2 A/AA violations and fails the test
// on any serious or critical one (Plan 009 R3). Moderate/minor violations do
// not fail the gate; they are attached to the test report as annotations
// instead of being silently dropped, so they stay visible for follow-up.
export async function assertNoSeriousA11yViolations(page: Page): Promise<void> {
  await waitForAnimationsToSettle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const blocking = results.violations.filter((violation) => FAILING_IMPACTS.has(violation.impact ?? ''));
  const nonBlocking = results.violations.filter((violation) => !FAILING_IMPACTS.has(violation.impact ?? ''));

  for (const violation of nonBlocking) {
    test.info().annotations.push({ type: `axe-${violation.impact ?? 'unknown'}`, description: describeViolation(violation) });
  }

  expect(blocking.map(describeViolation), 'serious/critical axe violations').toEqual([]);
}
