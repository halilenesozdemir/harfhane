import { describe, it, expect } from 'vitest';
import { generateShareText } from './share';
import type { TileStatus } from './types';

const createEvaluations = (rows: TileStatus[][]): TileStatus[][] => rows;

describe('generateShareText', () => {
  it('should include correct emoji for correct tiles', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 1, true);
    expect(result).toContain('🟩🟩🟩🟩🟩');
  });

  it('should include correct emoji for present tiles', () => {
    const evaluations = createEvaluations([['present', 'present', 'present', 'present', 'present']]);
    const result = generateShareText(['KELME'], evaluations, 1, true);
    expect(result).toContain('🟨🟨🟨🟨🟨');
  });

  it('should include correct emoji for absent tiles', () => {
    const evaluations = createEvaluations([['absent', 'absent', 'absent', 'absent', 'absent']]);
    const result = generateShareText(['KELME'], evaluations, 1, true);
    expect(result).toContain('⬜⬜⬜⬜⬜');
  });

  it('should show X/6 when game is lost', () => {
    const guesses = ['AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF'];
    const evaluations = createEvaluations(guesses.map(() => Array(5).fill('absent') as TileStatus[]));
    const result = generateShareText(guesses, evaluations, 42, false);
    expect(result).toContain('X/6');
  });

  it('should show guess count /6 when game is won', () => {
    const evaluations = createEvaluations([
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct', 'correct'],
    ]);
    const result = generateShareText(['YANLI', 'DOGRU'], evaluations, 42, true);
    expect(result).toContain('2/6');
  });

  it('should include harfhane.app URL', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 1, true);
    expect(result).toContain('https://harfhane.app');
  });

  it('should end the header line with "· ipucu" when a hint was used (011-AE6)', () => {
    const evaluations = createEvaluations([
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['correct', 'correct', 'correct', 'correct', 'correct'],
    ]);
    const result = generateShareText(['YANLI', 'YANLI', 'DOGRU'], evaluations, 279, true, { hintUsed: true });
    const headerLine = result.split('\n')[0]!;
    expect(headerLine).toBe('Harfhane 279 3/6 · ipucu');
  });

  it('should not append "· ipucu" when no hint was used', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 1, true);
    const headerLine = result.split('\n')[0]!;
    expect(headerLine.endsWith('ipucu')).toBe(false);
  });

  it('should keep the emoji grid identical whether or not a hint was used', () => {
    const evaluations = createEvaluations([['correct', 'present', 'absent', 'correct', 'present']]);
    const withHint = generateShareText(['KELME'], evaluations, 1, true, { hintUsed: true });
    const withoutHint = generateShareText(['KELME'], evaluations, 1, true);
    const gridLine = (text: string): string => text.split('\n')[2]!;
    expect(gridLine(withHint)).toBe(gridLine(withoutHint));
  });

  it('should still honor a custom share URL when a hint was used', () => {
    const evaluations = createEvaluations([['correct', 'correct', 'correct', 'correct', 'correct']]);
    const result = generateShareText(['KELME'], evaluations, 1, true, {
      shareUrl: 'https://example.com/daily/5',
      hintUsed: true,
    });
    expect(result).toContain('https://example.com/daily/5');
    expect(result.split('\n')[0]).toBe('Harfhane 1 1/6 · ipucu');
  });
});
