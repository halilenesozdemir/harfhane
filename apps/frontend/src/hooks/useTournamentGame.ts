import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { validateWord } from '../lib/api';
import {
  getTournamentWord,
  saveTournamentResult,
  type TournamentStats,
} from '../lib/auth-api';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  normalizeWord,
} from '@harfhane/shared';
import type { GameState, TileStatus, WordLength } from '../types';
import { letterFromKey } from '../utils/keyboard';

const WIN_MESSAGES = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'] as const;

export interface TournamentGameReturn {
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, TileStatus>;
  solution: string;
  solutionMeaning: string;
  wordLength: WordLength;
  wordId: number | null;
  isRevealing: boolean;
  isLoading: boolean;
  isError: boolean;
  shakeRow: boolean;
  message: string;
  tournamentScore: number | null;
  userTotalScore: number;
  tournamentStats: TournamentStats | null;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  startNewGame: () => void;
}

export function useTournamentGame(): TournamentGameReturn {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  const [solution, setSolution] = useState('');
  const [solutionMeaning, setSolutionMeaning] = useState('');
  const [wordLength, setWordLength] = useState<WordLength>(5);
  const [wordId, setWordId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [tournamentScore, setTournamentScore] = useState<number | null>(null);
  const [userTotalScore, setUserTotalScore] = useState(0);
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null);
  const isSubmittingRef = useRef(false);
  const resultSavedRef = useRef(false);

  const showMessage = useCallback((msg: string, duration = 2000): void => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  const fetchWord = useCallback(async (): Promise<void> => {
    if (!token) {
      setIsError(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await getTournamentWord(token);
      setSolution(normalizeWord(data.word.word));
      setSolutionMeaning(data.word.meaning ?? '');
      setWordLength(data.word.length as WordLength);
      setWordId(data.word.id);
      setTournamentStats(data.stats);
      setUserTotalScore(data.stats.total_score);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchWord();
  }, [fetchWord]);

  const saveResult = useCallback(async (won: boolean, guessCount: number): Promise<void> => {
    if (!token || !wordId || resultSavedRef.current) return;
    resultSavedRef.current = true;
    try {
      const result = await saveTournamentResult(token, {
        word_id: wordId,
        word_length: wordLength,
        guesses: guessCount,
        won,
      });
      setTournamentScore(result.score);
      setUserTotalScore(result.total_score);
    } catch {
      showMessage('Skor kaydedilemedi');
    }
  }, [token, wordId, wordLength, showMessage]);

  const applyGuess = useCallback((guess: string): void => {
    const evaluation = evaluateGuess(guess, solution);
    const newGuesses = [...gameState.guesses, guess];
    const newEvaluations = [...gameState.evaluations, evaluation];
    const newKeyboard = updateKeyboardStatus(gameState.keyboardStatus, guess, evaluation);
    const newStatus = checkGameStatus(newGuesses, solution);

    setIsRevealing(true);
    setGameState({
      guesses: newGuesses,
      evaluations: newEvaluations,
      currentGuess: '',
      gameStatus: newStatus,
      keyboardStatus: newKeyboard,
    });

    setTimeout(() => {
      setIsRevealing(false);
      if (newStatus === 'won') {
        showMessage(WIN_MESSAGES[newGuesses.length - 1] ?? 'Tebrikler!', 3000);
        void saveResult(true, newGuesses.length);
      } else if (newStatus === 'lost') {
        showMessage(`Kelime: ${solution}`, 5000);
        void saveResult(false, newGuesses.length);
      }
    }, wordLength * 100 + 500);
  }, [solution, gameState, wordLength, showMessage, saveResult]);

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
  }, [gameState, wordLength, isRevealing, solution, showMessage, applyGuess]);

  const addLetter = useCallback((letter: string): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length >= wordLength) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess + normalizeWord(letter) }));
  }, [gameState.gameStatus, gameState.currentGuess.length, wordLength]);

  const removeLetter = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length === 0) return;
    setGameState(prev => ({ ...prev, currentGuess: prev.currentGuess.slice(0, -1) }));
  }, [gameState.gameStatus, gameState.currentGuess.length]);

  const startNewGame = useCallback((): void => {
    setGameState({
      guesses: [],
      evaluations: [],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
    });
    setTournamentScore(null);
    resultSavedRef.current = false;
    queryClient.removeQueries({ queryKey: ['tournament'] });
    void fetchWord();
  }, [fetchWord, queryClient]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
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
    guesses: gameState.guesses,
    evaluations: gameState.evaluations,
    currentGuess: gameState.currentGuess,
    gameStatus: gameState.gameStatus,
    keyboardStatus: gameState.keyboardStatus,
    solution,
    solutionMeaning,
    wordLength,
    wordId,
    isRevealing,
    isLoading,
    isError,
    shakeRow,
    message,
    tournamentScore,
    userTotalScore,
    tournamentStats,
    addLetter,
    removeLetter,
    submitGuess,
    startNewGame,
  };
}
