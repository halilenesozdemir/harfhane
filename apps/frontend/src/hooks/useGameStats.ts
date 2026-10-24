import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { requestPersistentStorage } from '../utils/persistStorage';
import { getTodayString } from '@harfhane/shared';
import type { DailyStats, UnlimitedStats, WordLength } from '../types';

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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0]!;
      const isConsecutive = prev.lastPlayedDate === yesterdayString;
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
        lastPlayedDate: getTodayString(),
      };
    });
  }, [isUnlimited, setStats, setUnlimitedStats]);

  return { currentStats: isUnlimited ? unlimitedStats : stats, updateStats };
}
