import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SharePreview from './SharePreview';
import type { TileStatus } from '../types';

const createEvaluations = (rows: TileStatus[][]): TileStatus[][] => rows;

describe('SharePreview', () => {
  describe('Rendering', () => {
    it('should render correct number of rows based on evaluations', () => {
      const evaluations = createEvaluations([
        ['correct', 'correct', 'correct'],
        ['absent', 'absent', 'absent'],
        ['present', 'present', 'present'],
      ]);
      const { container } = render(<SharePreview evaluations={evaluations} />);
      const rows = container.querySelectorAll('.flex.gap-1:not(.flex-col)');
      expect(rows).toHaveLength(3);
    });

    it('should apply bg-correct class for correct tiles', () => {
      const evaluations = createEvaluations([['correct', 'absent', 'absent']]);
      const { container } = render(<SharePreview evaluations={evaluations} />);
      const tiles = container.querySelectorAll('.w-5.h-5');
      expect(tiles[0]).toHaveClass('bg-correct');
    });

    it('should apply bg-present class for present tiles', () => {
      const evaluations = createEvaluations([['absent', 'present', 'absent']]);
      const { container } = render(<SharePreview evaluations={evaluations} />);
      const tiles = container.querySelectorAll('.w-5.h-5');
      expect(tiles[1]).toHaveClass('bg-present');
    });

    it('should apply bg-absent class for absent tiles', () => {
      const evaluations = createEvaluations([['absent', 'absent', 'absent']]);
      const { container } = render(<SharePreview evaluations={evaluations} />);
      const tiles = container.querySelectorAll('.w-5.h-5');
      expect(tiles[0]).toHaveClass('bg-absent');
    });

    it('should apply bg-absent class for null tiles', () => {
      const evaluations = createEvaluations([[null, null]]);
      const { container } = render(<SharePreview evaluations={evaluations} />);
      const tiles = container.querySelectorAll('.w-5.h-5');
      expect(tiles[0]).toHaveClass('bg-absent');
    });
  });
});
