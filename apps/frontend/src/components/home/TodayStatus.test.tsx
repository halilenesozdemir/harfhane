import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TodayStatus from './TodayStatus';

describe('TodayStatus', () => {
  it('should show Henüz oynamadın when the game has not started', () => {
    render(<TodayStatus status={{ kind: 'not-started', guesses: 0 }} />);
    expect(screen.getByText('Henüz oynamadın')).toBeInTheDocument();
  });

  it('should show a in-progress label when guesses exist but the game continues', () => {
    render(<TodayStatus status={{ kind: 'in-progress', guesses: 2 }} />);
    expect(screen.getByText('Devam ediyor')).toBeInTheDocument();
  });

  it('should show Çözdün and a countdown when the game was won', () => {
    render(<TodayStatus status={{ kind: 'won', guesses: 3 }} />);
    expect(screen.getByText(/Çözdün/)).toBeInTheDocument();
    expect(screen.getByText(/sonra/)).toBeInTheDocument();
  });

  it('should show a lost label with a countdown when the game was lost', () => {
    render(<TodayStatus status={{ kind: 'lost', guesses: 6 }} />);
    expect(screen.getByText(/Bugün bitti/)).toBeInTheDocument();
  });
});
