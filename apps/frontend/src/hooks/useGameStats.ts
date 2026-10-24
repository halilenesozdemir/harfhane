import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { requestPersistentStorage } from '../utils/persistStorage';
import { getTodayString } from '@harfhane/shared';
import type { DailyStats, UnlimitedStats, WordLength } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface UseGameStatsOptions {
  isUnlimited: boolean;
  wordLength: WordLength;
}

interface UseGameStatsReturn {
  currentStats: DailyStats | UnlimitedStats;
  updateStats: (won: boolean, guessCount: number) => void;
}

export function useGameStats({ isUnlimited, wordLength }: UseGameStatsOptions): UseGameStatsReturn {
  const [stats, setStats] = useLocalStorage<DailyStats>(`harfhane:stats:${wordLength}`, {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: null,
  });

  const [unlimitedStats, setUnlimitedStats] = useLocalStorage<UnlimitedStats>(`harfhane:unlimited:stats:${wordLength}`, {
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  const updateStats = useCallback((won: boolean, guessCount: number): void => {
    void requestPersistentStorage();
    if (isUnlimited) {
      setUnlimitedStats(prev => {
        const newDistribution = [...prev.guessDistribution];
        if (won && guessCount > 0 && guessCount <= 6) {
          const index = guessCount - 1;
          newDistribution[index] = (newDistribution[index] ?? 0) + 1;
        }
        return { gamesPlayed: prev.gamesPlayed + 1, gamesWon: prev.gamesWon + (won ? 1 : 0), guessDistribution: newDistribution };
      });
      return;
    }

    setStats(prev => {
      // Turkey has no DST, so 24 hours back is always the previous Turkey day.
      const now = Date.now();
      const isConsecutive = prev.lastPlayedDate === getTodayString(new Date(now - MS_PER_DAY));
      const newCurrentStreak = won ? (isConsecutive ? prev.currentStreak + 1 : 1) : 0;
      const newDistribution = [...prev.guessDistribution];
      if (won && guessCount > 0 && guessCount <= 6) {
        const index = guessCount - 1;
        newDistribution[index] = (newDistribution[index] ?? 0) + 1;
      }
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (won ? 1 : 0),
        currentStreak: newCurrentStreak,
        maxStreak: Math.max(prev.maxStreak, newCurrentStreak),
        guessDistribution: newDistribution,
        lastPlayedDate: getTodayString(new Date(now)),
      };
    });
  }, [isUnlimited, setStats, setUnlimitedStats]);

  return { currentStats: isUnlimited ? unlimitedStats : stats, updateStats };
}
