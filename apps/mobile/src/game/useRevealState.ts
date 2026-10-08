import { useEffect, useState } from 'react';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';
import type { GameSession } from './game-session';

export interface RevealState {
  readonly isRevealing: boolean;
  readonly shakeRow: boolean;
  readonly celebrateRow: boolean;
}

const STAGGER_MS = parseMs(base.motionStagger);
const FLIP_MS = parseMs(base.motionFlip);
const SHAKE_MS = parseMs(base.motionShake);
const BOUNCE_MS = parseMs(base.motionBounce);

function revealDurationMs(wordLength: number): number {
  return wordLength * STAGGER_MS + FLIP_MS;
}

// Flip plays for the row just committed, then — only when that row won the game — the tiles
// bounce once in a wave (an owner-requested "wow" touch beyond R2's letter).
function useRevealTiming(session: GameSession, wordLength: number, reduceMotion: boolean) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [celebrateRow, setCelebrateRow] = useState(false);
  const [prevGuessCount, setPrevGuessCount] = useState(session.game.guesses.length);

  // Adjust state when a new row is committed (React's "adjusting state when a prop changes"
  // pattern) instead of setting it from inside the effect below.
  const guessCount = session.game.guesses.length;
  if (guessCount !== prevGuessCount) {
    const rowAdded = guessCount > prevGuessCount;
    setPrevGuessCount(guessCount);
    if (rowAdded && !reduceMotion) setIsRevealing(true);
  }

  useEffect(() => {
    if (!isRevealing) return undefined;
    const revealTimer = setTimeout(() => {
      setIsRevealing(false);
      if (session.game.gameStatus !== 'won') return;
      setCelebrateRow(true);
      setTimeout(() => setCelebrateRow(false), wordLength * STAGGER_MS + BOUNCE_MS);
    }, revealDurationMs(wordLength));
    return () => clearTimeout(revealTimer);
  }, [isRevealing, wordLength, session.game.gameStatus]);

  return { isRevealing, celebrateRow };
}

// A rejection (too-short guess, an unlisted word, a connection error) leaves the row's guess
// count unchanged but bumps rejectionCount — that is what tells this apart from a row that was
// just committed (which also sets a message, but with the guess count moving forward).
// rejectionCount, not message identity, drives this: useGame clears the message after 2s, so two
// rejections with the same text within that window must still both shake (web parity).
function useShakeTiming(session: GameSession, reduceMotion: boolean) {
  const [shakeRow, setShakeRow] = useState(false);
  const [prevGuessCount, setPrevGuessCount] = useState(session.game.guesses.length);
  const [prevRejectionCount, setPrevRejectionCount] = useState(session.rejectionCount);

  const guessCount = session.game.guesses.length;
  if (guessCount !== prevGuessCount || session.rejectionCount !== prevRejectionCount) {
    const rowUnchanged = guessCount === prevGuessCount;
    const rejectionIncreased = session.rejectionCount > prevRejectionCount;
    setPrevGuessCount(guessCount);
    setPrevRejectionCount(session.rejectionCount);
    if (!reduceMotion && rejectionIncreased && rowUnchanged && session.game.gameStatus === 'playing') {
      setShakeRow(true);
    }
  }

  useEffect(() => {
    if (!shakeRow) return undefined;
    const shakeTimer = setTimeout(() => setShakeRow(false), SHAKE_MS);
    return () => clearTimeout(shakeTimer);
  }, [shakeRow]);

  return shakeRow;
}

export function useRevealState(session: GameSession, wordLength: number, reduceMotion: boolean): RevealState {
  const { isRevealing, celebrateRow } = useRevealTiming(session, wordLength, reduceMotion);
  const shakeRow = useShakeTiming(session, reduceMotion);
  return { isRevealing, shakeRow, celebrateRow };
}
