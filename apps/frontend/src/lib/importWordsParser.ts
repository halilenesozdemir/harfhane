import { normalizeWord } from '@harfhane/shared';

export interface PreviewRow {
  word: string;
  meaning: string;
  context: string;
  category: string | null;
  pool: string;
  error?: string | undefined;
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

interface CategoryResult {
  category: string | null;
  error?: string;
}

// A word-only row (unlimited pool) has no category either — the DB column allows
// NULL (apps/backend/db/migrations/0001_baseline.sql). Only default-reject when a
// category was actually given and it is not one of the known values; an absent
// category is never an error.
function normalizeCategory(raw: string): CategoryResult {
  const trimmed = raw.trim();
  if (!trimmed) return { category: null };
  if (!VALID_CATEGORIES.includes(trimmed)) return { category: trimmed, error: 'geçersiz kategori' };
  return { category: trimmed };
}

export function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const firstLine = lines[0]?.toLowerCase() ?? '';
  const hasHeader = firstLine.includes('kelime') || firstLine.includes('word') || firstLine.includes('anlam');
  return (hasHeader ? lines.slice(1) : lines).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [word = '', meaning = '', context = '', categoryRaw = '', pool = DEFAULT_POOL] = cols;
    const { category, error: categoryError } = normalizeCategory(categoryRaw);
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (categoryError) errors.push(categoryError);
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
    const categoryRaw = String(row['category'] ?? row['kategori'] ?? '');
    const pool = String(row['pool'] ?? row['havuz'] ?? DEFAULT_POOL);
    const { category, error: categoryError } = normalizeCategory(categoryRaw);
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (categoryError) errors.push(categoryError);
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
