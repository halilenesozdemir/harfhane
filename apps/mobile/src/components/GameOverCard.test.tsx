import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, Share } from 'react-native';
import { GameOverCard } from './GameOverCard';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { getThemeColors } from '../theme';
import { saveDailyStats, saveUnlimitedStats, createInitialDailyStats, createInitialUnlimitedStats } from '../stats/stats';

jest.mock('react-native/Libraries/Share/Share', () => ({
  __esModule: true,
  default: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
}));

const DAILY_DATE = '2026-01-03';
const WON_GUESSES = ['KALEM', 'KALEM', 'KALEM'] as const;
const WON_EVALUATIONS = [
  ['correct', 'correct', 'correct', 'correct', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
] as const;

describe('GameOverCard', () => {
  // 011-AE1
  it('should show the answer, the third distribution bar, a share button and a daily countdown when a daily game is won in three guesses (011-AE1)', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={[...WON_GUESSES]}
        evaluations={WON_EVALUATIONS.map((row) => [...row])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByTestId('gameover-card')).toBeTruthy();
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
    expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();
    const shareButton = screen.getByTestId('gameover-share');
    expect(shareButton).toBeTruthy();
    expect(screen.queryByTestId('gameover-new-word')).toBeNull();

    expect(await screen.findByText('Tahmin dağılımı')).toBeTruthy();

    const thirdRow = await screen.findByTestId('gameover-distribution-3');
    expect(within(thirdRow).getByText('1')).toBeTruthy();
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    const thirdFill = screen.getByTestId('gameover-distribution-3-fill');
    expect(flattenStyle(thirdFill.props.style)['backgroundColor']).toBe(colors.correct);

    // Rows with no games at this guess count (1 and 2, before the just-won third) render no
    // fill bar at all — no coloured stub for a zero count.
    expect(screen.queryByTestId('gameover-distribution-1-fill')).toBeNull();
    expect(screen.queryByTestId('gameover-distribution-2-fill')).toBeNull();

    await act(async () => fireEvent.press(shareButton));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Harfhane #3') }),
    );
  });

  it('should show the solution when a daily game is lost', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={[]}
        evaluations={[]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
  });

  it('should offer a new word and no countdown in unlimited mode', async () => {
    const onNewGame = jest.fn();
    await renderWithTheme(
      <GameOverCard
        mode="unlimited"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM']}
        evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
        wordId={42}
        dailyDate={null}
        store={createMemoryStore()}
        onNewGame={onNewGame}
      />,
    );
    expect(screen.queryByTestId('gameover-countdown')).toBeNull();
    const newWordButton = await screen.findByTestId('gameover-new-word');
    fireEvent.press(newWordButton);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it('should highlight the bar matching the guess count that just won, including the prior stats', async () => {
    const store = createMemoryStore();
    const priorStats = { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] };
    await saveDailyStats(store, 5, priorStats);
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM', 'KALEM']}
        evaluations={[
          ['correct', 'correct', 'correct', 'correct', 'correct'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('3')).toBeTruthy();
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    expect(flattenStyle(screen.getByTestId('gameover-distribution-2-fill').props.style)['backgroundColor']).toBe(
      colors.correct,
    );
  });

  it('should keep a non-current row with a historical count in the plain brand colour, not highlighted', async () => {
    const store = createMemoryStore();
    const priorStats = { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] };
    await saveDailyStats(store, 5, priorStats);
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={[...WON_GUESSES]}
        evaluations={WON_EVALUATIONS.map((row) => [...row])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    const secondRowFill = await screen.findByTestId('gameover-distribution-2-fill');
    expect(flattenStyle(secondRowFill.props.style)['backgroundColor']).toBe(colors.brand);
    const thirdRowFill = await screen.findByTestId('gameover-distribution-3-fill');
    expect(flattenStyle(thirdRowFill.props.style)['backgroundColor']).toBe(colors.correct);
  });

  it('should use a daily-appropriate loss title, never the unlimited retry wording', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={[]}
        evaluations={[]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    expect(screen.queryByText('Tekrar dene!')).toBeNull();
  });

  it('should offer a retry-flavoured loss title in unlimited mode', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="unlimited"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={[]}
        evaluations={[]}
        wordId={0}
        dailyDate={null}
        store={createMemoryStore()}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByText('Tekrar dene!')).toBeTruthy();
  });

  it('should not double-count the distribution when a finished daily game is reopened', async () => {
    const store = createMemoryStore();
    // Simulate useResultRecorder already having saved this exact game's result once (a win in
    // one guess on DAILY_DATE) before the card mounts — e.g. after Geri then reopening the game.
    const alreadyRecorded = { ...createInitialDailyStats(), guessDistribution: [1, 0, 0, 0, 0, 0], lastPlayedDate: DAILY_DATE };
    await saveDailyStats(store, 5, alreadyRecorded);
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM']}
        evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const firstFill = await screen.findByTestId('gameover-distribution-1-fill');
    expect(within(firstFill).getByText('1')).toBeTruthy();
    expect(within(firstFill).queryByText('2')).toBeNull();
  });

  it('should add the result once when a daily game finishes for the first time (no prior lastPlayedDate match)', async () => {
    const store = createMemoryStore();
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM']}
        evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const firstFill = await screen.findByTestId('gameover-distribution-1-fill');
    expect(within(firstFill).getByText('1')).toBeTruthy();
  });

  it('should show the exact countdown value at a fixed instant, tick when the clock advances, and clear its interval on unmount', async () => {
    jest.useFakeTimers({ doNotFake: ['Date', 'nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
    try {
      let current = new Date('2026-01-01T20:59:59Z');
      const nowFn = () => current;
      const view = await renderWithTheme(
        <GameOverCard
          mode="daily"
          wordLength={5}
          gameStatus="won"
          solution="KALEM"
          guesses={['KALEM']}
          evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
          wordId={null}
          dailyDate={DAILY_DATE}
          store={createMemoryStore()}
          today={() => DAILY_DATE}
          now={nowFn}
          onNewGame={jest.fn()}
        />,
      );
      expect(view.getByTestId('gameover-countdown')).toHaveTextContent('00:00:01');

      current = new Date('2026-01-01T20:59:59.999Z');
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(view.getByTestId('gameover-countdown')).toHaveTextContent('00:00:00');

      const timersWhileMounted = jest.getTimerCount();
      expect(timersWhileMounted).toBeGreaterThan(0);
      await act(async () => {
        view.unmount();
      });
      // A delta, not an absolute zero: the test environment may hold unrelated timers of its
      // own, but unmounting must clear the countdown's own interval.
      expect(jest.getTimerCount()).toBeLessThan(timersWhileMounted);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should not run a countdown interval in unlimited mode', async () => {
    jest.useFakeTimers({ doNotFake: ['Date', 'nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
    try {
      await renderWithTheme(
        <GameOverCard
          mode="unlimited"
          wordLength={5}
          gameStatus="won"
          solution="KALEM"
          guesses={['KALEM']}
          evaluations={[['correct', 'correct', 'correct', 'correct', 'correct']]}
          wordId={42}
          dailyDate={null}
          store={createMemoryStore()}
          onNewGame={jest.fn()}
        />,
      );
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should announce the result title for TalkBack/VoiceOver and mark it as a header', async () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={[...WON_GUESSES]}
        evaluations={WON_EVALUATIONS.map((row) => [...row])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    // dailyGameNumber('2026-01-03') === 3, guessCount === 3, WIN_MESSAGE_VARIANTS[3][3 % 3] === 'Güzel!'.
    const title = await screen.findByText('Güzel!');
    expect(title.props.accessibilityRole).toBe('header');
    expect(title.props.accessibilityLiveRegion).toBe('polite');
    expect(announceSpy).toHaveBeenCalledWith('Güzel!');
    announceSpy.mockRestore();
  });

  it('should render the card as a ScrollView so its content can scroll on a small screen', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={[...WON_GUESSES]}
        evaluations={WON_EVALUATIONS.map((row) => [...row])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    // v14 RNTL only renders host elements, so this checks the native host component name:
    // "RCTScrollView" is React Native's scroll container, not a plain "RCTView".
    const card = screen.getByTestId('gameover-card');
    expect(card.type).toBe('RCTScrollView');
  });

  it('should show an exact, known win title for a fixed mode/guess-count/seed combination', async () => {
    // mode unlimited, wordId 0 (seed 0), guessCount 2: WIN_MESSAGE_VARIANTS[2][0] === 'Harika!'.
    // Pinning the literal string (not calling selectResultMessage here) guards against an
    // accidental reordering of the variants silently changing what players see.
    await renderWithTheme(
      <GameOverCard
        mode="unlimited"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM', 'KALEM']}
        evaluations={[
          ['correct', 'correct', 'correct', 'correct', 'correct'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ]}
        wordId={0}
        dailyDate={null}
        store={createMemoryStore()}
        onNewGame={jest.fn()}
      />,
    );
    expect(await screen.findByText('Harika!')).toBeTruthy();
  });

  it('should include "X/6" in the shared text on a loss', async () => {
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={['KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK']}
        evaluations={new Array(6).fill(['absent', 'absent', 'absent', 'absent', 'absent'])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={createMemoryStore()}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('X/6') }));
  });

  it('should include the just-finished game in the unlimited distribution', async () => {
    const store = createMemoryStore();
    await saveUnlimitedStats(store, 5, createInitialUnlimitedStats());
    await renderWithTheme(
      <GameOverCard
        mode="unlimited"
        wordLength={5}
        gameStatus="won"
        solution="KALEM"
        guesses={['KALEM', 'KALEM']}
        evaluations={[
          ['correct', 'correct', 'correct', 'correct', 'correct'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ]}
        wordId={7}
        dailyDate={null}
        store={store}
        onNewGame={jest.fn()}
      />,
    );
    const secondRow = await screen.findByTestId('gameover-distribution-2');
    expect(within(secondRow).getByText('1')).toBeTruthy();
  });

  it('should not highlight any bar on a loss, even when the distribution has prior wins', async () => {
    const store = createMemoryStore();
    const priorStats = { ...createInitialDailyStats(), guessDistribution: [0, 2, 0, 0, 0, 0] };
    await saveDailyStats(store, 5, priorStats);
    await renderWithTheme(
      <GameOverCard
        mode="daily"
        wordLength={5}
        gameStatus="lost"
        solution="KALEM"
        guesses={['KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK']}
        evaluations={new Array(6).fill(['absent', 'absent', 'absent', 'absent', 'absent'])}
        wordId={null}
        dailyDate={DAILY_DATE}
        store={store}
        today={() => DAILY_DATE}
        onNewGame={jest.fn()}
      />,
    );
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    const secondRowFill = await screen.findByTestId('gameover-distribution-2-fill');
    expect(flattenStyle(secondRowFill.props.style)['backgroundColor']).toBe(colors.brand);
    expect(flattenStyle(secondRowFill.props.style)['backgroundColor']).not.toBe(colors.correct);
  });
});
