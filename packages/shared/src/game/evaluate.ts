import type { TileStatus } from './types';

const TURKISH_UPPERCASE_MAP: Record<string, string> = {
  i: 'İ',
  ı: 'I',
  ğ: 'Ğ',
  ü: 'Ü',
  ş: 'Ş',
  ö: 'Ö',
  ç: 'Ç',
};

export const normalizeChar = (char: string): string => {
  return TURKISH_UPPERCASE_MAP[char] || char.toUpperCase();
};

export const normalizeWord = (word: string): string => {
  return word.split('').map(normalizeChar).join('');
};

export const evaluateGuess = (guess: string, solution: string): TileStatus[] => {
  const result: TileStatus[] = [];
  const solutionArray = solution.split('');
  const guessArray = guess.split('');
  const solutionCharCount: Record<string, number> = {};

  solutionArray.forEach((char) => {
    solutionCharCount[char] = (solutionCharCount[char] || 0) + 1;
  });

  guessArray.forEach((char, i) => {
    const solutionChar = solutionArray[i];
    if (char === solutionChar && solutionChar) {
      result[i] = 'correct';
      solutionCharCount[char] = (solutionCharCount[char] ?? 0) - 1;
    }
  });

  guessArray.forEach((char, i) => {
    if (result[i]) return;

    if ((solutionCharCount[char] ?? 0) > 0) {
      result[i] = 'present';
      solutionCharCount[char] = (solutionCharCount[char] ?? 0) - 1;
    } else {
      result[i] = 'absent';
    }
  });

  return result;
};

export const MAX_GUESSES = 6;

export const checkGameStatus = (guesses: string[], solution: string): 'won' | 'lost' | 'playing' => {
  const lastGuess = guesses[guesses.length - 1];

  if (lastGuess === solution) {
    return 'won';
  }

  if (guesses.length >= MAX_GUESSES) {
    return 'lost';
  }

  return 'playing';
};
