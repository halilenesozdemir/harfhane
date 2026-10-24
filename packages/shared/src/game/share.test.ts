import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { TileStatus } from './types';
import type { ShareMode } from './share';

const createEvaluations = (rows: TileStatus[][]): TileStatus[][] => rows;
const DAILY: ShareMode = { type: 'daily', date: '2026-10-24' };
const UNLIMITED: ShareMode = { type: 'unlimited' };

describe('generateShareText', () => {
  it('should render a correct tile as a green circle', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    expect(result).toContain('🟢🟢🟢🟢🟢');
  });

  it('should render a present tile as a yellow circle and an absent tile as a white circle, in position', () => {
    const evaluations = createEvaluations([['correct', 'present', 'absent', 'absent', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    const gridLine = result.split('\n')[3]!;
    expect(gridLine).toBe('🟢🟡⚪⚪🟢');
  });

  it('should reveal which positions are correct, present or absent (positional, unlike an aggregate count)', () => {
    const evaluations = createEvaluations([['absent', 'correct', 'absent', 'correct', 'present']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    const gridLine = result.split('\n')[3]!;
    expect(gridLine).toBe('⚪🟢⚪🟢🟡');
  });

  it('should render a null (unrevealed) tile as a white circle', () => {
    const evaluations = createEvaluations([[null, 'correct', null, null, 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    const gridLine = result.split('\n')[3]!;
    expect(gridLine).toBe('⚪🟢⚪⚪🟢');
  });

  it('should show "<n>/6" as the second line when the game is won', () => {
    const evaluations = createEvaluations([
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct', 'correct'],
    ]);
    const result = generateShareText(['YANLI', 'DOGRU'], evaluations, 5, DAILY, true);
    expect(result.split('\n')[1]).toBe('2/6');
  });

  it('should show "Bulamadım · 6/6" as the second line when the game is lost', () => {
    const guesses = ['AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF'];
    const evaluations = createEvaluations(guesses.map(() => Array(5).fill('absent') as TileStatus[]));
    const result = generateShareText(guesses, evaluations, 5, DAILY, false);
    expect(result.split('\n')[1]).toBe('Bulamadım · 6/6');
  });

  it('should header with the day and Turkish month name and word length for a daily game', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    expect(result.split('\n')[0]).toBe('Harfhane · 24 Ekim · 5 harf');
  });

  it('should header with "Sınırsız" instead of a date for an unlimited game', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, UNLIMITED, true);
    expect(result.split('\n')[0]).toBe('Harfhane · Sınırsız · 5 harf');
  });

  it('should drop the leading zero from a single-digit day', () => {
    const date: ShareMode = { type: 'daily', date: '2026-01-05' };
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, date, true);
    expect(result.split('\n')[0]).toBe('Harfhane · 5 Ocak · 5 harf');
  });

  it('should not append a streak or hint suffix to the second line by default', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    expect(result.split('\n')[1]).toBe('1/6');
  });

  it('should append " · İpucuyla" to the second line when a hint was used', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true, { hintUsed: true });
    expect(result.split('\n')[1]).toBe('1/6 · İpucuyla');
  });

  it('should append " · Seri <n>" to the second line when the daily streak is greater than zero', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true, { streak: 4 });
    expect(result.split('\n')[1]).toBe('1/6 · Seri 4');
  });

  it('should not append a streak suffix when the streak is zero', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true, { streak: 0 });
    expect(result.split('\n')[1]).toBe('1/6');
  });

  it('should not append a streak suffix for unlimited games even when a streak value is passed', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, UNLIMITED, true, { streak: 9 });
    expect(result.split('\n')[1]).toBe('1/6');
  });

  it('should append both the streak and hint suffixes, in that order, when both apply', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true, { streak: 4, hintUsed: true });
    expect(result.split('\n')[1]).toBe('1/6 · Seri 4 · İpucuyla');
  });

  it('should end with "harfhane.app" by default, for daily and unlimited alike', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    expect(generateShareText(['KELME'], evaluations, 5, DAILY, true).split('\n').at(-1)).toBe('harfhane.app');
    expect(generateShareText(['KELME'], evaluations, 5, UNLIMITED, true).split('\n').at(-1)).toBe('harfhane.app');
  });

  it('should honor a custom share URL in the last line', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true, {
      shareUrl: 'https://harfhane.app/daily/5',
    });
    expect(result.split('\n').at(-1)).toBe('https://harfhane.app/daily/5');
  });

  it('should never reveal a letter of the solution anywhere in the text', () => {
    const evaluations = createEvaluations([['correct', 'present', 'absent', 'correct', 'present']]);
    const result = generateShareText(['KELME'], evaluations, 5, DAILY, true);
    expect(result).not.toContain('KELME');
  });

  it('should produce the exact full text for a known daily win, including both blank lines', () => {
    const evaluations = createEvaluations([
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct', 'correct'],
    ]);
    const result = generateShareText(['YANLI', 'YANLI', 'DOGRU'], evaluations, 5, DAILY, true, { streak: 4 });
    expect(result).toBe(
      [
        'Harfhane · 24 Ekim · 5 harf',
        '3/6 · Seri 4',
        '',
        '⚪⚪⚪⚪⚪',
        '🟢🟢⚪⚪⚪',
        '🟢🟢🟢🟢🟢',
        '',
        'harfhane.app',
      ].join('\n')
    );
  });

  it.each<[string, string]>([
    ['2026-01-15', '15 Ocak'],
    ['2026-02-15', '15 Şubat'],
    ['2026-03-15', '15 Mart'],
    ['2026-04-15', '15 Nisan'],
    ['2026-05-15', '15 Mayıs'],
    ['2026-06-15', '15 Haziran'],
    ['2026-07-15', '15 Temmuz'],
    ['2026-08-15', '15 Ağustos'],
    ['2026-09-15', '15 Eylül'],
    ['2026-10-15', '15 Ekim'],
    ['2026-11-15', '15 Kasım'],
    ['2026-12-15', '15 Aralık'],
  ])('should render the Turkish month name for %s as %s', (date, expectedLabel) => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 5, { type: 'daily', date }, true);
    expect(result.split('\n')[0]).toBe(`Harfhane · ${expectedLabel} · 5 harf`);
  });

  it('should have one grid line per guess', () => {
    const evaluations = createEvaluations([
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['present', 'present', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct', 'correct'],
    ]);
    const result = generateShareText(['YANLI', 'YANLI', 'DOGRU'], evaluations, 5, DAILY, true);
    const lines = result.split('\n');
    // header, result, blank, 3 grid lines, blank, url = 8 lines.
    expect(lines).toHaveLength(8);
  });
});
