import { screen, within } from '@testing-library/react-native';
import { Distribution, useDisplayDistribution } from './GameOverDistribution';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { getThemeColors } from '../theme';
import { saveDailyStats, saveUnlimitedStats, createInitialDailyStats, createInitialUnlimitedStats } from '../stats/stats';
import type { KeyValueStore } from '../game/game-storage';
import type { GameMode } from '../game/game-session';
import type { WordLength } from '../stats/stats';
import type { FinishedGameStatus } from './gameOverMessages';

const DAILY_DATE = '2026-01-03';
const COLORS = getThemeColors({ scheme: 'light', isHighContrast: false });

interface DistributionHarnessProps {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly gameStatus: FinishedGameStatus;
  readonly guessCount: number;
  readonly dailyDate: string | null;
  readonly today: () => string;
}

// Mirrors how GameOverCard wires the hook into the component, so these tests exercise the same
// integration the real card relies on (loading stats, deriving the display value, highlighting).
function DistributionHarness({ store, mode, wordLength, gameStatus, guessCount, dailyDate, today }: DistributionHarnessProps) {
  const distribution = useDisplayDistribution(store, mode, wordLength, gameStatus, guessCount, dailyDate, today);
  if (distribution === null) return null;
  return <Distribution distribution={distribution} gameStatus={gameStatus} guessCount={guessCount} />;
}

function renderDistribution(overrides: Partial<DistributionHarnessProps> = {}) {
  const props: DistributionHarnessProps = {
    store: createMemoryStore(),
    mode: 'daily',
    wordLength: 5,
    gameStatus: 'won',
    guessCount: 1,
    dailyDate: DAILY_DATE,
    today: () => DAILY_DATE,
    ...overrides,
  };
  return renderWithTheme(<DistributionHarness {...props} />);
}

describe('GameOverDistribution', () => {
  it('should highlight the bar matching the guess count that just won, including the prior stats', async () => {
    const store = createMemoryStore();
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] });
    await renderDistribution({ store, guessCount: 2 });
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('3')).toBeTruthy();
    expect(flattenStyle(screen.getByTestId('gameover-distribution-2-fill').props.style)['backgroundColor']).toBe(
      COLORS.correct,
    );
  });

  it('should keep a non-current row with a historical count in the plain brand colour when another row is highlighted', async () => {
    const store = createMemoryStore();
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] });
    await renderDistribution({ store, guessCount: 3 });
    const secondRowFill = await screen.findByTestId('gameover-distribution-2-fill');
    expect(flattenStyle(secondRowFill.props.style)['backgroundColor']).toBe(COLORS.brand);
    const thirdRowFill = await screen.findByTestId('gameover-distribution-3-fill');
    expect(flattenStyle(thirdRowFill.props.style)['backgroundColor']).toBe(COLORS.correct);
  });

  it('should not double-count the distribution when a finished daily game is reopened', async () => {
    const store = createMemoryStore();
    // Simulate useResultRecorder already having saved this exact game's result once (a win in
    // one guess on DAILY_DATE) before the card mounts — e.g. after Geri then reopening the game.
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), guessDistribution: [1, 0, 0, 0, 0, 0], lastPlayedDate: DAILY_DATE });
    await renderDistribution({ store, guessCount: 1 });
    const firstFill = await screen.findByTestId('gameover-distribution-1-fill');
    expect(within(firstFill).getByText('1')).toBeTruthy();
    expect(within(firstFill).queryByText('2')).toBeNull();
  });

  it('should add the result once when a daily game finishes for the first time (no prior lastPlayedDate match)', async () => {
    await renderDistribution({ guessCount: 1 });
    const firstFill = await screen.findByTestId('gameover-distribution-1-fill');
    expect(within(firstFill).getByText('1')).toBeTruthy();
  });

  it('should include the just-finished game in the unlimited distribution', async () => {
    const store = createMemoryStore();
    await saveUnlimitedStats(store, 5, createInitialUnlimitedStats());
    await renderDistribution({ store, mode: 'unlimited', dailyDate: null, guessCount: 2 });
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('1')).toBeTruthy();
  });

  it('should not highlight any bar when a loss happens to match a prior row by guess count (011-N2)', async () => {
    await renderWithTheme(
      <Distribution distribution={[0, 0, 0, 0, 0, 2]} gameStatus="lost" guessCount={6} />,
    );
    const sixthRowFill = screen.getByTestId('gameover-distribution-6-fill');
    expect(flattenStyle(sixthRowFill.props.style)['backgroundColor']).toBe(COLORS.brand);
    expect(flattenStyle(sixthRowFill.props.style)['backgroundColor']).not.toBe(COLORS.correct);
  });

  it('should use correctFg (not brandFg) for the count text colour when a bar is highlighted (011-N3)', async () => {
    await renderWithTheme(<Distribution distribution={[0, 1, 0, 0, 0, 0]} gameStatus="won" guessCount={2} />);
    const countText = within(screen.getByTestId('gameover-distribution-2-fill')).getByText('1');
    // Light-scheme brandFg and correctFg both happen to be white, so the dark scheme is what
    // actually distinguishes the two tokens (correctFg #ffffff vs brandFg #1c1611 in dark).
    const darkColors = getThemeColors({ scheme: 'dark', isHighContrast: false });
    expect(flattenStyle(countText.props.style)['color']).toBe(COLORS.correctFg);
    expect(darkColors.correctFg).not.toBe(darkColors.brandFg);
  });

  it('should use brandFg for the count text colour when a bar is not highlighted', async () => {
    await renderWithTheme(<Distribution distribution={[0, 1, 0, 0, 0, 0]} gameStatus="lost" guessCount={2} />);
    const countText = within(screen.getByTestId('gameover-distribution-2-fill')).getByText('1');
    expect(flattenStyle(countText.props.style)['color']).toBe(COLORS.brandFg);
  });
});
