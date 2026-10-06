import { describe, expect, it } from 'vitest';
import { addLetter, applyGuess, createInitialState } from './game-state';
import { loadGameState, saveGameState } from './game-storage';
import type { KeyValueStore } from './game-storage';

const KEY = 'harfhane:game:anon:2026-10-05:5';

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

function playGuess(word: string) {
  const typed = word.split('').reduce((state, letter) => addLetter(state, letter, word.length), createInitialState());
  return applyGuess(typed, 'KALEM');
}

describe('game storage', () => {
  it('should restore both guesses after a restart when two guesses were saved', async () => {
    const store = createMemoryStore();
    const twoGuesses = applyGuess({ ...playGuess('KALAY'), currentGuess: 'KALIP' }, 'KALEM');
    await saveGameState(store, KEY, twoGuesses);
    const restored = await loadGameState(store, KEY);
    expect(restored.guesses).toEqual(['KALAY', 'KALIP']);
    expect(restored.evaluations).toHaveLength(2);
  });

  it('should return a fresh game when nothing is stored', async () => {
    expect(await loadGameState(createMemoryStore(), KEY)).toEqual(createInitialState());
  });

  it('should return a fresh game when the stored value is not a game state', async () => {
    const store = createMemoryStore({ [KEY]: '{"guesses":"oops"}' });
    expect(await loadGameState(store, KEY)).toEqual(createInitialState());
  });

  it('should return a fresh game when an evaluation row holds unknown statuses', async () => {
    const stored = { guesses: ['KALAY'], evaluations: [1], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} };
    const store = createMemoryStore({ [KEY]: JSON.stringify(stored) });
    expect(await loadGameState(store, KEY)).toEqual(createInitialState());
  });

  it('should return a fresh game when a keyboard status is unknown', async () => {
    const stored = { guesses: [], evaluations: [], currentGuess: '', gameStatus: 'playing', keyboardStatus: { K: 'green' } };
    const store = createMemoryStore({ [KEY]: JSON.stringify(stored) });
    expect(await loadGameState(store, KEY)).toEqual(createInitialState());
  });

  it('should return a fresh game when the stored value is not JSON', async () => {
    expect(await loadGameState(createMemoryStore({ [KEY]: '{' }), KEY)).toEqual(createInitialState());
  });
});
