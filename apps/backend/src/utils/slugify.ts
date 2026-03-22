const TURKISH_MAP: Record<string, string> = {
  'ç': 'c', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ı': 'i',
  'Ç': 'c', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'İ': 'i', 'I': 'i',
};

export function slugify(text: string): string {
  return text
    .split('')
    .map(c => TURKISH_MAP[c] ?? c.toLowerCase())
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
