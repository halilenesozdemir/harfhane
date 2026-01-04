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
import wordsData from '../data/words.json';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// Rastgele kelime seç (sınırsız mod için)
const getRandomWord = () => {
  const words = wordsData.dailyWords;
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
};

export const useGameState = (mode = 'daily') => {
  const isUnlimited = mode === 'unlimited';
  
  // Günlük veya rastgele kelime
  const [solution, setSolution] = useState(() => {
    return isUnlimited ? getRandomWord() : getDailyWord(wordsData.dailyWords);
  });
  
  const gameNumber = isUnlimited ? 0 : getGameNumber();
  const todayString = getTodayString();

  // Kalıcı veriler (localStorage) - sadece günlük mod için
  const [stats, setStats] = useLocalStorage('nurdle:stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: null,
  });

  // Sınırsız mod için ayrı istatistik
  const [unlimitedStats, setUnlimitedStats] = useLocalStorage('nurdle:unlimited:stats', {
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  // Günlük oyun state'i (localStorage'dan)
  const [dailyGameState, setDailyGameState] = useLocalStorage(`nurdle:game:${todayString}`, {
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });

  // Sınırsız mod için geçici state
  const [unlimitedGameState, setUnlimitedGameState] = useState({
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
  const setCurrentStats = isUnlimited ? setUnlimitedStats : setStats;

  const [hasSeenHelp, setHasSeenHelp] = useLocalStorage('nurdle:has-seen-help', false);

  // Geçici state'ler (animasyonlar için)
  const [isRevealing, setIsRevealing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');

  // Mesajı göster ve temizle
  const showMessage = useCallback((msg, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  // Harf ekle
  const addLetter = useCallback((letter) => {
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
  const removeLetter = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length === 0) return;
    if (isRevealing) return;

    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1),
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length, isRevealing, setGameState]);

  // Tahmin yap
  const submitGuess = useCallback(() => {
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
        showMessage(['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'][newGuesses.length - 1], 3000);
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
  const updateStats = useCallback((won, guessCount) => {
    if (isUnlimited) {
      setUnlimitedStats(prev => {
        const newDistribution = [...prev.guessDistribution];
        if (won && guessCount > 0) {
          newDistribution[guessCount - 1]++;
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
        const yesterdayString = yesterday.toISOString().split('T')[0];
        const isConsecutive = prev.lastPlayedDate === yesterdayString;
        const newCurrentStreak = won ? (isConsecutive ? prev.currentStreak + 1 : 1) : 0;
        
        const newDistribution = [...prev.guessDistribution];
        if (won && guessCount > 0) {
          newDistribution[guessCount - 1]++;
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
  const startNewGame = useCallback(() => {
    if (!isUnlimited) return;
    
    setSolution(getRandomWord());
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
    const handleKeyDown = (e) => {
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
