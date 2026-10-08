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
    rejectionCount: 0,
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

  it('should unblock Enter at the last tile\'s colour midpoint, before the row\'s full flip settles (M4 exception)', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const committed = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'playing' } });
    await act(async () => rerender({ session: committed, reduceMotion: false }));
    expect(result.current.isEnterBlocked).toBe(true);

    const enterUnblockMs = (WORD_LENGTH - 1) * STAGGER_MS + FLIP_MS / 2;
    await act(async () => jest.advanceTimersByTime(enterUnblockMs - 1));
    expect(result.current.isEnterBlocked).toBe(true);
    // Still revealing (the full flip has not settled) even though Enter has just unblocked.
    expect(result.current.isRevealing).toBe(true);

    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current.isEnterBlocked).toBe(false);
  });

  it('should not block Enter when reduce motion is enabled', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: true });
    const committed = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'playing' } });
    await act(async () => rerender({ session: committed, reduceMotion: true }));
    expect(result.current.isEnterBlocked).toBe(false);
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

  it('should restart its reveal timer when a new row commits while the previous row is still revealing (B1)', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const row0 = makeSession({
      game: { ...makeSession().game, guesses: ['KABAK'], evaluations: [['correct', 'correct', 'absent', 'correct', 'correct']], gameStatus: 'playing' },
    });
    await act(async () => rerender({ session: row0, reduceMotion: false }));
    expect(result.current.isRevealing).toBe(true);

    // Commit row 1 right when row 0's Enter unblocks (M4), well before row 0's own reveal window
    // (STAGGER_MS * WORD_LENGTH + FLIP_MS) would end on its own.
    const enterUnblockMs = (WORD_LENGTH - 1) * STAGGER_MS + FLIP_MS / 2;
    await act(async () => jest.advanceTimersByTime(enterUnblockMs));
    const row1 = makeSession({
      game: {
        ...makeSession().game,
        guesses: ['KABAK', 'KAPAK'],
        evaluations: [row0.game.evaluations[0] ?? [], ['correct', 'correct', 'correct', 'correct', 'correct']],
        gameStatus: 'playing',
      },
    });
    await act(async () => rerender({ session: row1, reduceMotion: false }));
    expect(result.current.isRevealing).toBe(true);

    // At this point row 0's own (un-restarted) timer would already have fired — only a restarted
    // timer, driven by row 1's own commit, keeps isRevealing true here.
    await act(async () => jest.advanceTimersByTime(400));
    expect(result.current.isRevealing).toBe(true);
  });

  it('should clear its pending bounce timer on unmount, not merely leave it to fire after the component is gone', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    try {
      const { result, rerender, unmount } = await setup({ session: makeSession(), reduceMotion: false });
      const won = makeSession({ game: { ...makeSession().game, guesses: ['KAPAK'], evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']], gameStatus: 'won' } });
      await act(async () => rerender({ session: won, reduceMotion: false }));
      // Let the reveal flip finish and the bounce start, but unmount before the bounce's own timer fires.
      await act(async () => jest.advanceTimersByTime(WORD_LENGTH * STAGGER_MS + FLIP_MS));
      expect(result.current.celebrateRow).toBe(true);

      const bounceDurationMs = WORD_LENGTH * STAGGER_MS + BOUNCE_MS;
      const bounceCallIndex = setTimeoutSpy.mock.calls.findIndex(([, ms]) => ms === bounceDurationMs);
      expect(bounceCallIndex).toBeGreaterThanOrEqual(0);
      const bounceTimerId = setTimeoutSpy.mock.results[bounceCallIndex]?.value;

      await act(async () => unmount());
      // A cleared bounce timer must be gone, not merely left to fire its (now pointless)
      // setCelebrateRow(false) later — compared by reference (===), since two distinct Timeout
      // objects can print identically without being the same pending timer.
      const clearedTheBounceTimer = clearTimeoutSpy.mock.calls.some((call) => call[0] === bounceTimerId);
      expect(clearedTheBounceTimer).toBe(true);
    } finally {
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    }
  });


  it('should shake the current row when a guess is rejected without adding a row', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const rejected = makeSession({ message: 'Kelime listede yok', rejectionCount: 1 });
    await act(async () => rerender({ session: rejected, reduceMotion: false }));
    expect(result.current.shakeRow).toBe(true);
    await act(async () => jest.advanceTimersByTime(SHAKE_MS));
    expect(result.current.shakeRow).toBe(false);
  });

  it('should shake again on a second rejection with the same message text within useGame\'s 2s message window', async () => {
    const { result, rerender } = await setup({ session: makeSession(), reduceMotion: false });
    const firstRejection = makeSession({ message: 'Kelime listede yok', rejectionCount: 1 });
    await act(async () => rerender({ session: firstRejection, reduceMotion: false }));
    expect(result.current.shakeRow).toBe(true);
    await act(async () => jest.advanceTimersByTime(SHAKE_MS));
    expect(result.current.shakeRow).toBe(false);

    // Same message text, still displayed (useGame only clears it after 2s) — only rejectionCount
    // moved, which is exactly what a message-identity check would miss.
    const secondRejection = makeSession({ message: 'Kelime listede yok', rejectionCount: 2 });
    await act(async () => rerender({ session: secondRejection, reduceMotion: false }));
    expect(result.current.shakeRow).toBe(true);
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
    const rejected = makeSession({ message: 'Kelime listede yok', rejectionCount: 1 });
    await act(async () => rerender({ session: rejected, reduceMotion: true }));
    expect(result.current.shakeRow).toBe(false);
  });
});
