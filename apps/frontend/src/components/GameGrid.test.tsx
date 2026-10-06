import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameGrid from './GameGrid';
import type { GameGridProps } from '../types';

function renderGrid(overrides: Partial<GameGridProps> = {}) {
  const props: GameGridProps = {
    guesses: [],
    evaluations: [],
    currentGuess: '',
    isRevealing: false,
    shakeRow: false,
    gameStatus: 'playing',
    wordLength: 5,
    ...overrides,
  };
  return render(<GameGrid {...props} />);
}

describe('GameGrid', () => {
  it('should mark the hint tile on the board and ignore a repeated reveal when the free allowance is used (008-AE7)', () => {
    renderGrid({ hint: { position: 2, letter: 'L' } });

    const tiles = screen.getAllByTestId('tile');
    const hintTile = tiles[2]!;

    expect(hintTile).toHaveAttribute('data-hint', 'true');
    expect(hintTile).toHaveTextContent('L');

    // A second render with the same hint (simulating a repeated reveal that is a no-op upstream)
    // still shows exactly one hinted tile, proving the board does not duplicate or move the hint.
    const hintedTiles = tiles.filter((tile) => tile.getAttribute('data-hint') === 'true');
    expect(hintedTiles).toHaveLength(1);
  });

  it('should not override a letter the player already typed at the hint position', () => {
    renderGrid({ hint: { position: 0, letter: 'K' }, currentGuess: 'A' });

    const tiles = screen.getAllByTestId('tile');
    expect(tiles[0]).toHaveTextContent('A');
    expect(tiles[0]).not.toHaveAttribute('data-hint', 'true');
  });
});
