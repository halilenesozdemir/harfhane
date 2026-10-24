import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { useGameStats } from './useGameStats';
import { requestPersistentStorage } from '../utils/persistStorage';

vi.mock('../utils/persistStorage', () => ({ requestPersistentStorage: vi.fn().mockResolvedValue(undefined) }));

describe('useGameStats', () => {
  it('should update the local unlimited guess distribution when updateStats is called', () => {
    const { result } = renderHook(() => useGameStats({ isUnlimited: true, wordLength: 5 }));

    act(() => { result.current.updateStats(true, 3); });

    expect(result.current.currentStats.gamesPlayed).toBe(1);
    expect(result.current.currentStats.gamesWon).toBe(1);
    expect(result.current.currentStats.guessDistribution[2]).toBe(1);
  });

  it('should ask the browser to keep storage when a game result is saved', () => {
    const { result } = renderHook(() => useGameStats({ isUnlimited: false, wordLength: 5 }));

    act(() => { result.current.updateStats(false, 0); });

    expect(requestPersistentStorage).toHaveBeenCalled();
  });

  describe('daily streak across the Turkey day boundary', () => {
    afterEach(() => vi.useRealTimers());

    it('should continue the streak when the player played yesterday and plays just after Turkey midnight', () => {
      // 01:30 on 25 October in Turkey (UTC+3) is still 24 October in UTC.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-24T22:30:00Z'));
      localStorage.setItem('harfhane:stats:5', JSON.stringify({
        gamesPlayed: 3, gamesWon: 3, currentStreak: 3, maxStreak: 3,
        guessDistribution: [0, 0, 3, 0, 0, 0], lastPlayedDate: '2026-10-24',
      }));
      const { result } = renderHook(() => useGameStats({ isUnlimited: false, wordLength: 5 }));

      act(() => { result.current.updateStats(true, 3); });

      expect(result.current.currentStats).toMatchObject({ currentStreak: 4, lastPlayedDate: '2026-10-25' });
    });

    it('should restart the streak at 1 when the player skipped a Turkey day', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-24T22:30:00Z'));
      localStorage.setItem('harfhane:stats:5', JSON.stringify({
        gamesPlayed: 3, gamesWon: 3, currentStreak: 3, maxStreak: 3,
        guessDistribution: [0, 0, 3, 0, 0, 0], lastPlayedDate: '2026-10-23',
      }));
      const { result } = renderHook(() => useGameStats({ isUnlimited: false, wordLength: 5 }));

      act(() => { result.current.updateStats(true, 3); });

      expect(result.current.currentStats).toMatchObject({ currentStreak: 1, maxStreak: 3 });
    });
  });
});
