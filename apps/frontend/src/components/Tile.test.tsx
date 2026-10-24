import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tile from './Tile';
import type { TileProps } from '../types';

function renderTile(overrides: Partial<TileProps> = {}) {
  const props: TileProps = {
    letter: '',
    status: null,
    isRevealing: false,
    revealDelay: 0,
    isFilled: false,
    ...overrides,
  };
  return render(<Tile {...props} />);
}

describe('Tile', () => {
  it('should announce "boş" when the tile has no letter', () => {
    renderTile({ letter: '' });
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-label', 'boş');
  });

  it('should announce just the letter when it is typed but not evaluated', () => {
    renderTile({ letter: 'A', isFilled: true });
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-label', 'A');
  });

  it('should announce "<letter>, doğru yerde" when correct (012-AE6)', () => {
    renderTile({ letter: 'A', status: 'correct' });
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-label', 'A, doğru yerde');
  });

  it('should announce "<letter>, başka yerde" when present', () => {
    renderTile({ letter: 'A', status: 'present' });
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-label', 'A, başka yerde');
  });

  it('should announce "<letter>, kelimede yok" when absent', () => {
    renderTile({ letter: 'A', status: 'absent' });
    expect(screen.getByTestId('tile')).toHaveAttribute('aria-label', 'A, kelimede yok');
  });

  it('should apply the tile-flip class when revealing and motion is not reduced', () => {
    renderTile({ letter: 'A', status: 'correct', isRevealing: true, revealDelay: 2 });
    expect(screen.getByTestId('tile').className).toContain('tile-flip');
  });

  it('should have no flip animation class when revealing under reduced motion (012-AE6)', () => {
    renderTile({ letter: 'A', status: 'correct', isRevealing: true, revealDelay: 2, reduceMotion: true });
    expect(screen.getByTestId('tile').className).not.toContain('tile-flip');
  });

  it('should apply the pop animation class when freshly filled and motion is not reduced', () => {
    renderTile({ letter: 'A', isFilled: true });
    expect(screen.getByTestId('tile').className).toContain('animate-pop');
  });

  it('should not apply the pop animation class when freshly filled under reduced motion', () => {
    renderTile({ letter: 'A', isFilled: true, reduceMotion: true });
    expect(screen.getByTestId('tile').className).not.toContain('animate-pop');
  });
});
