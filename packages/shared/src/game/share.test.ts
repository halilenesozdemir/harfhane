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
});
