import { screen, waitFor, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { getTodayString } from '@harfhane/shared';
import { Distribution, useDisplayDistribution, useDisplayStreak } from './GameOverDistribution';
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
  readonly recordedDistribution: readonly number[] | null;
}

// Mirrors how GameOverCard wires the hook into the component, so these tests exercise the same
// integration the real card relies on (loading stats, deriving the display value, highlighting).
function DistributionHarness({ store, mode, wordLength, gameStatus, guessCount, dailyDate, today, recordedDistribution }: DistributionHarnessProps) {
  const distribution = useDisplayDistribution(store, mode, wordLength, gameStatus, guessCount, dailyDate, today, recordedDistribution);
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
    recordedDistribution: null,
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
    const firstCount = await screen.findByTestId('gameover-distribution-1-count');
    expect(firstCount).toHaveTextContent('1');
  });

  it('should add the result once when a daily game finishes for the first time (no prior lastPlayedDate match)', async () => {
    await renderDistribution({ guessCount: 1 });
    const firstCount = await screen.findByTestId('gameover-distribution-1-count');
    expect(firstCount).toHaveTextContent('1');
  });

  it('should show the just-finished game in the unlimited distribution once useResultRecorder has saved it', async () => {
    // Item 8's reveal/bounce gate means GameOverCard only ever mounts after useResultRecorder's
    // write has landed (unlimited has no "reopen a finished game" path, so every mount follows a
    // just-happened win/loss) — this hook trusts that write instead of racing and re-adding on
    // top of it, or the bar would show 2 for a game that only happened once.
    const store = createMemoryStore();
    await saveUnlimitedStats(store, 5, { ...createInitialUnlimitedStats(), guessDistribution: [0, 1, 0, 0, 0, 0] });
    await renderDistribution({ store, mode: 'unlimited', dailyDate: null, guessCount: 2 });
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('1')).toBeTruthy();
  });

  it('should not double it when the unlimited result was already recorded, unlike a racing optimistic add would', async () => {
    const store = createMemoryStore();
    await saveUnlimitedStats(store, 5, { ...createInitialUnlimitedStats(), guessDistribution: [1, 0, 0, 0, 0, 0] });
    await renderDistribution({ store, mode: 'unlimited', dailyDate: null, guessCount: 1 });
    const firstCount = await screen.findByTestId('gameover-distribution-1-count');
    expect(firstCount).toHaveTextContent('1');
  });

  it('should not add to any bar when the daily game was lost (every bar stays empty with no prior stats)', async () => {
    await renderDistribution({ store: createMemoryStore(), gameStatus: 'lost', guessCount: 6 });
    // recordDailyResult only ever increments the distribution on a win, so a loss against empty
    // prior stats must render no fill bar at all (no coloured sliver for a zero count).
    for (let guessNumber = 1; guessNumber <= 6; guessNumber += 1) {
      expect(screen.queryByTestId(`gameover-distribution-${guessNumber}-fill`)).toBeNull();
    }
  });

  it('should use the daily game\'s own dailyDate, not "today", to decide whether the result was already recorded', async () => {
    const store = createMemoryStore();
    // The game itself was played/recorded on 2026-01-03 (dailyDate), but the card is still open
    // once "today" has rolled over to 2026-01-04 (Turkey midnight passed while mounted). The
    // comparison must use dailyDate, not today(), or this would be wrongly treated as a new,
    // unrecorded result and double-counted.
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), guessDistribution: [1, 0, 0, 0, 0, 0], lastPlayedDate: '2026-01-03' });
    await renderDistribution({ store, dailyDate: '2026-01-03', today: () => '2026-01-04', guessCount: 1 });
    const firstCount = await screen.findByTestId('gameover-distribution-1-count');
    expect(firstCount).toHaveTextContent('1');
  });

  it('should render with no distribution, not an unhandled rejection, when the stats read fails', async () => {
    const rejectingStore: KeyValueStore = {
      getItem: () => Promise.reject(new Error('AsyncStorage unavailable')),
      setItem: async () => undefined,
    };
    await renderDistribution({ store: rejectingStore, guessCount: 1 });
    // Give the rejected promise's .catch a turn to settle; no distribution means Distribution
    // never mounts, so none of its rows render.
    await waitFor(() => expect(screen.queryByTestId('gameover-distribution-1')).toBeNull());
  });

  it('should not highlight any bar when a loss happens to match a prior row by guess count (011-N2)', async () => {
    await renderWithTheme(
      <Distribution distribution={[0, 0, 0, 0, 0, 2]} gameStatus="lost" guessCount={6} />,
    );
    const sixthRowFill = screen.getByTestId('gameover-distribution-6-fill');
    expect(flattenStyle(sixthRowFill.props.style)['backgroundColor']).toBe(COLORS.brand);
    expect(flattenStyle(sixthRowFill.props.style)['backgroundColor']).not.toBe(COLORS.correct);
  });

  it('should render the count outside the coloured fill, in `text`, when the bar has a count (mobile-ui-standard.md C2)', async () => {
    // A 12 dp count inside the bar fails contrast on both fills (correctFg on correct is
    // 4.33:1, brandFg on brand is worse): the fix moves it off the fill entirely.
    await renderWithTheme(<Distribution distribution={[0, 1, 0, 0, 0, 0]} gameStatus="won" guessCount={2} />);
    const fill = screen.getByTestId('gameover-distribution-2-fill');
    expect(within(fill).queryByText('1')).toBeNull();
    const countText = screen.getByTestId('gameover-distribution-2-count');
    expect(countText).toHaveTextContent('1');
    expect(flattenStyle(countText.props.style)['color']).toBe(COLORS.text);
  });

  it('should keep the count in `text` even when the bar is not highlighted', async () => {
    await renderWithTheme(<Distribution distribution={[0, 1, 0, 0, 0, 0]} gameStatus="lost" guessCount={2} />);
    const countText = screen.getByTestId('gameover-distribution-2-count');
    expect(flattenStyle(countText.props.style)['color']).toBe(COLORS.text);
  });

  it('should reserve the same fixed-width count slot when a row has no count, so bar tracks stay comparable', async () => {
    await renderWithTheme(<Distribution distribution={[0, 1, 0, 0, 0, 0]} gameStatus="won" guessCount={2} />);
    const emptyRowCount = flattenStyle(screen.getByTestId('gameover-distribution-1-count', { includeHiddenElements: true }).props.style);
    const filledRowCount = flattenStyle(screen.getByTestId('gameover-distribution-2-count').props.style);
    expect(emptyRowCount.width).toBe(filledRowCount.width);
    expect(screen.getByTestId('gameover-distribution-1-count', { includeHiddenElements: true })).toHaveTextContent('');
  });
});

interface StreakHarnessProps {
  readonly store: KeyValueStore;
  readonly mode: GameMode;
  readonly wordLength: WordLength;
  readonly recordedStreak: number | null;
}

function StreakHarness({ store, mode, wordLength, recordedStreak }: StreakHarnessProps) {
  const streak = useDisplayStreak(store, mode, wordLength, recordedStreak);
  return <Text testID="streak-value">{streak === null ? 'null' : String(streak)}</Text>;
}

describe('useDisplayStreak', () => {
  it('should use the recorded streak directly when one was just recorded, with no storage read', async () => {
    const store = createMemoryStore();
    await renderWithTheme(<StreakHarness store={store} mode="daily" wordLength={5} recordedStreak={4} />);
    expect(screen.getByTestId('streak-value')).toHaveTextContent('4');
  });

  it('should fall back to the stored daily streak when nothing was just recorded (a restored, already-finished game)', async () => {
    const store = createMemoryStore();
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), currentStreak: 7, lastPlayedDate: getTodayString() });
    await renderWithTheme(<StreakHarness store={store} mode="daily" wordLength={5} recordedStreak={null} />);
    await waitFor(() => expect(screen.getByTestId('streak-value')).toHaveTextContent('7'));
  });

  it('should show a streak of 0 when the stored streak is stale because a day was missed', async () => {
    const store = createMemoryStore();
    await saveDailyStats(store, 5, { ...createInitialDailyStats(), currentStreak: 7, lastPlayedDate: '2020-01-01' });
    await renderWithTheme(<StreakHarness store={store} mode="daily" wordLength={5} recordedStreak={null} />);
    await waitFor(() => expect(screen.getByTestId('streak-value')).toHaveTextContent('0'));
  });

  it('should always be null for unlimited, even when a streak value was passed in', async () => {
    const store = createMemoryStore();
    await renderWithTheme(<StreakHarness store={store} mode="unlimited" wordLength={5} recordedStreak={9} />);
    expect(screen.getByTestId('streak-value')).toHaveTextContent('null');
  });

  it('should load a zero stored streak as 0, not null, once the storage read resolves', async () => {
    const store = createMemoryStore();
    await renderWithTheme(<StreakHarness store={store} mode="daily" wordLength={5} recordedStreak={null} />);
    await waitFor(() => expect(screen.getByTestId('streak-value')).toHaveTextContent('0'));
  });
});
