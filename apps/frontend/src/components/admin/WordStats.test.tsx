import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import WordStats from './WordStats';
import * as adminApi from '../../lib/admin-api';
import type { WordStatRow } from '../../lib/admin-api';

vi.mock('../../lib/admin-api');

const ROWS: WordStatRow[] = [
  { word: 'KALEM', meaning: 'yazı aracı', total_played: 10, total_won: 7, win_rate: 70, avg_guesses: 3.2 },
];

describe('WordStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show a loading message before the stats resolve', () => {
    vi.spyOn(adminApi, 'getWordStats').mockReturnValue(new Promise(() => {}));
    render(<WordStats secret="s" />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('should show the word rows after the stats resolve', async () => {
    vi.spyOn(adminApi, 'getWordStats').mockResolvedValue(ROWS);
    render(<WordStats secret="s" />);
    await waitFor(() => expect(screen.getByText('KALEM')).toBeInTheDocument());
  });

  it('should show an error message when the request fails', async () => {
    vi.spyOn(adminApi, 'getWordStats').mockRejectedValue(new Error('Sunucu hatası'));
    render(<WordStats secret="s" />);
    await waitFor(() => expect(screen.getByText('Sunucu hatası')).toBeInTheDocument());
  });

  it('should refetch with the new sort when the sort button is clicked', async () => {
    const getWordStats = vi.spyOn(adminApi, 'getWordStats').mockResolvedValue(ROWS);
    render(<WordStats secret="s" />);
    await waitFor(() => expect(getWordStats).toHaveBeenCalledWith('s', 'played'));

    fireEvent.click(screen.getByText('En yüksek kazanma %'));

    await waitFor(() => expect(getWordStats).toHaveBeenCalledWith('s', 'win_rate'));
  });
});
