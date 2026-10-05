import { normalizeChar } from '@harfhane/shared';

const TURKISH_LETTER = /^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/;

export function letterFromKey(key: string): string | null {
  return TURKISH_LETTER.test(key) ? normalizeChar(key) : null;
}
