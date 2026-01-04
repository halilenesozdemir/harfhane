import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './components/HomePage';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import Keyboard from './components/Keyboard';
import Toast from './components/Toast';
import HowToPlayModal from './components/HowToPlayModal';
import StatsModal from './components/StatsModal';
import GameOverModal from './components/GameOverModal';
import SettingsModal from './components/SettingsModal';
import { useGameState } from './hooks/useGameState';

const queryClient = new QueryClient();

function Game({ mode, onGoHome }) {
  const {
    guesses,
    evaluations,
    currentGuess,
    gameStatus,
    keyboardStatus,
    solution,
    gameNumber,
    stats,
    isRevealing,
    shakeRow,
    message,
    hasSeenHelp,
    isUnlimited,
    addLetter,
    removeLetter,
    submitGuess,
    setHasSeenHelp,
    startNewGame,
  } = useGameState(mode);

  // Modal states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // İlk girişte yardım modalını göster
  useEffect(() => {
    if (!hasSeenHelp) {
      setShowHelpModal(true);
      setHasSeenHelp(true);
    }
  }, [hasSeenHelp, setHasSeenHelp]);

  // Oyun bittiğinde modal göster
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  // Klavye tuşlarını handle et
  const handleKeyPress = (key) => {
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      removeLetter();
    } else {
      addLetter(key);
    }
  };

  // Tekrar oyna (sınırsız mod)
  const handlePlayAgain = () => {
    setShowGameOverModal(false);
    startNewGame();
  };

  // Ana sayfaya dön
  const handleGoHome = () => {
    setShowGameOverModal(false);
    onGoHome();
  };

  // Mod etiketi
  const modeLabel = isUnlimited ? 'Sınırsız' : 'Günlük';

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <Header
        onTitleClick={onGoHome}
        onHelpClick={() => setShowHelpModal(true)}
        onStatsClick={() => setShowStatsModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        modeLabel={modeLabel}
      />

      {/* Toast Mesajları */}
      <Toast message={message} />

      {/* Oyun Alanı */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <GameGrid
          guesses={guesses}
          evaluations={evaluations}
          currentGuess={currentGuess}
          isRevealing={isRevealing}
          shakeRow={shakeRow}
          gameStatus={gameStatus}
        />
      </main>

      {/* Klavye */}
      <Keyboard
        onKeyPress={handleKeyPress}
        keyboardStatus={keyboardStatus}
      />

      {/* Modaller */}
      <HowToPlayModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

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
        guesses={guesses}
        evaluations={evaluations}
        gameNumber={gameNumber}
        stats={stats}
        isUnlimited={isUnlimited}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'daily', 'unlimited'

  const handleSelectMode = (mode) => {
    setCurrentView(mode);
  };

  const handleGoHome = () => {
    setCurrentView('home');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {currentView === 'home' && (
          <HomePage onSelectMode={handleSelectMode} />
        )}
        {currentView === 'daily' && (
          <Game mode="daily" onGoHome={handleGoHome} />
        )}
        {currentView === 'unlimited' && (
          <Game mode="unlimited" onGoHome={handleGoHome} />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
