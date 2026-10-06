import { describe, it, expect } from 'vitest';
import { parseCSV, parseJSON } from './importWordsParser';

function firstRow(rows: ReturnType<typeof parseCSV>) {
  const row = rows[0];
  if (!row) throw new Error('expected at least one parsed row');
  return row;
}

describe('parseCSV', () => {
  it('should accept a row with no meaning or context', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,isim'));
    expect(row.error).toBeUndefined();
    expect(row.word).toBe('KALEM');
    expect(row.meaning).toBe('');
  });

  it('should still reject a row with no word', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\n,Bir şey,,isim'));
    expect(row.error).toContain('kelime boş');
  });

  it('should normalize a lowercase word with Turkish-aware casing', () => {
    expect(firstRow(parseCSV('kelime\nkalem')).word).toBe('KALEM');
    expect(firstRow(parseCSV('kelime\nışık')).word).toBe('IŞIK');
  });

  it('should leave category null when the column is empty, not default to isim', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,'));
    expect(row.category).toBeNull();
    expect(row.error).toBeUndefined();
  });

  it('should leave category null for a word-only row with no category column at all', () => {
    const row = firstRow(parseCSV('kelime\nKALEM'));
    expect(row.category).toBeNull();
    expect(row.error).toBeUndefined();
  });

  it('should default the pool to daily when no pool column is given', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,isim'));
    expect(row.pool).toBe('daily');
  });

  it('should read an explicit pool column', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori,havuz\nKALEM,,,isim,unlimited'));
    expect(row.pool).toBe('unlimited');
  });

  it('should trim and lowercase the pool column before matching it', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori,havuz\nKALEM,,,isim,  UNLIMITED  '));
    expect(row.pool).toBe('unlimited');
  });

  it('should fall back to daily for an unknown pool value', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori,havuz\nKALEM,,,isim,nonsense'));
    expect(row.pool).toBe('daily');
  });

  it('should still flag an invalid category when one is given', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,renk'));
    expect(row.error).toContain('geçersiz kategori');
  });

  it('should detect a header row by the "word" keyword', () => {
    const rows = parseCSV('word\nKALEM');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.word).toBe('KALEM');
  });

  it('should detect a header row by the "anlam" keyword', () => {
    const rows = parseCSV('x,anlam\nKALEM,bir şey');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.word).toBe('KALEM');
  });

  it('should treat a line with none of the header keywords as data, not a header', () => {
    const rows = parseCSV('KALEM\nMASA');
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.word)).toEqual(['KALEM', 'MASA']);
  });
});

describe('parseJSON', () => {
  it('should accept an item with no meaning field', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim' }])));
    expect(row.error).toBeUndefined();
    expect(row.meaning).toBe('');
  });

  it('should reject an item with no word field', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ meaning: 'bir şey' }])));
    expect(row.error).toContain('kelime boş');
  });

  it('should flag an invalid category', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', category: 'renk' }])));
    expect(row.error).toContain('geçersiz kategori');
  });

  it('should normalize a lowercase word with Turkish-aware casing', () => {
    expect(firstRow(parseJSON(JSON.stringify([{ word: 'kalem' }]))).word).toBe('KALEM');
    expect(firstRow(parseJSON(JSON.stringify([{ word: 'ışık' }]))).word).toBe('IŞIK');
  });

  it('should leave category null when no category field is given', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM' }])));
    expect(row.category).toBeNull();
    expect(row.error).toBeUndefined();
  });

  it('should default the pool to daily when no pool field is given', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim' }])));
    expect(row.pool).toBe('daily');
  });

  it('should read an explicit pool field', () => {
    const row = firstRow(
      parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim', pool: 'unlimited' }]))
    );
    expect(row.pool).toBe('unlimited');
  });

  it('should read the "havuz" alias for pool', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', havuz: 'unlimited' }])));
    expect(row.pool).toBe('unlimited');
  });

  it('should trim and lowercase the pool field before matching it', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', pool: '  Unlimited  ' }])));
    expect(row.pool).toBe('unlimited');
  });

  it('should fall back to daily for an unknown pool value', () => {
    const row = firstRow(
      parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim', pool: 'nonsense' }]))
    );
    expect(row.pool).toBe('daily');
  });
});
