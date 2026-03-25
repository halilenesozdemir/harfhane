import { useState, useEffect, useCallback, useRef } from 'react';
import { Home } from 'lucide-react';
import { useChallengeWord } from '../hooks/useWordApi';
import { validateWord } from '../lib/api';
import GameGrid from './GameGrid';
import Keyboard from './Keyboard';
import Toast from './Toast';
import GameOverModal from './GameOverModal';
import WinConfetti from './WinConfetti';
import {
  evaluateGuess,
  updateKeyboardStatus,
  checkGameStatus,
  normalizeWord,
} from '../utils/gameLogic';
import type { GameState, TileStatus, UnlimitedStats, WordLength } from '../types';

const WIN_MESSAGES = ['Muhteşem!', 'Harika!', 'Güzel!', 'İyi!', 'Fena değil!', 'Kıl payı!'] as const;
const EMPTY_STATS: UnlimitedStats = { gamesPlayed: 0, gamesWon: 0, guessDistribution: [0, 0, 0, 0, 0, 0] };
const EMPTY_STATE: GameState = {
  guesses: [], evaluations: [], currentGuess: '',
  gameStatus: 'playing', keyboardStatus: {},
};

interface ChallengeGameProps {
  wordId: number;
  onGoHome: () => void;
}

export default function ChallengeGame({ wordId, onGoHome }: ChallengeGameProps): React.JSX.Element {
  const { data, isLoading, isError } = useChallengeWord(wordId);
  const [gameState, setGameState] = useState<GameState>(EMPTY_STATE);
  const [isRevealing, setIsRevealing] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const isSubmittingRef = useRef(false);

  const solution = data?.word.word ?? '';
  const wordLength = (solution.length || 5) as WordLength;

  const showMessage = useCallback((msg: string, duration = 2000): void => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      const timer = setTimeout(() => setShowGameOverModal(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameState.gameStatus]);

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

  const submitGuess = useCallback(async (): Promise<void> => {
    if (isRevealing || isSubmittingRef.current || !solution) return;
    const { currentGuess, guesses, evaluations, keyboardStatus } = gameState;

    if (currentGuess.length !== wordLength) {
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 600);
      showMessage('Kelime çok kısa!');
      return;
    }

    isSubmittingRef.current = true;
    const { isValid } = await validateWord(currentGuess);
    if (!isValid) {
      isSubmittingRef.current = false;
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 600);
      showMessage('Kelime listede yok!');
      return;
    }

    const evaluation = evaluateGuess(currentGuess, solution);
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    const newKeyboardStatus = updateKeyboardStatus(keyboardStatus, currentGuess, evaluation);
    const newStatus = checkGameStatus(newGuesses, solution);

    setIsRevealing(true);
    setTimeout(() => {
      setIsRevealing(false);
      isSubmittingRef.current = false;
    }, wordLength * 300 + 300);

    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      evaluations: newEvaluations,
      keyboardStatus: newKeyboardStatus,
      currentGuess: '',
      gameStatus: newStatus,
    }));

    if (newStatus === 'won') {
      showMessage(WIN_MESSAGES[Math.min(newGuesses.length - 1, WIN_MESSAGES.length - 1)] ?? 'Harika!', 1500);
    } else if (newStatus === 'lost') {
      showMessage(`Kelime: ${solution}`, 5000);
    }
  }, [gameState, solution, wordLength, isRevealing, showMessage]);

  const handleKeyPress = (key: string): void => {
    if (key === 'ENTER') { void submitGuess(); }
    else if (key === 'BACKSPACE') { removeLetter(); }
    else { addLetter(key); }
  };

  const handlePlayAgain = (): void => {
    setShowGameOverModal(false);
    setGameState(EMPTY_STATE);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">HARFHANE</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary text-xl font-semibold">Meydan okuma bulunamadı.</p>
        <button onClick={onGoHome} className="mt-2 px-6 py-2 rounded bg-tile-correct text-white font-medium cursor-pointer hover:opacity-90">
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <WinConfetti active={gameState.gameStatus === 'won' && !showGameOverModal} />
      <header className="border-b border-border-color bg-bg-primary">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onGoHome} className="text-text-secondary hover:text-text-primary cursor-pointer">
            <Home size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold tracking-widest text-text-primary">HARFHANE</p>
            <p className="text-xs text-text-secondary">Meydan Okuma</p>
          </div>
          <div className="w-[18px]" />
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
          wordLength={wordLength}
        />
      </main>

      <Keyboard onKeyPress={handleKeyPress} keyboardStatus={gameState.keyboardStatus} />

      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        gameStatus={gameState.gameStatus}
        solution={solution}
        solutionEntry={data.word}
        guesses={gameState.guesses}
        evaluations={gameState.evaluations as TileStatus[][]}
        gameNumber="Meydan Okuma"
        stats={EMPTY_STATS}
        isUnlimited={true}
        isAuthenticated={false}
        onPlayAgain={handlePlayAgain}
        onGoHome={onGoHome}
        onAuthClick={onGoHome}
        challengeUrl={`https://harfhane.app/c/${wordId}`}
      />
    </div>
  );
}
