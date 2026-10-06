import { normalizeWord } from '@harfhane/shared';

export interface PreviewRow {
  word: string;
  meaning: string;
  context: string;
  category: string;
  pool: string;
  error?: string;
}

export const VALID_CATEGORIES = ['isim', 'sıfat', 'fiil'];
// Daily pool rows keep a short meaning; unlimited pool rows have none (owner decision
// 2026-10-06). Neither pool requires a meaning at import time any more.
export const VALID_POOLS = ['daily', 'unlimited'];
export const DEFAULT_POOL = 'daily';

function normalizePool(raw: string): string {
  const lowered = raw.trim().toLowerCase();
  return VALID_POOLS.includes(lowered) ? lowered : DEFAULT_POOL;
}

export function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const firstLine = lines[0]?.toLowerCase() ?? '';
  const hasHeader = firstLine.includes('kelime') || firstLine.includes('word') || firstLine.includes('anlam');
  return (hasHeader ? lines.slice(1) : lines).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [word = '', meaning = '', context = '', category = 'isim', pool = DEFAULT_POOL] = cols;
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (!VALID_CATEGORIES.includes(category)) errors.push(`geçersiz kategori`);
    return {
      word: normalizeWord(word),
      meaning,
      context,
      category,
      pool: normalizePool(pool),
      error: errors.join(', ') || undefined,
    };
  });
}

export function parseJSON(text: string): PreviewRow[] {
  const data = JSON.parse(text) as unknown[];
  if (!Array.isArray(data)) throw new Error('JSON bir dizi olmalı');
  return data.map((item) => {
    const row = item as Record<string, unknown>;
    const word = String(row['word'] ?? row['kelime'] ?? '');
    const meaning = String(row['meaning'] ?? row['anlam'] ?? '');
    const context = String(row['context'] ?? row['baglan'] ?? row['bağlam'] ?? '');
    const category = String(row['category'] ?? row['kategori'] ?? 'isim');
    const pool = String(row['pool'] ?? row['havuz'] ?? DEFAULT_POOL);
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (!VALID_CATEGORIES.includes(category)) errors.push('geçersiz kategori');
    return {
      word: normalizeWord(word),
      meaning,
      context,
      category,
      pool: normalizePool(pool),
      error: errors.join(', ') || undefined,
    };
  });
}
