import { expect, test } from './support/fixtures';
import { waitForBoardReady } from './support/game';

// R4 / KTD2: tile size follows the viewport via a CSS clamp on the board
// width (no JS resize listener). These two viewports are the plan's own
// acceptance example (012-AE5).

test('a board tile is at least 64px wide on a 1920x1080 window (012-AE5)', async ({ page, api }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await api.stubDailyWord(5, { word: 'KALEM' });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');
  await waitForBoardReady(page);

  const tileBox = await page.getByTestId('tile').first().boundingBox();
  expect(tileBox).not.toBeNull();
  expect(tileBox!.width).toBeGreaterThanOrEqual(64);

  // GameSidePanel only fills the sm:-to-lg: gap; at lg: and up DesktopShell
  // renders its own mode-nav and status-panel asides, so GameSidePanel's
  // own mode switch must not also be in the DOM as a visible duplicate.
  await expect(page.getByRole('group', { name: 'Mod' })).not.toBeVisible();
});

test('a 4-letter board also fits a 360x640 window with no scroll (012-AE5)', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await api.stubDailyWord(4, { word: 'MASA' });
  await api.stubValidate(() => true);

  await page.goto('/daily/4');
  await waitForBoardReady(page);

  const enterKey = page.getByRole('button', { name: 'Gönder' });
  await expect(enterKey).toBeInViewport();

  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
});

test('the board and keyboard fit a 360x640 window with no scroll (012-AE5)', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await api.stubDailyWord(5, { word: 'KALEM' });
  await api.stubValidate(() => true);

  await page.goto('/daily/5');
  await waitForBoardReady(page);

  const enterKey = page.getByRole('button', { name: 'Gönder' });
  await expect(enterKey).toBeVisible();
  await expect(enterKey).toBeInViewport();

  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
});

test('a 6-letter board also fits a 360x640 window with no scroll', async ({ page, api }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await api.stubDailyWord(6, { word: 'KAPLAN' });
  await api.stubValidate(() => true);

  await page.goto('/daily/6');
  await waitForBoardReady(page);

  const enterKey = page.getByRole('button', { name: 'Gönder' });
  await expect(enterKey).toBeInViewport();

  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
});
