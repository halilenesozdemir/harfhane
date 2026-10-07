import type { TileStatus } from './types';

const EMOJI_MAP: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬜',
};

const MAX_GUESSES = 6;
const DEFAULT_SHARE_URL = 'https://harfhane.app';
const HINT_SUFFIX = ' · ipucu';

export interface ShareTextOptions {
  shareUrl?: string;
  hintUsed?: boolean;
}

export const generateShareText = (
  guesses: string[],
  evaluations: TileStatus[][],
  modeText: string | number,
  isWon: boolean,
  options: ShareTextOptions = {}
): string => {
  const { shareUrl = DEFAULT_SHARE_URL, hintUsed = false } = options;
  const attemptText = isWon ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const hintSuffix = hintUsed ? HINT_SUFFIX : '';

  let text = `Harfhane ${modeText} ${attemptText}${hintSuffix}\n\n`;

  evaluations.forEach((evaluation) => {
    const row = evaluation.map((status) => (status ? EMOJI_MAP[status] : '⬜') || '⬜').join('');
    text += row + '\n';
  });

  text += `\n${shareUrl}`;

  return text;
};
