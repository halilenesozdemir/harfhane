import { describe, expect, it } from 'vitest';
import { createInitialState } from './game-state';
import { createSession, reduceSession, submitBlocker } from './game-session';
import type { GameSession, SessionAction } from './game-session';

function readySession(): GameSession {
  return reduceSession(createSession(), {
    type: 'loaded',
    solution: 'KALEM',
    wordId: 7,
    game: createInitialState(),
    storageKey: 'key-5',
    dailyDate: '2026-10-05',
  });
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
    const session = apply(readySession(), [...typed('KALEM'), { type: 'submitted' }, { type: 'guess', word: 'KALEM' }]);
    expect(session.game.gameStatus).toBe('won');
    expect(session.message).toBe('Muhteşem!');
  });

  it('should reveal the solution when the last guess is wrong', () => {
    const wrong = ['KALAY', 'KALIP', 'KALAS', 'KALIN', 'KALÇA', 'KALAN'].flatMap((word) => [...typed(word), { type: 'submitted' } as const, { type: 'guess', word } as const]);
    expect(apply(readySession(), wrong).message).toBe('Kelime: KALEM');
  });

  it('should start over when a new word is loading', () => {
    const session = apply(readySession(), [...typed('KAL'), { type: 'loading' }]);
    expect(session.phase).toBe('loading');
    expect(session.game.currentGuess).toBe('');
  });
});

describe('pending submissions', () => {
  it('should apply the validated word even when the row changed meanwhile', () => {
    const session = apply(readySession(), [...typed('KALEM'), { type: 'submitted' }, { type: 'guess', word: 'KALEM' }]);
    expect(session.game.guesses).toEqual(['KALEM']);
    expect(session.isSubmitting).toBe(false);
  });

  it('should ignore typing while a guess is being validated', () => {
    const session = apply(readySession(), [...typed('KALEM'), { type: 'submitted' }, { type: 'delete' }, ...typed('Y')]);
    expect(session.game.currentGuess).toBe('KALEM');
  });

  it('should block a second submit while the first is pending', () => {
    expect(submitBlocker(apply(readySession(), [...typed('KALEM'), { type: 'submitted' }]))).toBe('');
  });

  it('should release the row with a message when the word is rejected', () => {
    const session = apply(readySession(), [...typed('KALAY'), { type: 'submitted' }, { type: 'rejected', message: 'Kelime listede yok' }]);
    expect(session.isSubmitting).toBe(false);
    expect(session.message).toBe('Kelime listede yok');
    expect(apply(session, [{ type: 'delete' }]).game.currentGuess).toBe('KALA');
  });

  it('should increment rejectionCount when a rejected word sets a message (M5)', () => {
    const session = apply(readySession(), [...typed('KALAY'), { type: 'submitted' }, { type: 'rejected', message: 'Kelime listede yok' }]);
    expect(session.rejectionCount).toBe(1);
  });

  it('should increment rejectionCount when the too-short blocker message is dispatched (M5)', () => {
    // submitBlocker returns the too-short message; useGame dispatches it as a plain 'message'
    // action (the row is too short to even attempt a submit) — this must shake the row too.
    const session = apply(readySession(), [{ type: 'message', message: 'Kelime 5 harf olmalı' }]);
    expect(session.rejectionCount).toBe(1);
  });

  it('should not increment rejectionCount when a message is cleared (set to null)', () => {
    const rejected = apply(readySession(), [{ type: 'message', message: 'Kelime 5 harf olmalı' }]);
    const cleared = apply(rejected, [{ type: 'message', message: null }]);
    expect(cleared.rejectionCount).toBe(1);
  });

  it('should not increment rejectionCount when a guess wins or continues the game', () => {
    const session = apply(readySession(), [...typed('KALEM'), { type: 'submitted' }, { type: 'guess', word: 'KALEM' }]);
    expect(session.rejectionCount).toBe(0);
  });

  it('should keep the storage key chosen when the word loaded', () => {
    expect(readySession().storageKey).toBe('key-5');
  });

  it('should keep the date the word loaded on, separate from when the game finishes', () => {
    expect(readySession().dailyDate).toBe('2026-10-05');
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
    expect(submitBlocker(apply(readySession(), [...typed('KALEM'), { type: 'submitted' }, { type: 'guess', word: 'KALEM' }]))).toBe('');
  });
});
