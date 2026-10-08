import { useEffect, useState } from 'react';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';
import type { GameSession } from './game-session';

export interface RevealState {
  readonly isRevealing: boolean;
  readonly shakeRow: boolean;
  readonly celebrateRow: boolean;
  // Shorter than isRevealing (docs/design/mobile-ui-standard.md M4 exception): the next guess
  // unlocks once the last tile's colour is visible, not once its flip has fully settled back.
  readonly isEnterBlocked: boolean;
}

const STAGGER_MS = parseMs(base.motionStagger);
const FLIP_MS = parseMs(base.motionFlip);
const FLIP_HALF_MS = FLIP_MS / 2;
const SHAKE_MS = parseMs(base.motionShake);
const BOUNCE_MS = parseMs(base.motionBounce);

function revealDurationMs(wordLength: number): number {
  return wordLength * STAGGER_MS + FLIP_MS;
}

// The last tile starts its flip after (wordLength - 1) stagger steps and shows its evaluated
// colour at that flip's midpoint — this is when the row reads as "done" to the player, even
// though its tile is still rotating back to flat.
function enterBlockDurationMs(wordLength: number): number {
  return (wordLength - 1) * STAGGER_MS + FLIP_HALF_MS;
}

// Flip plays for the row just committed, then — only when that row won the game — the tiles
// bounce once in a wave (an owner-requested "wow" touch beyond R2's letter).
function useRevealTiming(session: GameSession, wordLength: number, reduceMotion: boolean) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isEnterBlocked, setIsEnterBlocked] = useState(false);
  const [celebrateRow, setCelebrateRow] = useState(false);
  const [prevGuessCount, setPrevGuessCount] = useState(session.game.guesses.length);

  // Adjust state when a new row is committed (React's "adjusting state when a prop changes"
  // pattern) instead of setting it from inside the effect below.
  const guessCount = session.game.guesses.length;
  if (guessCount !== prevGuessCount) {
    const rowAdded = guessCount > prevGuessCount;
    setPrevGuessCount(guessCount);
    if (rowAdded && !reduceMotion) {
      setIsRevealing(true);
      setIsEnterBlocked(true);
    }
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

  useEffect(() => {
    if (!isEnterBlocked) return undefined;
    const unblockTimer = setTimeout(() => setIsEnterBlocked(false), enterBlockDurationMs(wordLength));
    return () => clearTimeout(unblockTimer);
  }, [isEnterBlocked, wordLength]);

  return { isRevealing, celebrateRow, isEnterBlocked };
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
  const { isRevealing, celebrateRow, isEnterBlocked } = useRevealTiming(session, wordLength, reduceMotion);
  const shakeRow = useShakeTiming(session, reduceMotion);
  return { isRevealing, shakeRow, celebrateRow, isEnterBlocked };
}
