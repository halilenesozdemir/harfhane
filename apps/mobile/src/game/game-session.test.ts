import { describe, expect, it } from 'vitest';
import { createInitialState } from './game-state';
import { createSession, reduceSession, submitBlocker } from './game-session';
import type { GameSession, SessionAction } from './game-session';

function readySession(): GameSession {
  return reduceSession(createSession(), { type: 'loaded', solution: 'KALEM', wordId: 7, game: createInitialState() });
}

function apply(session: GameSession, actions: readonly SessionAction[]): GameSession {
  return actions.reduce(reduceSession, session);
}

function typed(word: string): SessionAction[] {
  return word.split('').map((letter) => ({ type: 'letter', letter }));
}

describe('reduceSession', () => {
  it('should ignore typing while the word is loading', () => {
    expect(apply(createSession(), typed('K')).game.currentGuess).toBe('');
  });

  it('should limit typing to the solution length when ready', () => {
    expect(apply(readySession(), typed('KALEMLER')).game.currentGuess).toBe('KALEM');
  });

  it('should show a win message when the guess is correct', () => {
    const session = apply(readySession(), [...typed('KALEM'), { type: 'guess' }]);
    expect(session.game.gameStatus).toBe('won');
    expect(session.message).toBe('Muhteşem!');
  });

  it('should reveal the solution when the last guess is wrong', () => {
    const wrong = ['KALAY', 'KALIP', 'KALAS', 'KALIN', 'KALÇA', 'KALAN'].flatMap((word) => [...typed(word), { type: 'guess' } as const]);
    expect(apply(readySession(), wrong).message).toBe('Kelime: KALEM');
  });

  it('should start over when a new word is loading', () => {
    const session = apply(readySession(), [...typed('KAL'), { type: 'loading' }]);
    expect(session.phase).toBe('loading');
    expect(session.game.currentGuess).toBe('');
  });
});

describe('submitBlocker', () => {
  it('should ask for a full word when the row is not full', () => {
    expect(submitBlocker(apply(readySession(), typed('KAL')))).toBe('Kelime 5 harf olmalı');
  });

  it('should allow submitting when the row is full', () => {
    expect(submitBlocker(apply(readySession(), typed('KALEM')))).toBeNull();
  });

  it('should block silently when the game is over', () => {
    expect(submitBlocker(apply(readySession(), [...typed('KALEM'), { type: 'guess' }]))).toBe('');
  });
});
