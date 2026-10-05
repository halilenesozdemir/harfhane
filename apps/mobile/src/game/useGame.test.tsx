import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ApiClient } from '../lib/api';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { useGame } from './useGame';

const TODAY = '2026-10-05';
const DAILY_KEY = `harfhane:game:anon:${TODAY}:5`;
const today = () => TODAY;

function createApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: TODAY }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 42 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
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
  it('should restore a saved daily game when the app reopens', async () => {
    const saved = { guesses: ['KALAY'], evaluations: [['correct', 'correct', 'correct', 'absent', 'absent']], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} };
    const store = createMemoryStore({ [DAILY_KEY]: JSON.stringify(saved) });
    const api = createApi();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    expect(result.current.session.game.guesses).toEqual(['KALAY']);
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

  it('should show a message and keep the row when the word is not in the list', async () => {
    const api = createApi({ validateWord: jest.fn().mockResolvedValue({ isValid: false }) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Kelime listede yok'));
    expect(result.current.session.game.currentGuess).toBe('KALAY');
  });

  it('should show a connection message when validation fails', async () => {
    const api = createApi({ validateWord: jest.fn().mockRejectedValue(new Error('offline')) });
    const store = createMemoryStore();
    const { result } = await renderHook(() => useGame({ mode: 'daily', wordLength: 5, api, store, today }));
    await waitFor(() => expect(result.current.session.phase).toBe('ready'));
    await typeAndSubmit(result, 'KALAY');
    await waitFor(() => expect(result.current.session.message).toBe('Bağlantı hatası, tekrar dene'));
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
