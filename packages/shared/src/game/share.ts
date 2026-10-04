import type { TileStatus } from './types';

const EMOJI_MAP: Record<string, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬜',
};

const MAX_GUESSES = 6;
const DEFAULT_SHARE_URL = 'https://harfhane.app';

export const generateShareText = (
  guesses: string[],
  evaluations: TileStatus[][],
  modeText: string | number,
  isWon: boolean,
  shareUrl = DEFAULT_SHARE_URL
): string => {
  const attemptText = isWon ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;

  let text = `Harfhane ${modeText} ${attemptText}\n\n`;

  evaluations.forEach((evaluation) => {
    const row = evaluation.map((status) => (status ? EMOJI_MAP[status] : '⬜') || '⬜').join('');
    text += row + '\n';
  });

  text += `\n${shareUrl}`;

  return text;
};
