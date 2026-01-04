import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  evaluateGuess, 
  updateKeyboardStatus, 
  checkGameStatus,
  getDailyWord,
  getTodayString,
  getGameNumber,
  normalizeWord
} from '../utils/gameLogic';
import type { GameMode, GameState, DailyStats, UnlimitedStats, TileStatus, WordEntry, WordData } from '../types';
import wordsDataImport from '../data/words.json';

const wordsData = wordsDataImport as WordData;

const WORD_LENGTH = 5;

// Rastgele kelime seç (sınırsız mod için)
const getRandomWord = (): string => {
  const words = wordsData.dailyWords;
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex]?.word ?? 'NURLU';
};

interface UseGameStateReturn {
  // State
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, TileStatus>;
  solution: string;
  solutionEntry: WordEntry | null;
  gameNumber: number;
  stats: DailyStats | UnlimitedStats;
  isRevealing: boolean;
  shakeRow: boolean;
  message: string;
  hasSeenHelp: boolean;
  mode: GameMode;
  isUnlimited: boolean;
  
  // Actions
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  setHasSeenHelp: (value: boolean) => void;
  startNewGame: () => void;
}

export const useGameState = (mode: GameMode = 'daily'): UseGameStateReturn => {
  const isUnlimited = mode === 'unlimited';
  
  // Günlük veya rastgele kelime
  const [solution, setSolution] = useState<string>(() => {
    return isUnlimited ? getRandomWord() : getDailyWord(wordsData.dailyWords);
  });
  
  // Kelime bilgisi
  const [solutionEntry, setSolutionEntry] = useState<WordEntry | null>(() => {
    const entry = wordsData.dailyWords.find(w => w.word === solution);
    return entry ?? null;
  });
  
  const gameNumber = isUnlimited ? 0 : getGameNumber();
  const todayString = getTodayString();

  // Kalıcı veriler (localStorage) - sadece günlük mod için
  const [stats, setStats] = useLocalStorage<DailyStats>('nurdle:stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: null,
  });

  // Sınırsız mod için ayrı istatistik
  const [unlimitedStats, setUnlimitedStats] = useLocalStorage<UnlimitedStats>('nurdle:unlimited:stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  // Günlük oyun state'i (localStorage'dan)
  const [dailyGameState, setDailyGameState] = useLocalStorage<GameState>(`nurdle:game:${todayString}`, {
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  // Sınırsız mod için geçici state
  const [unlimitedGameState, setUnlimitedGameState] = useState<GameState>({
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  // Aktif state seçimi
  const gameState = isUnlimited ? unlimitedGameState : dailyGameState;
  const setGameState = isUnlimited ? setUnlimitedGameState : setDailyGameState;
  const currentStats = isUnlimited ? unlimitedStats : stats;

  const [hasSeenHelp, setHasSeenHelp] = useLocalStorage<boolean>('nurdle:has-seen-help', false);

  // Geçici state'ler (animasyonlar için)
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Mesajı göster ve temizle
  const showMessage = useCallback((msg: string, duration = 2000): void => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  // Harf ekle
  const addLetter = useCallback((letter: string): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length >= WORD_LENGTH) return;
    if (isRevealing) return;

    const normalizedLetter = normalizeWord(letter);
    
    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess + normalizedLetter,
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length, isRevealing, setGameState]);

  // Harf sil
  const removeLetter = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length === 0) return;
    if (isRevealing) return;

    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1),
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length, isRevealing, setGameState]);

  // Tahmin yap
  const submitGuess = useCallback((): void => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length !== WORD_LENGTH) {
      setShakeRow(true);
      showMessage('Kelime 5 harf olmalı');
      setTimeout(() => setShakeRow(false), 500);
      return;
    }
    if (isRevealing) return;

    const guess = gameState.currentGuess;
    
    // Tahmini değerlendir
    const evaluation = evaluateGuess(guess, solution);
    const newGuesses = [...gameState.guesses, guess];
    const newEvaluations = [...gameState.evaluations, evaluation];
    const newKeyboardStatus = updateKeyboardStatus(gameState.keyboardStatus, guess, evaluation);
    const newGameStatus = checkGameStatus(newGuesses, solution);

    // Reveal animasyonu
    setIsRevealing(true);
    
    // State'i güncelle
    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      evaluations: newEvaluations,
      currentGuess: '',
      gameStatus: newGameStatus,
      keyboardStatus: newKeyboardStatus,
    }));

    // Animasyon bitince
    setTimeout(() => {
      setIsRevealing(false);
      
      // Oyun bittiyse istatistikleri güncelle
      if (newGameStatus === 'won') {
        const messages = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'];
        const messageIndex = newGuesses.length - 1;
        showMessage(messages[messageIndex] ?? 'Tebrikler!', 3000);
        updateStats(true, newGuesses.length);
      } else if (newGameStatus === 'lost') {
        showMessage(`Kelime: ${solution}`, 5000);
        updateStats(false, 0);
      }
    }, WORD_LENGTH * 300 + 200);
  }, [
    gameState.gameStatus, 
    gameState.currentGuess, 
    gameState.guesses, 
    gameState.evaluations,
    gameState.keyboardStatus,
    isRevealing,
    solution,
    setGameState,
    showMessage
  ]);

  // İstatistikleri güncelle
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

  // Yeni oyun başlat (sınırsız mod için)
  const startNewGame = useCallback((): void => {
    if (!isUnlimited) return;
    
    const newWord = getRandomWord();
    setSolution(newWord);
    
    const entry = wordsData.dailyWords.find(w => w.word === newWord);
    setSolutionEntry(entry ?? null);
    
    setUnlimitedGameState({
      guesses: [],
      evaluations: [],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
    });
  }, [isUnlimited]);

  // Klavye event listener
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
    // State
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
    shakeRow,
    message,
    hasSeenHelp,
    mode,
    isUnlimited,
    
    // Actions
    addLetter,
    removeLetter,
    submitGuess,
    setHasSeenHelp,
    startNewGame,
  };
};

export default useGameState;
