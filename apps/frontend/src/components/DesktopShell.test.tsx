import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import DesktopShell from './DesktopShell';
import type { DailyStats, UnlimitedStats } from '../types';

const dailyStats: DailyStats = {
  gamesPlayed: 10,
  gamesWon: 7,
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

function renderShell(stats: DailyStats | UnlimitedStats, mode: 'daily' | 'unlimited' = 'daily'): void {
  render(
    <MemoryRouter>
      <DesktopShell mode={mode} wordLength={5} stats={stats} onGoHome={vi.fn()}>
        <div>Oyun alanı</div>
      </DesktopShell>
    </MemoryRouter>
  );
}

describe('DesktopShell', () => {
  it('renders the mode navigation landmark', () => {
    renderShell(dailyStats);
    expect(screen.getByRole('navigation', { name: 'Oyun modları' })).toBeInTheDocument();
  });

  it('renders the status aside landmark', () => {
    renderShell(dailyStats);
    expect(screen.getByRole('complementary', { name: 'Günün durumu' })).toBeInTheDocument();
  });

  it('shows the current streak for daily stats', () => {
    renderShell(dailyStats);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows a dash for streak when stats have no streak', () => {
    renderShell(unlimitedStats, 'unlimited');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders the passed children inside the center column', () => {
    renderShell(dailyStats);
    expect(screen.getByText('Oyun alanı')).toBeInTheDocument();
  });

  it('shows the length picker for every scheduled length by default', () => {
    renderShell(dailyStats);
    expect(screen.getAllByRole('button', { name: '4' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '6' }).length).toBeGreaterThan(0);
  });

  it('hides the length picker when only one length is playable', () => {
    render(
      <MemoryRouter>
        <DesktopShell mode="daily" wordLength={5} playableLengths={[5]} stats={dailyStats} onGoHome={vi.fn()}>
          <div>Oyun alanı</div>
        </DesktopShell>
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: '4' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument();
  });
});
