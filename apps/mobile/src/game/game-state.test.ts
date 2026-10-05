import { describe, expect, it } from 'vitest';
import { addLetter, applyGuess, createInitialState, dailyGameKey, removeLetter } from './game-state';

const SOLUTION = 'KALEM';
const WORD_LENGTH = 5;

function typeWord(word: string) {
  return word.split('').reduce((state, letter) => addLetter(state, letter, WORD_LENGTH), createInitialState());
}

describe('addLetter', () => {
  it('should append a normalized letter when the row has room', () => {
    expect(addLetter(createInitialState(), 'i', WORD_LENGTH).currentGuess).toBe('İ');
  });

  it('should ignore letters when the row is full', () => {
    expect(addLetter(typeWord('KALEM'), 'A', WORD_LENGTH).currentGuess).toBe('KALEM');
  });

  it('should ignore letters when the game is over', () => {
    const won = applyGuess(typeWord('KALEM'), SOLUTION);
    expect(addLetter(won, 'A', WORD_LENGTH)).toBe(won);
  });
});

describe('removeLetter', () => {
  it('should drop the last letter of the current guess', () => {
    expect(removeLetter(typeWord('KAL')).currentGuess).toBe('KA');
  });
});

describe('applyGuess', () => {
  it('should record the guess, its evaluation and keyboard status, and clear the row', () => {
    const state = applyGuess(typeWord('KALAY'), SOLUTION);
    expect(state.guesses).toEqual(['KALAY']);
    expect(state.evaluations[0]).toEqual(['correct', 'correct', 'correct', 'absent', 'absent']);
    expect(state.keyboardStatus['K']).toBe('correct');
    expect(state.currentGuess).toBe('');
    expect(state.gameStatus).toBe('playing');
  });

  it('should mark the game won when the guess matches the solution', () => {
    expect(applyGuess(typeWord('KALEM'), SOLUTION).gameStatus).toBe('won');
  });

  it('should ignore the guess when it is shorter than the solution', () => {
    const partial = typeWord('KAL');
    expect(applyGuess(partial, SOLUTION)).toBe(partial);
  });

  it('should ignore further guesses when the game is over', () => {
    const won = applyGuess(typeWord('KALEM'), SOLUTION);
    expect(applyGuess({ ...won, currentGuess: 'KALAY' }, SOLUTION)).toEqual({ ...won, currentGuess: 'KALAY' });
  });

  it('should mark the game lost after six wrong guesses', () => {
    const guesses = ['KALAY', 'KALIP', 'KALAS', 'KALIN', 'KALÇA', 'KALAN'];
    const state = guesses.reduce((current, guess) => applyGuess({ ...current, currentGuess: guess }, SOLUTION), createInitialState());
    expect(state.gameStatus).toBe('lost');
  });
});

describe('dailyGameKey', () => {
  it('should match the web storage key for anonymous daily games', () => {
    expect(dailyGameKey('2026-10-05', WORD_LENGTH)).toBe('harfhane:game:anon:2026-10-05:5');
  });
});
