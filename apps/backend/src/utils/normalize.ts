const TURKISH_MAP: Record<string, string> = {
  i: 'İ',
  ı: 'I',
  ğ: 'Ğ',
  ü: 'Ü',
  ş: 'Ş',
  ö: 'Ö',
  ç: 'Ç',
};

export function normalizeWord(word: string): string {
  return word
    .split('')
    .map((c) => TURKISH_MAP[c] ?? c.toUpperCase())
    .join('');
}
