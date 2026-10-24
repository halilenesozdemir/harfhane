import { render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
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

const ORIGINAL_MATCH_MEDIA = window.matchMedia;

describe('GameGrid', () => {
  afterEach(() => {
    window.matchMedia = ORIGINAL_MATCH_MEDIA;
  });

  it('should mark the hint tile on the board with its revealed letter (008-AE7)', () => {
    renderGrid({ hint: { position: 2, letter: 'L' } });

    const tiles = screen.getAllByTestId('tile');
    const hintTile = tiles[2]!;

    expect(hintTile).toHaveAttribute('data-hint', 'true');
    expect(hintTile).toHaveTextContent('L');

    const hintedTiles = tiles.filter((tile) => tile.getAttribute('data-hint') === 'true');
    expect(hintedTiles).toHaveLength(1);
  });

  it('should not override a letter the player already typed at the hint position', () => {
    renderGrid({ hint: { position: 0, letter: 'K' }, currentGuess: 'A' });

    const tiles = screen.getAllByTestId('tile');
    expect(tiles[0]).toHaveTextContent('A');
    expect(tiles[0]).not.toHaveAttribute('data-hint', 'true');
  });

  it('should show the hint ghost at position 0 when no submitted guess has solved KALEM there yet', () => {
    renderGrid({ hint: { position: 0, letter: 'K' }, guesses: ['ZZZZZ'] });

    const currentRowTiles = screen.getAllByTestId('tile').slice(5, 10);
    expect(currentRowTiles[0]).toHaveAttribute('data-hint', 'true');
    expect(currentRowTiles[0]).toHaveTextContent('K');
  });

  it('should not show the hint ghost when a submitted guess already placed K at position 0 of KALEM', () => {
    renderGrid({ hint: { position: 0, letter: 'K' }, guesses: ['KAPAK'] });

    const currentRowTiles = screen.getAllByTestId('tile').slice(5, 10);
    expect(currentRowTiles[0]).not.toHaveAttribute('data-hint', 'true');
    expect(currentRowTiles[0]).toBeEmptyDOMElement();
  });

  it('should not apply the shake class to the current row under reduced motion (012-AE6)', () => {
    window.matchMedia = (() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    renderGrid({ shakeRow: true });

    expect(screen.getAllByRole('row')[0]!.className).not.toContain('animate-shake');
  });
});
