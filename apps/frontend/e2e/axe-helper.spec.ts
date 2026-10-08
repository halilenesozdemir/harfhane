import { expect, test } from '@playwright/test';
import { assertNoSeriousA11yViolations } from './support/axe';

// Proves the helper itself actually fails on a real violation, independent
// of any journey. Without this, a mutant that narrows FAILING_IMPACTS to
// ['critical'] only, or WCAG_TAGS to ['wcag2a'] only (color-contrast is a
// wcag2aa rule — dropping that tag stops the scan from ever running it),
// would survive: every journey spec would still pass, because the app
// itself has no serious/critical violation left, not because the helper
// still catches one when it should.
test('assertNoSeriousA11yViolations fails on a deliberate serious color-contrast violation', async ({ page }) => {
  await page.setContent(
    '<!DOCTYPE html><html><body><p style="color:#999999;background:#ffffff;font-size:14px;">low contrast text</p></body></html>'
  );

  await expect(assertNoSeriousA11yViolations(page)).rejects.toThrow(/serious\/critical axe violations/);
});
