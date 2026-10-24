import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Share } from 'react-native';
import { generateShareText } from '@harfhane/shared';
import { GameOverCard } from './GameOverCard';
import type { GameOverCardProps } from './GameOverCard';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { getThemeColors } from '../theme';
import { FONT_FAMILY_DISPLAY, FONT_SIZE } from '../ui/layout';

// The first test in this file pays the cold start (theme provider, fonts, Animated) and has
// exceeded Jest's 5 s default on CI runners twice (#162, #163) while passing locally.
const COLD_START_TEST_TIMEOUT_MS = 15_000;

type AppStateHandler = (status: string) => void;

function mockAppStateListener(): { fire: (status: string) => void } {
  let handler: AppStateHandler | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, nextHandler) => {
    handler = nextHandler as AppStateHandler;
    return { remove: () => undefined } as ReturnType<typeof AppState.addEventListener>;
  });
  return { fire: (status: string) => handler?.(status) };
}

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

function renderCard(overrides: Partial<GameOverCardProps> = {}) {
  const props: GameOverCardProps = {
    mode: 'daily',
    wordLength: 5,
    gameStatus: 'won',
    solution: 'KALEM',
    guesses: [...WON_GUESSES],
    evaluations: WON_EVALUATIONS.map((row) => [...row]),
    wordId: null,
    dailyDate: DAILY_DATE,
    store: createMemoryStore(),
    today: () => DAILY_DATE,
    onNewGame: jest.fn(),
    hintUsed: false,
    ...overrides,
  };
  return renderWithTheme(<GameOverCard {...props} />);
}

describe('GameOverCard', () => {
  it('should show the answer, a share button with the exact generated text and a daily countdown when a daily game is won in three guesses (011-AE1)', async () => {
    const guesses = [...WON_GUESSES];
    const evaluations = WON_EVALUATIONS.map((row) => [...row]);
    const now = () => new Date('2026-01-01T20:59:59Z');
    await renderCard({ guesses, evaluations, now });

    expect(await screen.findByTestId('gameover-card')).toBeTruthy();
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
    // One second before the next Turkey midnight (21:00 UTC): proves the exact injected clock.
    expect(await screen.findByTestId('gameover-countdown')).toHaveTextContent('00:00:01');
    expect(screen.queryByTestId('gameover-new-word')).toBeNull();

    // The just-won third bar is highlighted (kills a dropped-<Distribution/> or isWon=false mutant).
    const thirdFill = await screen.findByTestId('gameover-distribution-3-fill');
    expect(within(thirdFill).queryByText('1')).toBeNull();
    expect(screen.getByTestId('gameover-distribution-3-count')).toHaveTextContent('1');
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    expect(flattenStyle(thirdFill.props.style)['backgroundColor']).toBe(colors.correct);

    const shareButton = screen.getByTestId('gameover-share');
    await act(async () => fireEvent.press(shareButton));
    // Full-text equality kills mutants flipping `won` or emptying `guesses`/`evaluations`.
    const expectedShareText = generateShareText(guesses, evaluations, '#3', true);
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
  }, COLD_START_TEST_TIMEOUT_MS);

  it('should show the solution when a daily game is lost', async () => {
    await renderCard({ gameStatus: 'lost', guesses: [], evaluations: [] });
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
  });

  it('should not show the report-word action when onReportWord is not supplied', async () => {
    await renderCard();
    expect(screen.queryByTestId('gameover-report-word')).toBeNull();
  });

  it('should call onReportWord when "Kelimeyi bildir" is pressed, leaving mode/length/date/word composition to the parent (013-AE8)', async () => {
    const onReportWord = jest.fn();
    await renderCard({ onReportWord });
    const reportButton = await screen.findByTestId('gameover-report-word');
    fireEvent.press(reportButton);
    expect(onReportWord).toHaveBeenCalledTimes(1);
  });

  it('should offer a new word and no countdown when the game is unlimited', async () => {
    const onNewGame = jest.fn();
    await renderCard({
      mode: 'unlimited',
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      wordId: 42,
      dailyDate: null,
      onNewGame,
    });
    expect(screen.queryByTestId('gameover-countdown')).toBeNull();
    const newWordButton = await screen.findByTestId('gameover-new-word');
    fireEvent.press(newWordButton);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it('should use a daily-appropriate loss title when the game is daily, never the unlimited retry wording', async () => {
    await renderCard({ gameStatus: 'lost', guesses: [], evaluations: [] });
    expect(screen.queryByText('Tekrar dene!')).toBeNull();
  });

  it('should offer a retry-flavoured loss title when the game is unlimited', async () => {
    await renderCard({ mode: 'unlimited', gameStatus: 'lost', guesses: [], evaluations: [], wordId: 0, dailyDate: null });
    expect(await screen.findByText('Tekrar dene!')).toBeTruthy();
  });

  it('should show hours, minutes and seconds in that order, not swapped', async () => {
    // 18:59:58Z -> 02:00:02 before Turkey midnight: distinct fields catch an hours/minutes swap.
    const now = () => new Date('2026-01-01T18:59:58Z');
    await renderCard({ now });
    expect(await screen.findByTestId('gameover-countdown')).toHaveTextContent('02:00:02');
  });

  it('should tick the countdown when the clock advances and clear its interval when unmounted', async () => {
    jest.useFakeTimers({ doNotFake: ['Date', 'nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
    try {
      let current = new Date('2026-01-01T20:59:59Z');
      const view = await renderCard({ guesses: ['KALEM'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], now: () => current });
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

  it('should not run a countdown interval when the game is unlimited', async () => {
    jest.useFakeTimers({ doNotFake: ['Date', 'nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
    try {
      await renderCard({
        mode: 'unlimited',
        guesses: ['KALEM'],
        evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
        wordId: 42,
        dailyDate: null,
      });
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should announce the result title for TalkBack/VoiceOver and mark it as a header when the card mounts', async () => {
    const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderCard();
    // dailyGameNumber('2026-01-03') === 3, guessCount === 3, WIN_MESSAGE_VARIANTS[3][3 % 3] === 'Güzel!'.
    const title = await screen.findByText('Güzel!');
    expect(title.props.accessibilityRole).toBe('header');
    expect(title.props.accessibilityLiveRegion).toBe('polite');
    expect(announceSpy).toHaveBeenCalledWith('Güzel!');
    announceSpy.mockRestore();
  });

  it('should render the card as a ScrollView so its content can scroll when the screen is small', async () => {
    await renderCard();
    // v14 RNTL renders host elements only: "RCTScrollView" is the native host component name.
    const card = screen.getByTestId('gameover-card');
    expect(card.type).toBe('RCTScrollView');
  });

  it('should show an exact, known win title when the mode/guess-count/seed combination is fixed', async () => {
    // mode unlimited, wordId 0 (seed 0), guessCount 2: WIN_MESSAGE_VARIANTS[2][0] === 'Harika!'.
    // Pinning the literal string guards against a silent variant-reordering regression.
    await renderCard({
      mode: 'unlimited',
      guesses: ['KALEM', 'KALEM'],
      evaluations: [
        ['correct', 'correct', 'correct', 'correct', 'correct'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
      wordId: 0,
      dailyDate: null,
    });
    expect(await screen.findByText('Harika!')).toBeTruthy();
  });

  it('should include "X/6" in the shared text when the game is lost', async () => {
    await renderCard({
      gameStatus: 'lost',
      guesses: ['KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK', 'KAPAK'],
      evaluations: new Array(6).fill(['absent', 'absent', 'absent', 'absent', 'absent']),
    });
    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('X/6') }));
  });

  it('should show the visible "Paylaş" text and the secondary "Yeni kelime" button, not the primary look', async () => {
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    await renderCard({
      mode: 'unlimited',
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      wordId: 42,
      dailyDate: null,
    });
    expect(screen.getByText('Paylaş')).toBeTruthy();
    const newWordFace = flattenStyle(screen.getByTestId('gameover-new-word-face').props.style);
    expect(newWordFace.backgroundColor).toBe(colors.surface);
    expect(newWordFace.backgroundColor).not.toBe(colors.brand);
  });

  it('should append the hint marker to the shared text header when a hint was used in a daily game (011-AE6)', async () => {
    const guesses = [...WON_GUESSES];
    const evaluations = WON_EVALUATIONS.map((row) => [...row]);
    await renderCard({ guesses, evaluations, hintUsed: true });

    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    const expectedShareText = generateShareText(guesses, evaluations, '#3', true, { hintUsed: true });
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
    expect(expectedShareText.split('\n')[0]).toContain('· ipucu');
  });

  it('should not append the hint marker to the shared text header when no hint was used (011-AE6)', async () => {
    const guesses = [...WON_GUESSES];
    const evaluations = WON_EVALUATIONS.map((row) => [...row]);
    await renderCard({ guesses, evaluations, hintUsed: false });

    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    const expectedShareText = generateShareText(guesses, evaluations, '#3', true, { hintUsed: false });
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
    expect(expectedShareText.split('\n')[0]).not.toContain('ipucu');
  });

  it('should append the hint marker to the unlimited shared text header when a hint was used', async () => {
    const onNewGame = jest.fn();
    await renderCard({
      mode: 'unlimited',
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      wordId: 42,
      dailyDate: null,
      onNewGame,
      hintUsed: true,
    });
    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    const expectedShareText = generateShareText(
      ['KALEM'],
      [['correct', 'correct', 'correct', 'correct', 'correct']],
      'Sınırsız',
      true,
      { hintUsed: true },
    );
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
  });

  it('should use the server gameNumber in the share text when it disagrees with the device-computed number', async () => {
    const guesses = [...WON_GUESSES];
    const evaluations = WON_EVALUATIONS.map((row) => [...row]);
    // dailyGameNumber(DAILY_DATE) === 3, but the server says this is game #99 (e.g. the device
    // clock is wrong); the server's number must win.
    await renderCard({ guesses, evaluations, gameNumber: 99 });

    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    const expectedShareText = generateShareText(guesses, evaluations, '#99', true, { hintUsed: false });
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
  });

  it('should fall back to the device-computed game number when gameNumber is not provided', async () => {
    const guesses = [...WON_GUESSES];
    const evaluations = WON_EVALUATIONS.map((row) => [...row]);
    await renderCard({ guesses, evaluations, gameNumber: null });

    await act(async () => fireEvent.press(screen.getByTestId('gameover-share')));
    const expectedShareText = generateShareText(guesses, evaluations, '#3', true, { hintUsed: false });
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
  });

  it('should render the result title in the headline display font, not the body font', async () => {
    await renderCard();
    const title = flattenStyle(screen.getByRole('header').props.style);
    expect(title.fontSize).toBe(FONT_SIZE.headline);
    expect(title.fontFamily).toBe(FONT_FAMILY_DISPLAY);
  });

  describe('midnight rollover', () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should show a primary "Oyna" CTA instead of the countdown when the Turkey day rolls over while mounted', async () => {
      jest.useFakeTimers({ doNotFake: ['Date', 'nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
      let currentToday = DAILY_DATE;
      const onNewGame = jest.fn();
      await renderCard({
        date: DAILY_DATE,
        today: () => currentToday,
        now: () => new Date('2026-01-01T20:59:59Z'),
        onNewGame,
      });
      expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();
      expect(screen.queryByTestId('gameover-play-new-day')).toBeNull();

      currentToday = '2026-01-04';
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.queryByTestId('gameover-countdown')).toBeNull();
      expect(screen.getByText('Yeni günün kelimesi hazır')).toBeTruthy();
      const playButton = screen.getByTestId('gameover-play-new-day');
      fireEvent.press(playButton);
      expect(onNewGame).toHaveBeenCalledTimes(1);
    });

    it('should show the CTA when the app returns to the foreground after midnight has already passed', async () => {
      const appState = mockAppStateListener();
      let currentToday = DAILY_DATE;
      await renderCard({ date: DAILY_DATE, today: () => currentToday });
      expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();

      currentToday = '2026-01-04';
      await act(async () => {
        appState.fire('active');
      });

      expect(screen.queryByTestId('gameover-countdown')).toBeNull();
      expect(screen.getByTestId('gameover-play-new-day')).toBeTruthy();
    });

    it('should not show the CTA when the device clock is merely behind the server-reported date', async () => {
      // The device thinks it is still DAILY_DATE, but the server says the game is a day ahead
      // (a wrong device clock, not a midnight rollover) - must not be treated as stale.
      await renderCard({ date: '2026-01-04', today: () => DAILY_DATE });
      expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();
      expect(screen.queryByTestId('gameover-play-new-day')).toBeNull();
    });

    it('should fall back to the session daily date when the server-stored date is absent', async () => {
      const appState = mockAppStateListener();
      let currentToday = DAILY_DATE;
      await renderCard({ date: null, dailyDate: DAILY_DATE, today: () => currentToday });
      expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();

      currentToday = '2026-01-04';
      await act(async () => {
        appState.fire('active');
      });

      expect(screen.getByTestId('gameover-play-new-day')).toBeTruthy();
    });

    it('should demote the share button to secondary so the CTA is the only primary action', async () => {
      const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
      const appState = mockAppStateListener();
      let currentToday = DAILY_DATE;
      await renderCard({ date: DAILY_DATE, today: () => currentToday });
      await screen.findByTestId('gameover-countdown');

      currentToday = '2026-01-04';
      await act(async () => {
        appState.fire('active');
      });

      const shareFace = flattenStyle(screen.getByTestId('gameover-share-face').props.style);
      expect(shareFace.backgroundColor).toBe(colors.surface);
      const playFace = flattenStyle(screen.getByTestId('gameover-play-new-day-face').props.style);
      expect(playFace.backgroundColor).toBe(colors.brand);
    });

    it('should not show the CTA for a finished unlimited game', async () => {
      await renderCard({
        mode: 'unlimited',
        guesses: ['KALEM'],
        evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
        wordId: 42,
        dailyDate: null,
        date: null,
      });
      expect(screen.queryByTestId('gameover-play-new-day')).toBeNull();
      expect(await screen.findByTestId('gameover-new-word')).toBeTruthy();
    });

    it('should use the server date, not the session dailyDate, to decide staleness when they disagree', async () => {
      // dailyDate (device-computed) says the game is from 2026-01-03; the server's own `date`
      // says 2026-01-04. Once the Turkey day reaches 2026-01-04, the server's (later) date must
      // win: that day has only just arrived, not passed, so there is still no CTA. A mutant that
      // reads `dailyDate` instead of `date` here would compute 2026-01-04 > 2026-01-03 = stale,
      // showing the CTA wrongly.
      const appState = mockAppStateListener();
      let currentToday = '2026-01-03';
      await renderCard({ dailyDate: '2026-01-03', date: '2026-01-04', today: () => currentToday });
      expect(await screen.findByTestId('gameover-countdown')).toBeTruthy();

      currentToday = '2026-01-04';
      await act(async () => {
        appState.fire('active');
      });

      expect(screen.queryByTestId('gameover-play-new-day')).toBeNull();
      expect(screen.getByTestId('gameover-countdown')).toBeTruthy();
    });

    it('should clear every interval it started (the day tracker and the countdown) and remove the AppState subscription on unmount', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const removeSpy = jest.fn();
      jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: removeSpy } as ReturnType<typeof AppState.addEventListener>);
      const view = await renderCard({ date: DAILY_DATE });
      await screen.findByTestId('gameover-countdown');
      // A daily, non-stale card starts exactly two 1 s intervals while mounted: the day
      // tracker's own (useTurkeyDay) and the countdown's (useCountdown) — both tick at
      // COUNTDOWN_UPDATE_INTERVAL_MS (1000 ms). Filtering on that delay (rather than taking
      // every recorded `setInterval` call) excludes an unrelated one RNTL's own `findByTestId`
      // polling can add to this same global spy, so asserting against every entry here still
      // catches either of this component's own intervals missing its clearInterval, not only
      // the day tracker's, without being thrown off by that polling interval's different delay.
      const oneSecondIntervalIds = setIntervalSpy.mock.calls
        .map((call, index) => ({ delayMs: call[1], timerId: setIntervalSpy.mock.results[index]?.value as ReturnType<typeof setInterval> }))
        .filter((entry) => entry.delayMs === 1000)
        .map((entry) => entry.timerId);
      expect(oneSecondIntervalIds.length).toBe(2);

      await act(async () => view.unmount());

      for (const timerId of oneSecondIntervalIds) {
        expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
      }
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
