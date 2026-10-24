import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HeroTiles from './HeroTiles';

describe('HeroTiles', () => {
  it('should expose a single accessible Harfhane heading', () => {
    render(<HeroTiles />);
    expect(screen.getByRole('heading', { level: 1, name: 'Harfhane' })).toBeInTheDocument();
  });

  it('should render the H-A-R-F tiles and the hane text as decorative', () => {
    render(<HeroTiles />);
    expect(screen.getByText('hane')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });
});
