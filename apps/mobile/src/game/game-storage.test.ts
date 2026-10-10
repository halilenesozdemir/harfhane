import { describe, expect, it } from 'vitest';
import { addLetter, applyGuess, createInitialState } from './game-state';
import { loadGameState, loadRevealedHints, saveGameState, saveRevealedHints } from './game-storage';
import type { KeyValueStore } from './game-storage';

const KEY = 'harfhane:game:anon:2026-10-05:5';
const HINT_KEY = 'harfhane:hint:anon:2026-10-05:5';
const HINT_WORD_LENGTH = 5;

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

  it('should restore the server gameNumber and date after a restart when they were saved', async () => {
    const store = createMemoryStore();
    const withServerFields = { ...playGuess('KALAY'), gameNumber: 7, date: '2026-10-05' };
    await saveGameState(store, KEY, withServerFields);
    const restored = await loadGameState(store, KEY);
    expect(restored.gameNumber).toBe(7);
    expect(restored.date).toBe('2026-10-05');
  });

  it('should return a fresh game when gameNumber is a string rather than a number', async () => {
    const stored = { ...playGuess('KALAY'), gameNumber: '7', date: '2026-10-05' };
    const store = createMemoryStore({ [KEY]: JSON.stringify(stored) });
    expect(await loadGameState(store, KEY)).toEqual(createInitialState());
  });

  it('should return a fresh game when date is a number rather than a string', async () => {
    const stored = { ...playGuess('KALAY'), gameNumber: 7, date: 20_261_005 };
    const store = createMemoryStore({ [KEY]: JSON.stringify(stored) });
    expect(await loadGameState(store, KEY)).toEqual(createInitialState());
  });

  it('should restore a game stored before gameNumber/date existed, leaving both undefined', async () => {
    const legacyStored = { guesses: ['KALAY'], evaluations: [['correct', 'correct', 'correct', 'absent', 'absent']], currentGuess: '', gameStatus: 'playing', keyboardStatus: { K: 'correct' } };
    const store = createMemoryStore({ [KEY]: JSON.stringify(legacyStored) });
    const restored = await loadGameState(store, KEY);
    expect(restored.guesses).toEqual(['KALAY']);
    expect(restored.gameNumber).toBeUndefined();
    expect(restored.date).toBeUndefined();
  });
});

describe('hint storage', () => {
  it('should restore revealed positions after a restart when one was saved', async () => {
    const store = createMemoryStore();
    await saveRevealedHints(store, HINT_KEY, [2]);
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([2]);
  });

  it('should return no revealed positions when nothing is stored', async () => {
    expect(await loadRevealedHints(createMemoryStore(), HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when the stored value is not a number array', async () => {
    const store = createMemoryStore({ [HINT_KEY]: '{"oops":true}' });
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when the stored value holds non-number entries', async () => {
    const store = createMemoryStore({ [HINT_KEY]: '["2"]' });
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when a position is negative', async () => {
    const store = createMemoryStore({ [HINT_KEY]: '[-1]' });
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when a position is not an integer', async () => {
    const store = createMemoryStore({ [HINT_KEY]: '[2.5]' });
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when a position is out of range for the word length', async () => {
    const store = createMemoryStore({ [HINT_KEY]: '[5]' });
    expect(await loadRevealedHints(store, HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });

  it('should return no revealed positions when the stored value is not JSON', async () => {
    expect(await loadRevealedHints(createMemoryStore({ [HINT_KEY]: '{' }), HINT_KEY, HINT_WORD_LENGTH)).toEqual([]);
  });
});
