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
const today = () => TODAY;

beforeEach(() => {
  mockPerformAndroidHapticsAsync.mockClear();
});

function createApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: TODAY }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 42 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
    fetchPlayableLengths: jest.fn().mockResolvedValue({ lengths: [4, 5, 6] }),
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
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.guesses).toEqual(['KALAY', 'KALIP']);
    expect(result.current.session.game.evaluations).toHaveLength(2);
  });

  it('should apply a valid guess and save the daily game', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    await waitFor(async () => expect(JSON.parse((await store.getItem(DAILY_KEY)) ?? '{}').guesses).toEqual(['KALEM']));
  });

  it('should trigger the confirm haptic exactly once when a guess wins the game', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('confirm');
    expect(mockPerformAndroidHapticsAsync.mock.calls.filter((call) => call[0] === 'confirm')).toHaveLength(1);
  });

  it('should not trigger the confirm haptic when haptics are disabled', async () => {
    const store = createMemoryStore({ 'harfhane:haptics': 'false' });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALEM');
    await waitFor(() => expect(result.current.session.game.gameStatus).toBe('won'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('confirm');
  });

  it('should not trigger the reject haptic when haptics are disabled', async () => {
    const store = createMemoryStore({ 'harfhane:haptics': 'false' });
    const api = createApi({ validateWord: jest.fn().mockResolvedValue({ isValid: false }) });
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
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
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.gameStatus).toBe('won');
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('confirm');
  });

  it('should not trigger a win haptic when the game is lost', async () => {
    const store = createMemoryStore();
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
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
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Kelime listede yok'));
    expect(result.current.session.game.currentGuess).toBe('KALAY');
    expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('reject');
  });

  it('should trigger the reject haptic for a too-short guess without calling the API', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
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

  it('should show a connection message when validation fails', async () => {
    const api = createApi({ validateWord: jest.fn().mockRejectedValue(new Error('offline')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Bağlantı hatası, tekrar dene'));
  });

  it('should not trigger the reject haptic when validation fails with a network error', async () => {
    const api = createApi({ validateWord: jest.fn().mockRejectedValue(new Error('offline')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Bağlantı hatası, tekrar dene'));
    expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalledWith('reject');
  });

  it('should validate once when submit is tapped twice quickly', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
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
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
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

  it('should keep saving to the day the word was loaded for after midnight', async () => {
    let day = '2026-10-05';
    const clock = () => day;
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today: clock }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    day = '2026-10-06';
    await typeAndSubmit(result, 'KALAY');
    await waitFor(async () => expect(JSON.parse((await store.getItem(DAILY_KEY)) ?? '{}').guesses).toEqual(['KALAY']));
    expect(await store.getItem('harfhane:game:anon:2026-10-06:5')).toBeNull();
    expect(result.current.session.dailyDate).toBe('2026-10-05');
  });

  it('should report an error when the word cannot be loaded', async () => {
    const api = createApi({ fetchDailyWord: jest.fn().mockRejectedValue(new Error('down')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('error'));
  });

  it('should load a new random word when a new unlimited game starts', async () => {
    const api = createApi();
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'unlimited', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.solution).toBe('KİTAP'));
    await act(async () => {
      result.current.startNewGame();
    });
    await waitFor(() => expect(api.fetchRandomWord).toHaveBeenCalledTimes(2));
  });
});
