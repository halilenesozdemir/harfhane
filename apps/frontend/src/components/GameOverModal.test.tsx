import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import GameOverModal from './GameOverModal';
import type { DailyStats, GameOverModalProps, WordEntry } from '../types';

const STATS: DailyStats = {
  gamesPlayed: 3,
  gamesWon: 2,
  currentStreak: 1,
  maxStreak: 2,
  guessDistribution: [0, 1, 1, 0, 0, 0],
  lastPlayedDate: null,
};

const SOLUTION_ENTRY: WordEntry = {
  word: 'KALEM',
  category: 'isim',
  meaning: 'Yazı yazmaya yarayan araç',
  context: 'Çantasından bir kalem çıkardı.',
};

function renderModal(overrides: Partial<GameOverModalProps> = {}) {
  const props: GameOverModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    gameStatus: 'won',
    solution: 'KALEM',
    solutionEntry: SOLUTION_ENTRY,
    guesses: ['KALEM'],
    evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
    gameNumber: 1,
    stats: STATS,
    isUnlimited: false,
    onPlayAgain: vi.fn(),
    onGoHome: vi.fn(),
    ...overrides,
  };
  return render(
    <MemoryRouter initialEntries={['/daily/5']}>
      <GameOverModal {...props} />
    </MemoryRouter>
  );
}

describe('GameOverModal', () => {
  it('should not render the meaning text even when solutionEntry has one', () => {
    renderModal();
    expect(screen.queryByText('Yazı yazmaya yarayan araç')).not.toBeInTheDocument();
    expect(screen.queryByText('Anlam:')).not.toBeInTheDocument();
  });

  it('should not render the context text even when solutionEntry has one', () => {
    renderModal();
    expect(screen.queryByText('"Çantasından bir kalem çıkardı."')).not.toBeInTheDocument();
    expect(screen.queryByText('Bağlam:')).not.toBeInTheDocument();
  });

  it('should not render a category badge', () => {
    renderModal();
    expect(screen.queryByText('isim')).not.toBeInTheDocument();
  });

  it('should still render without a solutionEntry', () => {
    renderModal({ solutionEntry: null });
    expect(screen.getByText('Tebrikler!')).toBeInTheDocument();
  });

  it('should show only the word, not the meaning or context, when a solution with a meaning is revealed on a loss (008-AE6)', () => {
    renderModal({ gameStatus: 'lost', guesses: [] });
    expect(screen.getByText('KALEM')).toBeInTheDocument();
    expect(screen.queryByText('Yazı yazmaya yarayan araç')).not.toBeInTheDocument();
    expect(screen.queryByText('Anlam:')).not.toBeInTheDocument();
    expect(screen.queryByText('"Çantasından bir kalem çıkardı."')).not.toBeInTheDocument();
    expect(screen.queryByText('Bağlam:')).not.toBeInTheDocument();
  });

  describe('share text footer', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'share');
      vi.restoreAllMocks();
    });

    async function captureSharedText(): Promise<string> {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      await act(async () => {
        fireEvent.click(screen.getByText('Sonucu paylaş'));
      });
      expect(shareMock).toHaveBeenCalledTimes(1);
      return (shareMock.mock.calls[0]![0] as { text: string }).text;
    }

    it('should footer with "İpucuyla" when a hint was used (011-AE6)', async () => {
      renderModal({ hintUsed: true });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 2]).toContain('İpucuyla');
    });

    it('should footer with "İpucusuz" and the current streak when no hint was used', async () => {
      renderModal({ hintUsed: false });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 2]).toBe('İpucusuz · Seri 1');
    });

    it('should not append a streak suffix when the current streak is zero', async () => {
      renderModal({ hintUsed: false, stats: { ...STATS, currentStreak: 0 } });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 2]).toBe('İpucusuz');
    });

    it('should end the shared text with the challengeUrl and footer "İpucuyla" when hintUsed is true', async () => {
      renderModal({ challengeUrl: 'https://harfhane.app/daily/5', hintUsed: true });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 1]).toBe('https://harfhane.app/daily/5');
      expect(lines[lines.length - 2]).toContain('İpucuyla');
    });

    it('should end the shared text with the challengeUrl and footer "İpucusuz" when hintUsed is false', async () => {
      renderModal({ challengeUrl: 'https://harfhane.app/daily/5', hintUsed: false, stats: { ...STATS, currentStreak: 0 } });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 1]).toBe('https://harfhane.app/daily/5');
      expect(lines[lines.length - 2]).toBe('İpucusuz');
    });

    it('should never reveal the solution in the shared text', async () => {
      renderModal({ hintUsed: false });
      const sharedText = await captureSharedText();
      expect(sharedText).not.toContain('KALEM');
    });

    it('should default to "harfhane.app" as the last line when no challengeUrl is given', async () => {
      renderModal({ hintUsed: false, challengeUrl: undefined });
      const lines = (await captureSharedText()).split('\n');
      expect(lines[lines.length - 1]).toBe('harfhane.app');
    });
  });

  describe('game-over sheet', () => {
    afterEach(() => {
      window.innerWidth = 1024;
    });

    it('should show the third distribution bar highlighted with its count outside the bar and "Sonucu paylaş" as the only primary button, on a 390px window (012-AE7)', () => {
      window.innerWidth = 390;
      renderModal({
        gameStatus: 'won',
        guesses: ['KALEM', 'KALEM', 'KALEM'],
        evaluations: [
          ['absent', 'absent', 'absent', 'absent', 'absent'],
          ['present', 'present', 'present', 'present', 'present'],
          ['correct', 'correct', 'correct', 'correct', 'correct'],
        ],
        stats: { ...STATS, guessDistribution: [0, 0, 1, 0, 0, 0] },
      });

      const highlightedBar = screen.getByTestId('distribution-bar-3');
      expect(highlightedBar.className).toContain('bg-correct');
      const highlightedCount = screen.getByTestId('distribution-count-3');
      expect(highlightedCount).toHaveTextContent('1');
      expect(highlightedBar).not.toContainElement(highlightedCount);

      const otherBar = screen.getByTestId('distribution-bar-1');
      expect(otherBar.className).not.toContain('bg-correct');

      const primaryButtons = screen
        .getAllByRole('button')
        .filter((button) => button.className.includes('bg-brand'));
      expect(primaryButtons).toHaveLength(1);
      expect(primaryButtons[0]).toHaveTextContent('Sonucu paylaş');
    });

    it('should show "Sınırsız modda devam et" as the secondary action for a daily game', () => {
      renderModal({ isUnlimited: false, gameStatus: 'won' });
      expect(screen.getByText('Sınırsız modda devam et')).toBeInTheDocument();
    });

    it('should show "Yeni kelime" as the secondary action for an unlimited game', () => {
      renderModal({ isUnlimited: true, gameStatus: 'won' });
      expect(screen.getByText('Yeni kelime')).toBeInTheDocument();
    });

    function LocationDisplay(): React.JSX.Element {
      const location = useLocation();
      return <div data-testid="location-display">{location.pathname}</div>;
    }

    it('should navigate from /daily/6 to /unlimited/6 when "Sınırsız modda devam et" is clicked, not a hardcoded length', () => {
      const props: GameOverModalProps = {
        isOpen: true,
        onClose: vi.fn(),
        gameStatus: 'won',
        solution: 'KAPLAN',
        solutionEntry: null,
        guesses: ['KAPLAN'],
        evaluations: [['correct', 'correct', 'correct', 'correct', 'correct', 'correct']],
        gameNumber: 1,
        stats: STATS,
        isUnlimited: false,
        onPlayAgain: vi.fn(),
        onGoHome: vi.fn(),
      };

      render(
        <MemoryRouter initialEntries={['/daily/6']}>
          <GameOverModal {...props} />
          <LocationDisplay />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Sınırsız modda devam et'));

      expect(screen.getByTestId('location-display')).toHaveTextContent('/unlimited/6');
    });
  });
});
