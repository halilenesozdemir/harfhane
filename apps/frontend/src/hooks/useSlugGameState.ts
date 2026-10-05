import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { useListInfo, useSlugWord, useSlugDailyWord } from './useWordApi';
import { validateWordInList } from '../lib/api';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  normalizeWord,
  getTimeUntilMidnight,
  getTodayString,
} from '@harfhane/shared';
import type { GameState, UnlimitedStats, WordEntry, TimeCountdown, TileStatus, WordLength } from '../types';
import { letterFromKey } from '../utils/keyboard';

interface PersistedDailyState {
  date: string;
  guesses: string[];
  evaluations: TileStatus[][];
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, TileStatus>;
}

export interface UseSlugGameStateReturn {
  listName: string;
  wordLength: WordLength;
  hasDaily: boolean;
  solution: string;
  solutionEntry: WordEntry | null;
  gameNumber: number;
  slugStats: UnlimitedStats;
  gameState: GameState;
  isRevealing: boolean;
  shakeRow: boolean;
  message: string;
  showGameOverModal: boolean;
  setShowGameOverModal: (show: boolean) => void;
  countdown: TimeCountdown;
  isLoading: boolean;
  isError: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  startNewGame: () => void;
}

const WIN_MESSAGES = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'] as const;
const EMPTY_GAME_STATE: GameState = { guesses: [], evaluations: [], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} };

export function useSlugGameState(slug: string): UseSlugGameStateReturn {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: listData, isLoading: listLoading, isError: listError } = useListInfo(slug);
  const wordLength = (listData?.list.wordLength ?? 5) as WordLength;
  const hasDaily = listData?.list.hasDaily ?? false;
  const listName = listData?.list.name ?? slug.toUpperCase();

  const { data: randomWordData, isLoading: randomLoading, isError: randomError, refetch } =
    useSlugWord(slug, !listLoading && !listError && !hasDaily);
  const { data: dailyWordData, isLoading: dailyLoading, isError: dailyError } =
    useSlugDailyWord(slug, today, !listLoading && !listError && hasDaily);

  const wordData = hasDaily ? dailyWordData : randomWordData;
  const isLoading = listLoading || (hasDaily ? dailyLoading : randomLoading);
  const isError = listError || (hasDaily ? dailyError : randomError);
  const solution = wordData?.word.word ?? '';
  const solutionEntry: WordEntry | null = wordData?.word ?? null;
  const gameNumber = hasDaily ? (dailyWordData?.gameNumber ?? 0) : 0;

  const [slugStats, setSlugStats] = useLocalStorage<UnlimitedStats>(`harfhane:slug:${slug}:stats`, {
    gamesPlayed: 0, gamesWon: 0, guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  const [dailyPersistedState, setDailyPersistedState] = useLocalStorage<PersistedDailyState | null>(
    `harfhane:slug:${slug}:daily:${today}`, null
  );

  const [gameState, setGameState] = useState<GameState>(EMPTY_GAME_STATE);
  const [isRevealing, setIsRevealing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [countdown, setCountdown] = useState<TimeCountdown>(getTimeUntilMidnight());
  const isSubmittingRef = useRef(false);
  const [prevSolution, setPrevSolution] = useState('');
  const [restoreFinishedFor, setRestoreFinishedFor] = useState<string | null>(null);

  if (solution && solution !== prevSolution) {
    setPrevSolution(solution);

    if (hasDaily && dailyPersistedState?.date === today) {
      setGameState({
        guesses: dailyPersistedState.guesses,
        evaluations: dailyPersistedState.evaluations,
        currentGuess: '',
        gameStatus: dailyPersistedState.gameStatus,
        keyboardStatus: dailyPersistedState.keyboardStatus,
      });
      setRestoreFinishedFor(dailyPersistedState.gameStatus !== 'playing' ? solution : null);
    } else {
      setGameState(EMPTY_GAME_STATE);
      setIsRevealing(false);
      setShakeRow(false);
      setMessage('');
      setShowGameOverModal(false);
      setRestoreFinishedFor(null);
    }
  }

  useEffect(() => {
    if (!hasDaily) return;
    const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, [hasDaily]);

  useEffect(() => {
    if (!restoreFinishedFor) return undefined;
    const timer = setTimeout(() => setShowGameOverModal(true), 300);
    return () => clearTimeout(timer);
  }, [restoreFinishedFor]);

  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      const t = setTimeout(() => setShowGameOverModal(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [gameState.gameStatus]);

  const showMessage = useCallback((msg: string, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const addLetter = useCallback((letter: string) => {
    if (gameState.gameStatus !== 'playing' || gameState.currentGuess.length >= wordLength) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess + normalizeWord(letter) }));
  }, [gameState.gameStatus, gameState.currentGuess.length, wordLength]);

  const removeLetter = useCallback(() => {
    if (gameState.gameStatus !== 'playing' || gameState.currentGuess.length === 0) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
  }, [gameState.gameStatus, gameState.currentGuess.length]);

  const applyGuess = useCallback((guess: string): void => {
    const evaluation = evaluateGuess(guess, solution);
    const newGuesses = [...gameState.guesses, guess];
    const newEvaluations = [...gameState.evaluations, evaluation];
    const newKeyboardStatus = updateKeyboardStatus(gameState.keyboardStatus, guess, evaluation);
    const newGameStatus = checkGameStatus(newGuesses, solution);

    setIsRevealing(true);
    setGameState({ guesses: newGuesses, evaluations: newEvaluations, currentGuess: '', gameStatus: newGameStatus, keyboardStatus: newKeyboardStatus });

    setTimeout(() => {
      setIsRevealing(false);
      if (newGameStatus === 'won') {
        showMessage(WIN_MESSAGES[newGuesses.length - 1] ?? 'Tebrikler!', 3000);
        setSlugStats(prev => {
          const dist = [...prev.guessDistribution];
          const idx = newGuesses.length - 1;
          dist[idx] = (dist[idx] ?? 0) + 1;
          return { gamesPlayed: prev.gamesPlayed + 1, gamesWon: prev.gamesWon + 1, guessDistribution: dist };
        });
      } else if (newGameStatus === 'lost') {
        showMessage(`Kelime: ${solution}`, 5000);
        setSlugStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
      }
      if (hasDaily && newGameStatus !== 'playing') {
        setDailyPersistedState({ date: today, guesses: newGuesses, evaluations: newEvaluations, gameStatus: newGameStatus, keyboardStatus: newKeyboardStatus });
      }
    }, wordLength * 100 + 500);
  }, [solution, gameState.guesses, gameState.evaluations, gameState.keyboardStatus, wordLength, hasDaily, today, showMessage, setSlugStats, setDailyPersistedState]);

  const submitGuess = useCallback((): void => {
    if (gameState.gameStatus !== 'playing' || isRevealing || isSubmittingRef.current) return;
    if (gameState.currentGuess.length !== wordLength) {
      setShakeRow(true);
      showMessage(`Kelime ${wordLength} harf olmalı`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }
    if (!solution) return;

    const guess = gameState.currentGuess;
    isSubmittingRef.current = true;

    void validateWordInList(slug, guess)
      .then(({ isValid }) => {
        if (!isValid) {
          setShakeRow(true);
          showMessage('Kelime listede yok');
          setTimeout(() => setShakeRow(false), 500);
          return;
        }
        applyGuess(guess);
      })
      .catch(() => { showMessage('Bağlantı hatası, tekrar dene'); })
      .finally(() => { isSubmittingRef.current = false; });
  }, [gameState.gameStatus, gameState.currentGuess, wordLength, isRevealing, solution, slug, showMessage, applyGuess]);

  const startNewGame = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['word', 'slug', slug] });
    void refetch();
    setPrevSolution('');
  }, [queryClient, slug, refetch, setPrevSolution]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else {
        const letter = letterFromKey(e.key);
        if (letter) addLetter(letter);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, removeLetter, submitGuess]);

  return {
    listName,
    wordLength,
    hasDaily,
    solution,
    solutionEntry,
    gameNumber,
    slugStats,
    gameState,
    isRevealing,
    shakeRow,
    message,
    showGameOverModal,
    setShowGameOverModal,
    countdown,
    isLoading,
    isError,
    addLetter,
    removeLetter,
    submitGuess,
    startNewGame,
  };
}
