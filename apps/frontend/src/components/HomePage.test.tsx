import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTodayString } from '@harfhane/shared';
import HomePage from './HomePage';
import { ThemeProvider } from '../context/ThemeContext';
import type { HomePageProps, WordLength } from '../types';

vi.mock('../hooks/usePlayableLengths', async () => {
  const actual = await vi.importActual<typeof import('../hooks/usePlayableLengths')>('../hooks/usePlayableLengths');
  return { ...actual, usePlayableLengths: (): readonly WordLength[] => [5] };
});

const DAILY_LENGTH: WordLength = 5;

function dailyGameKey(): string {
  return `harfhane:game:anon:${getTodayString()}:${DAILY_LENGTH}`;
}

function renderHomePage(props: HomePageProps): ReturnType<typeof render> {
  return render(
    <ThemeProvider>
      <HomePage {...props} />
    </ThemeProvider>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // jsdom has no matchMedia; ThemeProvider's system-theme detection needs it.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('should show Henüz oynamadın when the daily word is not played (012-AE4)', () => {
    renderHomePage({ onSelectMode: vi.fn() });

    expect(screen.getByText('Henüz oynamadın')).toBeInTheDocument();
  });

  it('should show Çözdün and a countdown when the daily word is solved (012-AE4)', () => {
    window.localStorage.setItem(
      dailyGameKey(),
      JSON.stringify({
        guesses: ['KALEM'],
        evaluations: [[]],
        currentGuess: '',
        gameStatus: 'won',
        keyboardStatus: {},
      })
    );

    renderHomePage({ onSelectMode: vi.fn() });

    const badge = screen.getByText(/Çözdün/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toMatch(/sonra/);
  });

  it('should render the H-A-R-F hero heading, the mode cards and the how-to panel', () => {
    renderHomePage({ onSelectMode: vi.fn() });

    expect(screen.getByRole('heading', { level: 1, name: 'Harfhane' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Günlük/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sınırsız/ })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Nasıl oynanır' })).toBeInTheDocument();
  });

  it('should call onSelectMode with daily mode and the daily length when the Günlük card is clicked', () => {
    const onSelectMode = vi.fn();
    renderHomePage({ onSelectMode });

    screen.getByRole('button', { name: /Günlük/ }).click();

    expect(onSelectMode).toHaveBeenCalledWith('daily', DAILY_LENGTH);
  });

  it('should show the footer privacy line without a Gizlilik link', () => {
    renderHomePage({ onSelectMode: vi.fn() });

    expect(screen.getByText('Hesap yok. Reklam yok. İlerlemen bu cihazda kalır.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Gizlilik/ })).not.toBeInTheDocument();
  });
});
