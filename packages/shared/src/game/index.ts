export type { TileStatus, TimeCountdown } from './types';
export { normalizeChar, normalizeWord, evaluateGuess, checkGameStatus } from './evaluate';
export { updateKeyboardStatus } from './keyboard';
export { generateShareText } from './share';
export { getTimeUntilMidnight, getTodayString, getGameNumber } from './time';
/** @deferred Consumed by open PRs #80 (web) and #82 (mobile); drop this tag once either lands. */
export type { HintMode, LetterHint } from './hint';
/** @deferred Consumed by open PRs #80 (web) and #82 (mobile); drop this tag once either lands. */
export {
  FREE_DAILY_HINTS,
  FREE_UNLIMITED_HINTS,
  SUPPORTER_DAILY_HINTS,
  SUPPORTER_UNLIMITED_HINTS,
  hintAllowance,
  pickHint,
} from './hint';
