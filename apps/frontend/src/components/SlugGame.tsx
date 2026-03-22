import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Home, RotateCcw } from 'lucide-react';
import { useListInfo, useSlugWord, useSlugDailyWord } from '../hooks/useWordApi';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  normalizeWord,
  getTimeUntilMidnight,
  getTodayString,
} from '../utils/gameLogic';
import GameGrid from './GameGrid';
import Keyboard from './Keyboard';
import Toast from './Toast';
import GameOverModal from './GameOverModal';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import type { GameState, UnlimitedStats, WordEntry, TimeCountdown } from '../types';

interface SlugGameProps {
  slug: string;
  onGoHome: () => void;
  onAuthRequired?: () => void;
}

interface DailyGameState {
  date: string;
  guesses: string[];
  evaluations: Array<Array<'correct' | 'present' | 'absent' | null>>;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, 'correct' | 'present' | 'absent' | null>;
}

export default function SlugGame({ slug, onGoHome, onAuthRequired }: SlugGameProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const today = getTodayString();

  const { data: listData, isLoading: listLoading, isError: listError } = useListInfo(slug);
  const wordLength = listData?.list.wordLength ?? 5;
  const hasDaily = listData?.list.hasDaily ?? false;

  // Random mod: listeye has_daily yoksa
  const {
    data: randomWordData,
    isLoading: randomLoading,
    isError: randomError,
    refetch,
  } = useSlugWord(slug, !listLoading && !listError && !hasDaily);

  // Günlük mod: listeye has_daily varsa
  const {
    data: dailyWordData,
    isLoading: dailyLoading,
    isError: dailyError,
  } = useSlugDailyWord(slug, today, !listLoading && !listError && hasDaily);

  const wordData = hasDaily ? dailyWordData : randomWordData;
  const wordLoading = hasDaily ? dailyLoading : randomLoading;
  const wordError = hasDaily ? dailyError : randomError;
  const gameNumber = hasDaily ? (dailyWordData?.gameNumber ?? 0) : 0;

  const solution = wordData?.word.word ?? '';
  const solutionEntry: WordEntry | null = wordData?.word ?? null;

  // İstatistikler
  const [slugStats, setSlugStats] = useLocalStorage<UnlimitedStats>(`nurdle:slug:${slug}:stats`, {
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  // Günlük mod: oyun durumunu tarihe göre sakla
  const [dailyPersistedState, setDailyPersistedState] = useLocalStorage<DailyGameState | null>(
    `nurdle:slug:${slug}:daily:${today}`,
    null
  );

  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
  });
  const [isRevealing, setIsRevealing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [countdown, setCountdown] = useState<TimeCountdown>(getTimeUntilMidnight());

  // Günlük mod countdown
  useEffect(() => {
    if (!hasDaily) return;
    const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, [hasDaily]);

  // Yeni kelime gelince oyunu yükle / sıfırla
  useEffect(() => {
    if (!solution) return;

    if (hasDaily && dailyPersistedState?.date === today) {
      // Kaydedilmiş günlük oyun durumunu yükle
      setGameState({
        guesses: dailyPersistedState.guesses,
        evaluations: dailyPersistedState.evaluations,
        currentGuess: '',
        gameStatus: dailyPersistedState.gameStatus,
        keyboardStatus: dailyPersistedState.keyboardStatus,
      });
      if (dailyPersistedState.gameStatus !== 'playing') {
        setTimeout(() => setShowGameOverModal(true), 300);
      }
    } else {
      setGameState({ guesses: [], evaluations: [], currentGuess: '', gameStatus: 'playing', keyboardStatus: {} });
      setIsRevealing(false);
      setShakeRow(false);
      setMessage('');
      setShowGameOverModal(false);
    }
  }, [solution]);

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

  const submitGuess = useCallback(() => {
    if (gameState.gameStatus !== 'playing' || isRevealing) return;
    if (gameState.currentGuess.length !== wordLength) {
      setShakeRow(true);
      showMessage(`Kelime ${wordLength} harf olmalı`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }
    if (!solution) return;

    const evaluation = evaluateGuess(gameState.currentGuess, solution);
    const newGuesses = [...gameState.guesses, gameState.currentGuess];
    const newEvaluations = [...gameState.evaluations, evaluation];
    const newKeyboardStatus = updateKeyboardStatus(gameState.keyboardStatus, gameState.currentGuess, evaluation);
    const newGameStatus = checkGameStatus(newGuesses, solution);

    setIsRevealing(true);
    const nextState: GameState = {
      guesses: newGuesses,
      evaluations: newEvaluations,
      currentGuess: '',
      gameStatus: newGameStatus,
      keyboardStatus: newKeyboardStatus,
    };
    setGameState(nextState);

    setTimeout(() => {
      setIsRevealing(false);
      if (newGameStatus === 'won') {
        const msgs = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'];
        showMessage(msgs[newGuesses.length - 1] ?? 'Tebrikler!', 3000);
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

      // Günlük mod: oyun durumunu kaydet
      if (hasDaily && newGameStatus !== 'playing') {
        setDailyPersistedState({
          date: today,
          guesses: newGuesses,
          evaluations: newEvaluations,
          gameStatus: newGameStatus,
          keyboardStatus: newKeyboardStatus,
        });
      }
    }, wordLength * 300 + 200);
  }, [gameState, wordLength, isRevealing, solution, showMessage, setSlugStats, hasDaily, today, setDailyPersistedState]);

  const startNewGame = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['word', 'slug', slug] });
    void refetch();
  }, [queryClient, slug, refetch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'Enter') submitGuess();
      else if (e.key === 'Backspace') removeLetter();
      else if (/^[a-zA-ZğüşıöçĞÜŞİÖÇ]$/.test(e.key)) addLetter(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLetter, removeLetter, submitGuess]);

  const isLoading = listLoading || wordLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">
          {listData?.list.name ?? 'Yükleniyor...'}
        </div>
      </div>
    );
  }

  if (listError || wordError) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary text-xl font-semibold">Liste bulunamadı.</p>
        <p className="text-text-secondary text-sm">"{slug}" adında bir liste yok veya kelime eklenmemiş.</p>
        <button onClick={onGoHome} className="mt-2 px-6 py-2 rounded bg-tile-correct text-white font-medium cursor-pointer hover:opacity-90">
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onGoHome} className="text-text-secondary hover:text-text-primary cursor-pointer">
            <Home size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold tracking-widest text-text-primary text-sm">{listData?.list.name ?? slug.toUpperCase()}</p>
            {hasDaily && (
              <p className="text-xs text-text-secondary">#{gameNumber}</p>
            )}
          </div>
          {hasDaily ? (
            <div className="text-xs font-mono text-text-secondary w-[18px] text-center" title="Sonraki kelime">
              {countdown.hours}:{countdown.minutes}:{countdown.seconds}
            </div>
          ) : (
            <button onClick={startNewGame} className="text-text-secondary hover:text-text-primary cursor-pointer">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </header>

      <Toast message={message} />

      <main className="flex-1 flex flex-col items-center justify-center">
        <GameGrid
          guesses={gameState.guesses}
          evaluations={gameState.evaluations}
          currentGuess={gameState.currentGuess}
          isRevealing={isRevealing}
          shakeRow={shakeRow}
          gameStatus={gameState.gameStatus}
          wordLength={wordLength as 4 | 5 | 6}
        />
      </main>

      <Keyboard
        onKeyPress={key => {
          if (key === 'ENTER') submitGuess();
          else if (key === 'BACKSPACE') removeLetter();
          else addLetter(key);
        }}
        keyboardStatus={gameState.keyboardStatus}
      />

      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        gameStatus={gameState.gameStatus}
        solution={solution}
        solutionEntry={solutionEntry}
        guesses={gameState.guesses}
        evaluations={gameState.evaluations}
        gameNumber={gameNumber}
        stats={slugStats}
        isUnlimited={!hasDaily}
        onPlayAgain={() => { setShowGameOverModal(false); startNewGame(); }}
        onGoHome={onGoHome}
      />

      {/* Social section */}
      <div className="max-w-lg mx-auto w-full px-4 pb-6 space-y-5">
        <div className="flex items-center gap-3">
          <LikeButton slug={slug} onLoginRequired={onAuthRequired} />
        </div>
        <CommentSection slug={slug} onLoginRequired={onAuthRequired} />
      </div>
    </div>
  );
}
