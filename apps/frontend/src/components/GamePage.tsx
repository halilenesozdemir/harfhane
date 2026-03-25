import { useState, useEffect } from 'react';
import Header from './Header';
import GameGrid from './GameGrid';
import Keyboard from './Keyboard';
import Toast from './Toast';
import HowToPlayModal from './HowToPlayModal';
import StatsModal from './StatsModal';
import GameOverModal from './GameOverModal';
import SettingsModal from './SettingsModal';
import AuthModal from './AuthModal';
import LeaderboardModal from './LeaderboardModal';
import ProfileModal from './ProfileModal';
import { useGameState } from '../hooks/useGameState';
import { useAuth } from '../context/AuthContext';
import { useSessionChallenge } from '../hooks/useSessionChallenge';
import WinConfetti from './WinConfetti';
import type { GameMode, WordLength } from '../types';

interface GamePageProps {
  mode: GameMode;
  wordLength: WordLength;
  onGoHome: () => void;
}

export default function GamePage({ mode, wordLength, onGoHome }: GamePageProps): React.JSX.Element {
  const {
    guesses,
    evaluations,
    currentGuess,
    gameStatus,
    keyboardStatus,
    solution,
    solutionEntry,
    gameNumber,
    stats,
    isRevealing,
    isLoading,
    isError,
    shakeRow,
    message,
    hasSeenHelp,
    isUnlimited,
    lastXPResult,
    addLetter,
    removeLetter,
    submitGuess,
    setHasSeenHelp,
    startNewGame,
  } = useGameState(mode, wordLength);

  const { token } = useAuth();
  const sessionChallenge = useSessionChallenge();

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  useEffect(() => {
    if (!hasSeenHelp) {
      setShowHelpModal(true);
      setHasSeenHelp(true);
    }
  }, [hasSeenHelp, setHasSeenHelp]);

  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      if (isUnlimited) sessionChallenge.record(gameStatus === 'won');
      const timer = setTimeout(() => setShowGameOverModal(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameStatus, isUnlimited, sessionChallenge]);

  const handleKeyPress = (key: string): void => {
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else {
      addLetter(key);
    }
  };

  const handlePlayAgain = (): void => {
    setShowGameOverModal(false);
    startNewGame();
  };

  const handleGoHome = (): void => {
    setShowGameOverModal(false);
    onGoHome();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">
          HARFHANE
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary text-xl font-semibold">
          Bu kelime uzunluğu için henüz kelime eklenmedi.
        </p>
        <p className="text-text-secondary text-sm">
          {wordLength} harflik kelimeler yakında geliyor.
        </p>
        <button
          onClick={onGoHome}
          className="mt-2 px-6 py-2 rounded bg-tile-correct text-white font-medium cursor-pointer hover:opacity-90"
        >
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  const modeLabel = isUnlimited ? 'Sınırsız' : 'Günlük';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <WinConfetti active={gameStatus === 'won' && !showGameOverModal} />
      <Header
        onTitleClick={handleGoHome}
        onHelpClick={() => setShowHelpModal(true)}
        onStatsClick={() => setShowStatsModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        onLeaderboardClick={() => setShowLeaderboardModal(true)}
        onAuthClick={() => setShowAuthModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        modeLabel={modeLabel}
      />
      <Toast message={message} />
      <main className="flex-1 flex flex-col items-center justify-center">
        <GameGrid
          guesses={guesses}
          evaluations={evaluations}
          currentGuess={currentGuess}
          isRevealing={isRevealing}
          shakeRow={shakeRow}
          gameStatus={gameStatus}
          wordLength={wordLength}
        />
      </main>
      <Keyboard onKeyPress={handleKeyPress} keyboardStatus={keyboardStatus} />
      <HowToPlayModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={stats}
        lastGuessCount={guesses.length}
        gameStatus={gameStatus}
        isUnlimited={isUnlimited}
      />
      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        gameStatus={gameStatus}
        solution={solution}
        solutionEntry={solutionEntry}
        guesses={guesses}
        evaluations={evaluations}
        gameNumber={gameNumber}
        stats={stats}
        isUnlimited={isUnlimited}
        isAuthenticated={!!token}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        onAuthClick={() => setShowAuthModal(true)}
        xpResult={lastXPResult}
        sessionChallenge={isUnlimited ? sessionChallenge : undefined}
      />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <LeaderboardModal isOpen={showLeaderboardModal} onClose={() => setShowLeaderboardModal(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
