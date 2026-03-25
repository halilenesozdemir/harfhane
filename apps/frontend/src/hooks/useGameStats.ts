import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { saveResult } from '../lib/auth-api';
import { getTodayString } from '../utils/gameLogic';
import type { DailyStats, UnlimitedStats, WordLength, GameXPResult } from '../types';

interface UseGameStatsOptions {
  isUnlimited: boolean;
  wordLength: WordLength;
  token: string | null;
}

interface UseGameStatsReturn {
  currentStats: DailyStats | UnlimitedStats;
  updateStats: (won: boolean, guessCount: number) => void;
  lastXPResult: GameXPResult | null;
}

export function useGameStats({ isUnlimited, wordLength, token }: UseGameStatsOptions): UseGameStatsReturn {
  const [stats, setStats] = useLocalStorage<DailyStats>(`nurdle:stats:${wordLength}`, {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: null,
  });

  const [unlimitedStats, setUnlimitedStats] = useLocalStorage<UnlimitedStats>(`nurdle:unlimited:stats:${wordLength}`, {
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  const [lastXPResult, setLastXPResult] = useState<GameXPResult | null>(null);
  const queryClient = useQueryClient();

  const updateStats = useCallback((won: boolean, guessCount: number): void => {
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

    if (token) {
      void saveResult(token, {
        date: getTodayString(),
        word_length: wordLength,
        guesses: won ? guessCount : 0,
        won,
      }).then(result => {
        if (result.xp) {
          setLastXPResult(result.xp);
          void queryClient.invalidateQueries({ queryKey: ['xp', 'profile'] });
        }
      }).catch((_: unknown) => undefined);
    }
  }, [isUnlimited, token, wordLength, setStats, setUnlimitedStats, queryClient]);

  return { currentStats: isUnlimited ? unlimitedStats : stats, updateStats, lastXPResult };
}
