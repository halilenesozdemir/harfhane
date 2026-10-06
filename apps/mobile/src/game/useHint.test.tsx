import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { loadRevealedHints, saveRevealedHints } from './game-storage';
import { useHint } from './useHint';

const TODAY = '2026-10-05';
const HINT_KEY = `harfhane:hint:anon:daily:${TODAY}:5`;

describe('useHint', () => {
  it('should reveal a letter at an unsolved position when the answer is KALEM and K and A are green (008-AE7)', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KALİP'] }),
    );
    expect(result.current.canReveal).toBe(true);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toHaveLength(1);
    const [hint] = result.current.hints;
    expect(['L', 'E', 'M']).toContain(hint.letter);
    expect(hint.position).toBeGreaterThanOrEqual(2);
  });

  it('should do nothing on a second press once the free daily allowance is used (008-AE7)', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KALİP'] }),
    );
    await act(async () => result.current.revealHint());
    const firstHints = result.current.hints;
    expect(result.current.canReveal).toBe(false);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toEqual(firstHints);
  });

  it('should ignore the in-progress row and only treat submitted guesses as solved positions', async () => {
    const store = createMemoryStore();
    // Nothing submitted yet, even though a full (unsubmitted) guess of the solution could exist
    // in the caller's current-row state; useHint never receives that state, only `guesses`.
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: [] }),
    );
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toEqual([{ position: 0, letter: 'K' }]);
  });

  it('should disable reveal once every position is already solved by a submitted guess', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KALEM'] }),
    );
    expect(result.current.canReveal).toBe(false);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toHaveLength(0);
  });

  it('should persist the revealed position so reopening the app does not grant a new hint', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: [] }),
    );
    await act(async () => result.current.revealHint());
    await waitFor(async () => expect(await loadRevealedHints(store, HINT_KEY, 5)).toHaveLength(1));

    const { result: reopened } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: [] }),
    );
    await waitFor(() => expect(reopened.current.hints).toHaveLength(1));
    expect(reopened.current.canReveal).toBe(false);
  });

  it('should never allow a hint in unlimited mode', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'unlimited', wordLength: 5, dailyDate: null, solution: 'KALEM', guesses: [] }),
    );
    expect(result.current.canReveal).toBe(false);
    expect(result.current.allowance).toBe(0);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toHaveLength(0);
  });

  it('should not surface a daily hint in an unlimited game for the same date and word length', async () => {
    const store = createMemoryStore();
    await saveRevealedHints(store, HINT_KEY, [0]);
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'unlimited', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: [] }),
    );
    await waitFor(() => expect(result.current.hints).toHaveLength(0));
    expect(result.current.canReveal).toBe(false);
  });
});
