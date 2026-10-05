import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import StatsModal from './StatsModal';
import type { DailyStats } from '../types';

const STATS: DailyStats = {
  gamesPlayed: 9,
  gamesWon: 6,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 7],
  lastPlayedDate: null,
};

function renderModal(isOpen: boolean) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <StatsModal isOpen={isOpen} onClose={vi.fn()} stats={STATS} lastGuessCount={6} gameStatus="won" isUnlimited={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('StatsModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not show the distribution count right when opened', () => {
    renderModal(true);
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('should show the distribution count after the open animation delay', () => {
    renderModal(true);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should replay the open animation when the modal is reopened', () => {
    const { rerender } = renderModal(true);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('7')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <StatsModal isOpen={false} onClose={vi.fn()} stats={STATS} lastGuessCount={6} gameStatus="won" isUnlimited={false} />
        </AuthProvider>
      </QueryClientProvider>
    );
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <StatsModal isOpen={true} onClose={vi.fn()} stats={STATS} lastGuessCount={6} gameStatus="won" isUnlimited={false} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.queryByText('7')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
