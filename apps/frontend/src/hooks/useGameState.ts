import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { useDailyWord, useRandomWord } from './useWordApi';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  getTodayString,
  normalizeWord,
} from '../utils/gameLogic';
import type { GameMode, GameState, DailyStats, UnlimitedStats, TileStatus, WordEntry, WordLength } from '../types';

interface UseGameStateReturn {
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, TileStatus>;
  solution: string;
  solutionEntry: WordEntry | null;
  gameNumber: number | string;
  stats: DailyStats | UnlimitedStats;
  isRevealing: boolean;
  isLoading: boolean;
  isError: boolean;
  shakeRow: boolean;
  message: string;
  hasSeenHelp: boolean;
  mode: GameMode;
  wordLength: WordLength;
  isUnlimited: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  setHasSeenHelp: (value: boolean) => void;
  startNewGame: () => void;
}

export const useGameState = (mode: GameMode = 'daily', wordLength: WordLength = 5): UseGameStateReturn => {
  const isUnlimited = mode === 'unlimited';
  const queryClient = useQueryClient();
  const todayString = getTodayString();

  const { data: dailyData, isLoading: isDailyLoading, isError: isDailyError } = useDailyWord(wordLength);
  const { data: randomData, isLoading: isRandomLoading, isError: isRandomError, refetch: refetchRandom } = useRandomWord(isUnlimited, wordLength);

  const wordData = isUnlimited ? randomData : dailyData;
  const isLoading = isUnlimited ? isRandomLoading : isDailyLoading;
  const isError = isUnlimited ? isRandomError : isDailyError;

  const solution = wordData?.word.word ?? '';
  const solutionEntry: WordEntry | null = wordData?.word ?? null;
  const gameNumber = isUnlimited ? 0 : (dailyData?.gameNumber ?? 0);

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

  const [dailyGameState, setDailyGameState] = useLocalStorage<GameState>(`nurdle:game:${todayString}:${wordLength}`, {
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  const [unlimitedGameState, setUnlimitedGameState] = useState<GameState>({
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  const gameState = isUnlimited ? unlimitedGameState : dailyGameState;
  const setGameState = isUnlimited ? setUnlimitedGameState : setDailyGameState;
  const currentStats = isUnlimited ? unlimitedStats : stats;

  const [hasSeenHelp, setHasSeenHelp] = useLocalStorage<boolean>('nurdle:has-seen-help', false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const showMessage = useCallback((msg: string, duration = 2000): void => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const addLetter = useCallback((letter: string): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length >= wordLength) return;
    if (isRevealing) return;

    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess + normalizeWord(letter),
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length, wordLength, isRevealing, setGameState]);

  const removeLetter = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length === 0) return;
    if (isRevealing) return;

    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1),
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length, isRevealing, setGameState]);

  const updateStats = useCallback((won: boolean, guessCount: number): void => {
    if (isUnlimited) {
      setUnlimitedStats(prev => {
        const newDistribution = [...prev.guessDistribution];
        if (won && guessCount > 0 && guessCount <= 6) {
          const index = guessCount - 1;
          newDistribution[index] = (newDistribution[index] ?? 0) + 1;
        }
        return {
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + (won ? 1 : 0),
          guessDistribution: newDistribution,
        };
      });
    } else {
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
    }
  }, [isUnlimited, setStats, setUnlimitedStats]);

  const submitGuess = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length !== wordLength) {
      setShakeRow(true);
      showMessage(`Kelime ${wordLength} harf olmalı`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }
    if (isRevealing) return;
    if (!solution) {
      showMessage('Kelime yüklenemedi, sayfayı yenileyin');
      return;
    }

    const guess = gameState.currentGuess;

    const evaluation = evaluateGuess(guess, solution);
    const newGuesses = [...gameState.guesses, guess];
    const newEvaluations = [...gameState.evaluations, evaluation];
    const newKeyboardStatus = updateKeyboardStatus(gameState.keyboardStatus, guess, evaluation);
    const newGameStatus = checkGameStatus(newGuesses, solution);

    setIsRevealing(true);
    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      evaluations: newEvaluations,
      currentGuess: '',
      gameStatus: newGameStatus,
      keyboardStatus: newKeyboardStatus,
    }));

    setTimeout(() => {
      setIsRevealing(false);
      if (newGameStatus === 'won') {
        const messages = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'];
        showMessage(messages[newGuesses.length - 1] ?? 'Tebrikler!', 3000);
        updateStats(true, newGuesses.length);
      } else if (newGameStatus === 'lost') {
        showMessage(`Kelime: ${solution}`, 5000);
        updateStats(false, 0);
      }
    }, wordLength * 300 + 200);
  }, [
    gameState.gameStatus,
    gameState.currentGuess,
    gameState.guesses,
    gameState.evaluations,
    gameState.keyboardStatus,
    wordLength,
    isRevealing,
    solution,
    setGameState,
    showMessage,
    updateStats,
  ]);


  const startNewGame = useCallback((): void => {
    if (!isUnlimited) return;

    queryClient.removeQueries({ queryKey: ['word', 'random', wordLength] });
    refetchRandom();

    setUnlimitedGameState({
      guesses: [],
      evaluations: [],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
    });
  }, [isUnlimited, wordLength, queryClient, refetchRandom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey) return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        removeLetter();
      } else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(e.key)) {
        addLetter(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, removeLetter, submitGuess]);

  return {
    guesses: gameState.guesses,
    evaluations: gameState.evaluations,
    currentGuess: gameState.currentGuess,
    gameStatus: gameState.gameStatus,
    keyboardStatus: gameState.keyboardStatus,
    solution,
    solutionEntry,
    gameNumber,
    stats: currentStats,
    isRevealing,
    isLoading,
    isError,
    shakeRow,
    message,
    hasSeenHelp,
    mode,
    wordLength,
    isUnlimited,
    addLetter,
    removeLetter,
    submitGuess,
    setHasSeenHelp,
    startNewGame,
  };
};

export default useGameState;
