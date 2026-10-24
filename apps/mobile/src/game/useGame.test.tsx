import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ApiClient } from '../lib/api';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { useGame } from './useGame';

const mockPerformAndroidHapticsAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  AndroidHaptics: { Keyboard_Tap: 'keyboard-tap', Confirm: 'confirm', Reject: 'reject' },
  performAndroidHapticsAsync: (...args: unknown[]) => mockPerformAndroidHapticsAsync(...args),
}));

const TODAY = '2026-10-05';
const DAILY_KEY = `harfhane:game:anon:${TODAY}:5`;

beforeEach(() => {
  mockPerformAndroidHapticsAsync.mockClear();
});

function createApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: TODAY }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 42 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
    fetchPlayableLengths: jest.fn().mockResolvedValue({ lengths: [4, 5, 6] }),
    submitFeedback: jest.fn(),
    ...overrides,
  };
}

async function typeAndSubmit(result: { current: ReturnType<typeof useGame> }, word: string) {
  await act(async () => {
    word.split('').forEach((letter) => result.current.onLetter(letter));
  });
  await act(async () => {
    result.current.onSubmit();
  });
}

describe('useGame', () => {
  it('should restore both guesses on the board when the app restarts after two guesses (004-AE3)', async () => {
    const saved = {
      guesses: ['KALAY', 'KALIP'],
      evaluations: [
        ['correct', 'correct', 'correct', 'absent', 'absent'],
        ['correct', 'correct', 'absent', 'absent', 'absent'],
      ],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
    };
    const store = createMemoryStore({ [DAILY_KEY]: JSON.stringify(saved) });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.guesses).toEqual(['KALAY', 'KALIP']);
    expect(result.current.session.game.evaluations).toHaveLength(2);
  });

  it('should use the server gameNumber and date over a previously stored one', async () => {
    const saved = {
      guesses: [],
      evaluations: [],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
      gameNumber: 1,
      date: '2026-10-01',
    };
    const store = createMemoryStore({ [DAILY_KEY]: JSON.stringify(saved) });
    const api = createApi({ fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 7, date: TODAY }) });
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.gameNumber).toBe(7);
    expect(result.current.session.game.date).toBe(TODAY);
  });

  it('should apply a valid guess and save the daily game', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    await waitFor(async () => expect(JSON.parse((await store.getItem(DAILY_KEY)) ?? '{}').guesses).toEqual(['KALEM']));
  });

  it('should trigger the confirm haptic exactly once when a guess wins the game', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('confirm');
    expect(mockPerformAndroidHapticsAsync.mock.calls.filter((call) => call[0] === 'confirm')).toHaveLength(1);
  });

  it('should not trigger the confirm haptic when haptics are disabled', async () => {
    const store = createMemoryStore({ 'harfhane:haptics': 'false' });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('confirm');
  });

  it('should not trigger the reject haptic when haptics are disabled', async () => {
    const store = createMemoryStore({ 'harfhane:haptics': 'false' });
    const api = createApi({ validateWord: jest.fn().mockResolvedValue({ isValid: false }) });
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Kelime listede yok'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('reject');
  });

  it('should not trigger a win haptic when a saved already-won game is restored', async () => {
    const saved = {
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      currentGuess: '',
      gameStatus: 'won',
      keyboardStatus: {},
    };
    const store = createMemoryStore({ [DAILY_KEY]: JSON.stringify(saved) });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.gameStatus).toBe('won');
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('confirm');
  });

  it('should not trigger a win haptic when the game is lost', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    const wrongGuesses = ['KALAY', 'KALIP', 'KAPAK', 'KOYUN', 'TAVUK', 'SEPET'];
    for (const guess of wrongGuesses) {
      await typeAndSubmit(result, guess);
    }
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('lost'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('confirm');
  });

  it('should show a message and keep the row when the word is not in the list', async () => {
    const api = createApi({ validateWord: jest.fn().mockResolvedValue({ isValid: false }) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Kelime listede yok'));
    expect(result.current.session.game.currentGuess).toBe('KALAY');
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('reject');
  });

  it('should trigger the reject haptic for a too-short guess without calling the API', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await act(async () => {
      'KAL'.split('').forEach((letter) => result.current.onLetter(letter));
    });
    await act(async () => {
      result.current.onSubmit();
    });
    expect(api.validateWord).not.toHaveBeenCalled();
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('reject');
  });

  it('should not trigger the reject haptic when haptics are off and the guess is too short', async () => {
    const api = createApi();
    const store = createMemoryStore({ 'harfhane:haptics': 'false' });
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await act(async () => {
      'KAL'.split('').forEach((letter) => result.current.onLetter(letter));
    });
    await act(async () => {
      result.current.onSubmit();
    });
    expect(api.validateWord).not.toHaveBeenCalled();
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('reject');
  });

  it('should show a connection message when validation fails', async () => {
    const api = createApi({ validateWord: jest.fn().mockRejectedValue(new Error('offline')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Bağlantı hatası, tekrar dene'));
  });

  it('should not trigger the reject haptic when validation fails with a network error', async () => {
    const api = createApi({ validateWord: jest.fn().mockRejectedValue(new Error('offline')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Bağlantı hatası, tekrar dene'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('reject');
  });

  it('should validate once when submit is tapped twice quickly', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await act(async () => {
      'KALAY'.split('').forEach((letter) => result.current.onLetter(letter));
    });
    await act(async () => {
      result.current.onSubmit();
      result.current.onSubmit();
    });
    expect(api.validateWord).toHaveBeenCalledTimes(1);
  });

  it('should trigger the reject haptic only once when submit is tapped twice while a rejected guess is in flight', async () => {
    const api = createApi({ validateWord: jest.fn().mockResolvedValue({ isValid: false }) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await act(async () => {
      'KALAY'.split('').forEach((letter) => result.current.onLetter(letter));
    });
    await act(async () => {
      result.current.onSubmit();
      result.current.onSubmit();
    });
    expect(api.validateWord).toHaveBeenCalledTimes(1);
    expect(mockPerformAndroidHapticsAsync.mock.calls.filter((call) => call[0] === 'reject')).toHaveLength(1);
  });

  it('should keep saving to the day the word was loaded for, regardless of what happens afterward', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(async () => expect(JSON.parse((await store.getItem(DAILY_KEY)) ?? '{}').guesses).toEqual(['KALAY']));
    expect(await store.getItem('harfhane:game:anon:2026-10-06:5')).toBeNull();
    expect(result.current.session.dailyDate).toBe('2026-10-05');
  });

  it('should key daily storage by the server date', async () => {
    // loadSession keys the storage entry and session.dailyDate from the server's own
    // /words/daily response (TODAY here), never a device clock — useGame no longer even
    // accepts one (see useGame.ts's loadSession; a device clock that disagreed with the
    // server used to create a fresh, device-dated entry for the still-unchanged server word,
    // which the player would then replay and have double-counted in stats).
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.dailyDate).toBe(TODAY);
    await typeAndSubmit(result, 'KALAY');
    await waitFor(async () => expect(JSON.parse((await store.getItem(DAILY_KEY)) ?? '{}').guesses).toEqual(['KALAY']));
  });

  it('should restore the same finished game, not a fresh board, when reloaded for the same server date', async () => {
    // A finished daily game was already saved under the server's date (TODAY). Loading again
    // (e.g. pressing the game-over midnight CTA before the server has rolled over to a new
    // word) must restore that same finished entry, not an empty board under a fresh key —
    // otherwise the player would replay the identical word and double-count the result.
    const finished = {
      guesses: ['KALEM'],
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
      currentGuess: '',
      gameStatus: 'won',
      keyboardStatus: {},
    };
    const store = createMemoryStore({ [DAILY_KEY]: JSON.stringify(finished) });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.gameStatus).toBe('won');
    expect(result.current.session.game.guesses).toEqual(['KALEM']);
    expect(result.current.session.dailyDate).toBe(TODAY);
  });

  it('should report an error when the word cannot be loaded', async () => {
    const api = createApi({ fetchDailyWord: jest.fn().mockRejectedValue(new Error('down')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.phase).toBe('error'));
  });

  it('should load a new random word when a new unlimited game starts', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'unlimited', wordLength: 5, api, store }));
    await waitFor(() => expect(result.current.session.solution).toBe('KİTAP'));
    await act(async () => {
      result.current.startNewGame();
    });
    await waitFor(() => expect(api.fetchRandomWord).toHaveBeenCalledTimes(2));
  });
});
