import { getGameNumber } from '@harfhane/shared';

export type FinishedGameStatus = 'won' | 'lost';

// 3-5 Turkish variants per outcome (no emojis); selection is deterministic so the same
// result always shows the same title in tests and for a given daily game number.
const WIN_MESSAGE_VARIANTS: Readonly<Record<number, readonly string[]>> = {
  1: ['Muhteşem!', 'İnanılmaz!', 'Efsane başlangıç!'],
  2: ['Harika!', 'Çok iyi!', 'Süper!'],
  3: ['Güzel!', 'İyi gidiyor!', 'Aferin!'],
  4: ['İyi!', 'Fena değil!', 'Olmuş!'],
  5: ['Kıl payı!', 'Son anda!', 'Tam zamanında!'],
  6: ['Zor oldu ama başardın!', 'Son hamlede!', 'Tam sınırda!'],
};
const FALLBACK_WIN_VARIANTS: readonly string[] = ['Tebrikler!'];
const LOSS_MESSAGE_VARIANTS: readonly string[] = ['Bir dahaki sefere!', 'Yakındı!', 'Pes etme!', 'Tekrar dene!'];

// Mirrors apps/backend/src/repositories/word-repository.ts: noon UTC keeps the instant well
// inside the Turkey day the date string names, regardless of DST-free UTC+3 arithmetic.
const DAILY_NOON_UTC_SUFFIX = 'T12:00:00Z';

function pickVariant(variants: readonly string[], seed: number): string {
  const normalizedSeed = ((seed % variants.length) + variants.length) % variants.length;
  return variants[normalizedSeed] ?? variants[0]!;
}

export function dailyGameNumber(dailyDate: string): number {
  return getGameNumber(new Date(`${dailyDate}${DAILY_NOON_UTC_SUFFIX}`));
}

export function selectResultMessage(gameStatus: FinishedGameStatus, guessCount: number, seed: number): string {
  if (gameStatus === 'lost') return pickVariant(LOSS_MESSAGE_VARIANTS, seed);
  const variants = WIN_MESSAGE_VARIANTS[guessCount] ?? FALLBACK_WIN_VARIANTS;
  return pickVariant(variants, seed);
}
