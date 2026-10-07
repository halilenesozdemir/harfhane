import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, Share } from 'react-native';
import { generateShareText } from '@harfhane/shared';
import { GameOverCard } from './GameOverCard';
import type { GameOverCardProps } from './GameOverCard';
import { createMemoryStore, flattenStyle, renderWithTheme } from '../test-utils/render-with-theme';
import { getThemeColors } from '../theme';

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
    // One second before the next Turkey midnight (21:00 UTC): proves the countdown reads the
    // injected clock exactly, not just "some string".
    expect(await screen.findByTestId('gameover-countdown')).toHaveTextContent('00:00:01');
    expect(screen.queryByTestId('gameover-new-word')).toBeNull();

    // The Distribution section renders at all, with the just-won third bar highlighted: kills
    // mutants that drop the <Distribution/> line entirely or force isWon to false.
    const thirdFill = await screen.findByTestId('gameover-distribution-3-fill');
    expect(within(thirdFill).getByText('1')).toBeTruthy();
    const colors = getThemeColors({ scheme: 'light', isHighContrast: false });
    expect(flattenStyle(thirdFill.props.style)['backgroundColor']).toBe(colors.correct);

    const shareButton = screen.getByTestId('gameover-share');
    await act(async () => fireEvent.press(shareButton));
    // Full-text equality (not a substring match) kills mutants that would flip `won`, or empty
    // out `guesses`/`evaluations`, while still producing a string containing "Harfhane #3".
    const expectedShareText = generateShareText(guesses, evaluations, '#3', true);
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ message: expectedShareText }));
  });

  it('should show the solution when a daily game is lost', async () => {
    await renderCard({ gameStatus: 'lost', guesses: [], evaluations: [] });
    expect(await screen.findByText('Kelime: KALEM')).toBeTruthy();
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
    // 18:59:58Z is 2h 0m 2s before the next Turkey midnight (21:00 UTC): a distinct value in
    // every field, so swapping hours/minutes (or minutes/seconds) in the countdown string would
    // produce a visibly different, wrong string ("00:02:02" or "02:02:00") instead of this one.
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
    // v14 RNTL only renders host elements, so this checks the native host component name:
    // "RCTScrollView" is React Native's scroll container, not a plain "RCTView".
    const card = screen.getByTestId('gameover-card');
    expect(card.type).toBe('RCTScrollView');
  });

  it('should show an exact, known win title when the mode/guess-count/seed combination is fixed', async () => {
    // mode unlimited, wordId 0 (seed 0), guessCount 2: WIN_MESSAGE_VARIANTS[2][0] === 'Harika!'.
    // Pinning the literal string (not calling selectResultMessage here) guards against an
    // accidental reordering of the variants silently changing what players see.
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
});
