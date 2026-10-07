import { act, renderHook } from '@testing-library/react-native';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';
import { useRevealState } from './useRevealState';
import type { GameSession } from './game-session';

const STAGGER_MS = parseMs(base.motionStagger);
const FLIP_MS = parseMs(base.motionFlip);
const SHAKE_MS = parseMs(base.motionShake);
const BOUNCE_MS = parseMs(base.motionBounce);
const WORD_LENGTH = 5;

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    phase: 'ready',
    solution: 'KAPAK',
    wordId: null,
    game: {
      guesses: [],
      evaluations: [],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
    },
    message: null,
    isSubmitting: false,
    storageKey: null,
    dailyDate: null,
    ...overrides,
  };
}

interface Props {
  readonly session: GameSession;
  readonly reduceMotion: boolean;
}

async function setup(initial: Props) {
  return renderHook((props: Props) => useRevealState(props.session, WORD_LENGTH, props.reduceMotion), {
    initialProps: initial,
  });
}

describe('useRevealState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start revealing as soon as a new guess row is committed', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const committed = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'won' } });
    await act(async () => rerender({ session: committed, reduceMotion: false }));
    expect(result.current.isRevealing).toBe(true);
  });

  it('should stop revealing once the full flip duration elapses', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const committed = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'playing' } });
    await act(async () => rerender({ session: committed, reduceMotion: false }));
    expect(result.current.isRevealing).toBe(true);
    await act(async () => jest.advanceTimersByTime(WORD_LENGTH * STAGGER_MS + FLIP_MS));
    expect(result.current.isRevealing).toBe(false);
  });

  it('should not start revealing when reduce motion is enabled (011-AE2)', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: true });
    const committed = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'playing' } });
    await act(async () => rerender({ session: committed, reduceMotion: true }));
    expect(result.current.isRevealing).toBe(false);
  });

  it('should bounce the winning row in a wave once its flip finishes', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const won = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'won' } });
    await act(async () => rerender({ session: won, reduceMotion: false }));
    expect(result.current.celebrateRow).toBe(false);
    await act(async () => jest.advanceTimersByTime(WORD_LENGTH * STAGGER_MS + FLIP_MS));
    expect(result.current.celebrateRow).toBe(true);
    await act(async () => jest.advanceTimersByTime(WORD_LENGTH * STAGGER_MS + BOUNCE_MS));
    expect(result.current.celebrateRow).toBe(false);
  });

  it('should not bounce a row that keeps the game playing', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const stillPlaying = makeSession({ game: { ...makeSession().game, guesses: ['KABAK'], evaluations: [['correct', 'correct', 'absent', 'correct', 'correct']], gameStatus: 'playing' } });
    await act(async () => rerender({ session: stillPlaying, reduceMotion: false }));
    await act(async () => jest.advanceTimersByTime(WORD_LENGTH * STAGGER_MS + FLIP_MS + BOUNCE_MS));
    expect(result.current.celebrateRow).toBe(false);
  });

  it('should shake the current row when a guess is rejected without adding a row', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const rejected = makeSession({ message: 'Kelime listede yok' });
    await act(async () => rerender({ session: rejected, reduceMotion: false }));
    expect(result.current.shakeRow).toBe(true);
    await act(async () => jest.advanceTimersByTime(SHAKE_MS));
    expect(result.current.shakeRow).toBe(false);
  });

  it('should not shake when the message change comes from a newly committed winning row', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const won = makeSession({
      message: 'Muhteşem!',
      game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'won' },
    });
    await act(async () => rerender({ session: won, reduceMotion: false }));
    expect(result.current.shakeRow).toBe(false);
  });

  it('should not shake when reduce motion is enabled', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: true });
    const rejected = makeSession({ message: 'Kelime listede yok' });
    await act(async () => rerender({ session: rejected, reduceMotion: true }));
    expect(result.current.shakeRow).toBe(false);
  });
});
