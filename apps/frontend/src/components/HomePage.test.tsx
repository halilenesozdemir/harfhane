import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayString } from '@harfhane/shared';
import HomePage from './HomePage';
import { ThemeProvider } from '../context/ThemeContext';
import { usePlayableLengths } from '../hooks/usePlayableLengths';
import type { HomePageProps, WordLength } from '../types';

vi.mock('../hooks/usePlayableLengths', async () => {
  const actual = await vi.importActual<typeof import('../hooks/usePlayableLengths')>('../hooks/usePlayableLengths');
  return { ...actual, usePlayableLengths: vi.fn((): readonly WordLength[] => [5]) };
});

const DAILY_LENGTH: WordLength = 5;

function dailyGameKey(): string {
  return `harfhane:game:anon:${getTodayString()}:${DAILY_LENGTH}`;
}

function renderHomePage(props: HomePageProps): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <HomePage {...props} />
      </ThemeProvider>
    </MemoryRouter>
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

  it('should show the footer privacy line, with the Gizlilik link living in the Settings modal instead of the footer', () => {
    renderHomePage({ onSelectMode: vi.fn() });

    expect(screen.getByText('Hesap yok. Reklam yok. İlerlemen bu cihazda kalır.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Gizlilik/ })).not.toBeInTheDocument();
  });

  it('should close the Settings modal and navigate to the published privacy page when Gizlilik is clicked (007-AE1)', () => {
    renderHomePage({ onSelectMode: vi.fn() });

    act(() => {
      screen.getByRole('button', { name: 'Ayarlar' }).click();
    });
    act(() => {
      screen.getByRole('button', { name: 'Gizlilik' }).click();
    });

    expect(screen.queryByRole('heading', { name: 'Ayarlar' })).not.toBeInTheDocument();
  });

  it('should mark the selected unlimited length button as aria-pressed and the others as not', () => {
    vi.mocked(usePlayableLengths).mockReturnValueOnce([4, 5, 6]);

    renderHomePage({ onSelectMode: vi.fn() });

    expect(screen.getByRole('button', { name: '5 harf' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4 harf' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('HomePage daily card at Turkey midnight', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should flip from Çözdün back to Henüz oynamadın after Turkey midnight, without a reload (012-AE4)', () => {
    // 20:59:59 UTC is 23:59:59 Turkey time (UTC+3) on the same calendar day.
    vi.setSystemTime(new Date('2026-10-14T20:59:59.000Z'));
    const todayBeforeMidnight = getTodayString();
    window.localStorage.setItem(
      `harfhane:game:anon:${todayBeforeMidnight}:${DAILY_LENGTH}`,
      JSON.stringify({ guesses: ['KALEM'], evaluations: [[]], currentGuess: '', gameStatus: 'won', keyboardStatus: {} })
    );

    renderHomePage({ onSelectMode: vi.fn() });
    expect(screen.getByText(/Çözdün/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Henüz oynamadın')).toBeInTheDocument();
    expect(screen.queryByText(/Çözdün/)).not.toBeInTheDocument();
  });
});
