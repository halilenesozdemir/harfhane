import { expect, test } from './support/fixtures';

// R2/012-AE3: on a wide desktop viewport, the game screen's left mode-nav
// and right status panel must sit inside a centred 1200px container instead
// of being pinned to the window's edges.
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const CONTENT_MAX_WIDTH = 1200;
const EDGE_TOLERANCE_PX = 2;

test.describe('desktop layout stays centred', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('keeps the mode nav and status panel inside the centred 1200px container (012-AE3)', async ({ page, api }) => {
    await api.stubDailyWord(5, { word: 'KALEM' });

    await page.goto('/daily/5');

    const nav = page.getByRole('navigation', { name: 'Oyun modları' });
    const status = page.getByRole('complementary', { name: 'Günün durumu' });
    await expect(nav).toBeVisible();
    await expect(status).toBeVisible();

    const navBox = await nav.boundingBox();
    const statusBox = await status.boundingBox();
    expect(navBox).not.toBeNull();
    expect(statusBox).not.toBeNull();

    const containerLeft = (DESKTOP_VIEWPORT.width - CONTENT_MAX_WIDTH) / 2;
    const containerRight = DESKTOP_VIEWPORT.width - containerLeft;

    expect(navBox!.x).toBeGreaterThanOrEqual(containerLeft - EDGE_TOLERANCE_PX);
    expect(statusBox!.x + statusBox!.width).toBeLessThanOrEqual(containerRight + EDGE_TOLERANCE_PX);
  });
});
