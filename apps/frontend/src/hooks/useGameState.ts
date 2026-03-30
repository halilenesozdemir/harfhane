import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from './useLocalStorage';
import { useGameStats } from './useGameStats';
import { useDailyWord, useRandomWord } from './useWordApi';
import { useAuth } from '../context/AuthContext';
import { validateWord } from '../lib/api';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  getTodayString,
  normalizeWord,
} from '../utils/gameLogic';
import type { GameMode, GameState, WordEntry, WordLength, UseGameStateReturn } from '../types';

const WIN_MESSAGES = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'] as const;

export const useGameState = (mode: GameMode = 'daily', wordLength: WordLength = 5): UseGameStateReturn => {
  const isUnlimited = mode === 'unlimited';
  const queryClient = useQueryClient();
  const todayString = getTodayString();
  const { token, user } = useAuth();
  const userKey = user?.id ?? 'anon';

  const { data: dailyData, isLoading: isDailyLoading, isError: isDailyError } = useDailyWord(wordLength);
  const { data: randomData, isLoading: isRandomLoading, isError: isRandomError, refetch: refetchRandom } = useRandomWord(isUnlimited, wordLength);

  const wordData = isUnlimited ? randomData : dailyData;
  const isLoading = isUnlimited ? isRandomLoading : isDailyLoading;
  const isError = isUnlimited ? isRandomError : isDailyError;

  const solution = wordData?.word.word ?? '';
  const solutionEntry: WordEntry | null = wordData?.word ?? null;
  const gameNumber = isUnlimited ? 0 : (dailyData?.gameNumber ?? 0);
  const wordId = isUnlimited ? (randomData?.wordId ?? null) : null;

  const { currentStats, updateStats, lastXPResult } = useGameStats({ isUnlimited, wordLength, token, wordId });

  const [dailyGameState, setDailyGameState] = useLocalStorage<GameState>(`harfhane:game:${userKey}:${todayString}:${wordLength}`, {
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

  const [hasSeenHelp, setHasSeenHelp] = useLocalStorage<boolean>('harfhane:has-seen-help', false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const isSubmittingRef = useRef(false);

  const showMessage = useCallback((msg: string, duration = 2000): void => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const addLetter = useCallback((letter: string): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length >= wordLength) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess + normalizeWord(letter) }));
  }, [gameState.gameStatus, gameState.currentGuess.length, wordLength, setGameState]);

  const removeLetter = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length === 0) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
  }, [gameState.gameStatus, gameState.currentGuess.length, setGameState]);

  const applyGuess = useCallback((guess: string): void => {
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
        showMessage(WIN_MESSAGES[newGuesses.length - 1] ?? 'Tebrikler!', 3000);
        updateStats(true, newGuesses.length);
      } else if (newGameStatus === 'lost') {
        showMessage(`Kelime: ${solution}`, 5000);
        updateStats(false, 0);
      }
    }, wordLength * 300 + 200);
  }, [solution, gameState.guesses, gameState.evaluations, gameState.keyboardStatus, wordLength, setGameState, showMessage, updateStats]);

  const submitGuess = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length !== wordLength) {
      setShakeRow(true);
      showMessage(`Kelime ${wordLength} harf olmalı`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }
    if (isRevealing || isSubmittingRef.current || !solution) return;

    const guess = gameState.currentGuess;
    isSubmittingRef.current = true;

    void validateWord(guess)
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
  }, [
    gameState.gameStatus,
    gameState.currentGuess,
    wordLength,
    isRevealing,
    solution,
    showMessage,
    applyGuess,
  ]);

  const startNewGame = useCallback((): void => {
    if (!isUnlimited) return;
    queryClient.removeQueries({ queryKey: ['word', 'random', wordLength] });
    refetchRandom();
    setUnlimitedGameState({ guesses: [], evaluations: [], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} });
  }, [isUnlimited, wordLength, queryClient, refetchRandom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(e.key)) addLetter(e.key.toUpperCase());
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
    lastXPResult,
    wordId,
  };
};

export default useGameState;
