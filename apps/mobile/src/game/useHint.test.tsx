import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { loadRevealedHints, saveRevealedHints } from './game-storage';
import { useHint } from './useHint';
import { useEntitlements } from './useEntitlements';
import type { KeyValueStore } from './game-storage';

jest.mock('./useEntitlements', () => ({ useEntitlements: jest.fn(() => ({ isSupporter: false })) }));

const TODAY = '2026-10-05';
const HINT_KEY = `harfhane:hint:anon:daily:${TODAY}:5`;

function createDelayedStore(): { store: KeyValueStore; resolveLoad: (value: string | null) => void; setItem: jest.Mock } {
  let resolveLoad: (value: string | null) => void = () => undefined;
  const setItem = jest.fn().mockResolvedValue(undefined);
  const store: KeyValueStore = {
    getItem: () => new Promise((resolve) => { resolveLoad = resolve; }),
    setItem,
  };
  return { store, resolveLoad: (value) => resolveLoad(value), setItem };
}

describe('useHint', () => {
  beforeEach(() => {
    (useEntitlements as jest.Mock).mockReturnValue({ isSupporter: false });
  });

  it('should read the supporter allowance from useEntitlements instead of a hardcoded literal', async () => {
    (useEntitlements as jest.Mock).mockReturnValue({ isSupporter: true });
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KAPAK'] }),
    );
    // Free allowance is 1; a hardcoded literal would report allowance 1 here too.
    expect(result.current.allowance).toBe(3);
  });

  it('should reveal a letter at an unsolved position when the answer is KALEM and K and A are green (008-AE7)', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KAPAK'] }),
    );
    expect(result.current.canReveal).toBe(true);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toEqual([{ position: 2, letter: 'L' }]);
  });

  it('should do nothing on a second press once the free daily allowance is used (008-AE7)', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: ['KAPAK'] }),
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

  it('should refuse to reveal and never overwrite storage until the stored positions have finished loading', async () => {
    const { store, resolveLoad, setItem } = createDelayedStore();
    const { result } = await renderHook(() =>
      useHint({ store, mode: 'daily', wordLength: 5, dailyDate: TODAY, solution: 'KALEM', guesses: [] }),
    );

    // The load is still pending: an early tap must be a no-op, not a second hint.
    expect(result.current.canReveal).toBe(false);
    await act(async () => result.current.revealHint());
    expect(result.current.hints).toHaveLength(0);
    expect(setItem).not.toHaveBeenCalled();

    await act(async () => resolveLoad(JSON.stringify([0])));
    await waitFor(() => expect(result.current.hints).toHaveLength(1));

    // Once loaded, position 0 was already used by (hypothetically) a previous session.
    expect(result.current.hints).toEqual([{ position: 0, letter: 'K' }]);
    expect(result.current.canReveal).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });
});
