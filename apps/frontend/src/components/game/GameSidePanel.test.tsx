import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import GameSidePanel from './GameSidePanel';
import type { DailyStats, UnlimitedStats } from '../../types';

const dailyStats: DailyStats = {
  gamesPlayed: 12,
  gamesWon: 10,
  currentStreak: 3,
  maxStreak: 5,
  guessDistribution: [0, 1, 2, 2, 1, 1],
  lastPlayedDate: null,
};

const unlimitedStats: UnlimitedStats = {
  gamesPlayed: 4,
  gamesWon: 2,
  guessDistribution: [0, 0, 1, 1, 0, 0],
};

function renderPanel(mode: 'daily' | 'unlimited', stats: DailyStats | UnlimitedStats): void {
  render(
    <MemoryRouter>
      <GameSidePanel mode={mode} wordLength={5} stats={stats} />
    </MemoryRouter>
  );
}

describe('GameSidePanel', () => {
  it('shows a mode switch with Günlük and Sınırsız', () => {
    renderPanel('daily', dailyStats);
    expect(screen.getByRole('button', { name: 'Günlük' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sınırsız' })).toBeInTheDocument();
  });

  it('marks the active mode as current', () => {
    renderPanel('unlimited', unlimitedStats);
    expect(screen.getByRole('button', { name: 'Sınırsız' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Günlük' })).not.toHaveAttribute('aria-current');
  });

  it('should show Seri, Oynanan and Kazanma from the stats hook when the side panel renders', () => {
    renderPanel('daily', dailyStats);
    expect(screen.getByText('Seri')).toBeInTheDocument();
    expect(screen.getByText('Oynanan')).toBeInTheDocument();
    expect(screen.getByText('Kazanma')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('%83')).toBeInTheDocument();
  });

  it('shows a dash for streak in unlimited mode, which has no streak', () => {
    renderPanel('unlimited', unlimitedStats);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
