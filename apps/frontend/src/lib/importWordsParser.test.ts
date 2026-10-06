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

  it('should default the pool to daily when no pool column is given', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,isim'));
    expect(row.pool).toBe('daily');
  });

  it('should read an explicit pool column', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori,havuz\nKALEM,,,isim,unlimited'));
    expect(row.pool).toBe('unlimited');
  });

  it('should fall back to daily for an unknown pool value', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori,havuz\nKALEM,,,isim,nonsense'));
    expect(row.pool).toBe('daily');
  });

  it('should still flag an invalid category', () => {
    const row = firstRow(parseCSV('kelime,anlam,bağlam,kategori\nKALEM,,,renk'));
    expect(row.error).toContain('geçersiz kategori');
  });
});

describe('parseJSON', () => {
  it('should accept an item with no meaning field', () => {
    const row = firstRow(parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim' }])));
    expect(row.error).toBeUndefined();
    expect(row.meaning).toBe('');
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

  it('should fall back to daily for an unknown pool value', () => {
    const row = firstRow(
      parseJSON(JSON.stringify([{ word: 'KALEM', category: 'isim', pool: 'nonsense' }]))
    );
    expect(row.pool).toBe('daily');
  });
});
