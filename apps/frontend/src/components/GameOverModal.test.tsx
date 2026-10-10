import { render, screen, fireEvent, act } from '@testing-library/react';
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
  return render(<GameOverModal {...props} />);
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

  describe('share text hint marker', () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'share');
      vi.restoreAllMocks();
    });

    it('should end the shared header line with "· ipucu" when a hint was used (011-AE6)', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      renderModal({ hintUsed: true });

      await act(async () => {
        fireEvent.click(screen.getByText('Paylaş'));
      });
      expect(shareMock).toHaveBeenCalledTimes(1);

      const sharedText = (shareMock.mock.calls[0]![0] as { text: string }).text;
      expect(sharedText.split('\n')[0]).toContain('· ipucu');
    });

    it('should not append "· ipucu" to the shared header line when no hint was used', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      renderModal({ hintUsed: false });

      await act(async () => {
        fireEvent.click(screen.getByText('Paylaş'));
      });
      expect(shareMock).toHaveBeenCalledTimes(1);

      const sharedText = (shareMock.mock.calls[0]![0] as { text: string }).text;
      expect(sharedText.split('\n')[0]).not.toContain('ipucu');
    });

    it('should end the shared text with the challengeUrl and mark the header with "· ipucu" when hintUsed is true', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      renderModal({ challengeUrl: 'https://harfhane.app/daily/5', hintUsed: true });

      await act(async () => {
        fireEvent.click(screen.getByText('Paylaş'));
      });
      expect(shareMock).toHaveBeenCalledTimes(1);

      const sharedText = (shareMock.mock.calls[0]![0] as { text: string }).text;
      const lines = sharedText.split('\n');
      expect(lines[lines.length - 1]).toBe('https://harfhane.app/daily/5');
      expect(lines[0]).toContain('· ipucu');
    });

    it('should end the shared text with the challengeUrl and not mark the header when hintUsed is false', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      renderModal({ challengeUrl: 'https://harfhane.app/daily/5', hintUsed: false });

      await act(async () => {
        fireEvent.click(screen.getByText('Paylaş'));
      });
      expect(shareMock).toHaveBeenCalledTimes(1);

      const sharedText = (shareMock.mock.calls[0]![0] as { text: string }).text;
      const lines = sharedText.split('\n');
      expect(lines[lines.length - 1]).toBe('https://harfhane.app/daily/5');
      expect(lines[0]).not.toContain('ipucu');
    });
  });
});
