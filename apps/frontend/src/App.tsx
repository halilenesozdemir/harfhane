import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./components/HomePage";
import Header from "./components/Header";
import GameGrid from "./components/GameGrid";
import Keyboard from "./components/Keyboard";
import Toast from "./components/Toast";
import HowToPlayModal from "./components/HowToPlayModal";
import StatsModal from "./components/StatsModal";
import GameOverModal from "./components/GameOverModal";
import SettingsModal from "./components/SettingsModal";
import InstallPrompt from "./components/InstallPrompt";
import AdminLogin from "./components/admin/AdminLogin";
import AdminPanel from "./components/admin/AdminPanel";
import { useGameState } from "./hooks/useGameState";
import type { GameMode, WordLength } from "./types";

const queryClient = new QueryClient();

interface GameProps {
  mode: GameMode;
  wordLength: WordLength;
  onGoHome: () => void;
}

function Game({ mode, wordLength, onGoHome }: GameProps): React.JSX.Element {
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
    shakeRow,
    message,
    hasSeenHelp,
    isUnlimited,
    addLetter,
    removeLetter,
    submitGuess,
    setHasSeenHelp,
    startNewGame,
  } = useGameState(mode, wordLength);

  // Modal states
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // İlk girişte yardım modalını göster
  useEffect(() => {
    if (!hasSeenHelp) {
      setShowHelpModal(true);
      setHasSeenHelp(true);
    }
  }, [hasSeenHelp, setHasSeenHelp]);

  // Oyun bittiğinde modal göster
  useEffect(() => {
    if (gameStatus === "won" || gameStatus === "lost") {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameStatus]);

  // Klavye tuşlarını handle et
  const handleKeyPress = (key: string): void => {
    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACKSPACE") {
      removeLetter();
    } else {
      addLetter(key);
    }
  };

  // Tekrar oyna (sınırsız mod)
  const handlePlayAgain = (): void => {
    setShowGameOverModal(false);
    startNewGame();
  };

  // Ana sayfaya dön
  const handleGoHome = (): void => {
    setShowGameOverModal(false);
    onGoHome();
  };

  // Mod etiketi
  const modeLabel = isUnlimited ? "Sınırsız" : "Günlük";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">
          NURDLE
        </div>
      </div>
    );
  }

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
          wordLength={wordLength}
        />
      </main>

      {/* Klavye */}
      <Keyboard onKeyPress={handleKeyPress} keyboardStatus={keyboardStatus} />

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
        solutionEntry={solutionEntry}
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

type ViewType = "home" | "daily" | "unlimited";

interface ActiveGame {
  mode: GameMode;
  wordLength: WordLength;
}

function AdminApp(): React.JSX.Element {
  const [secret, setSecret] = useState<string | null>(
    () => sessionStorage.getItem("nurdle-admin-secret")
  );
  const [authError, setAuthError] = useState('');

  const handleLogin = async (s: string): Promise<void> => {
    setAuthError('');
    try {
      const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
      const res = await fetch(`${BASE_URL}/admin/words?limit=1`, {
        headers: { 'X-Admin-Secret': s },
      });
      if (res.status === 401) {
        setAuthError('Geçersiz anahtar.');
        return;
      }
      sessionStorage.setItem("nurdle-admin-secret", s);
      setSecret(s);
    } catch {
      setAuthError('Bağlantı hatası.');
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem("nurdle-admin-secret");
    setSecret(null);
  };

  if (!secret) {
    return <AdminLogin onLogin={(s) => void handleLogin(s)} error={authError} />;
  }
  return <AdminPanel secret={secret} onLogout={handleLogout} />;
}

function App(): React.JSX.Element {
  const isAdmin = window.location.pathname.startsWith('/admin');

  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [activeGame, setActiveGame] = useState<ActiveGame>({ mode: "daily", wordLength: 5 });

  const handleSelectMode = (mode: GameMode, wordLength: WordLength): void => {
    setActiveGame({ mode, wordLength });
    setCurrentView(mode);
  };

  const handleGoHome = (): void => {
    setCurrentView("home");
  };

  if (isAdmin) {
    return <AdminApp />;
  }

  const renderView = (): React.JSX.Element => {
    if (currentView === "home") {
      return <HomePage onSelectMode={handleSelectMode} />;
    }
    return (
      <Game
        mode={activeGame.mode}
        wordLength={activeGame.wordLength}
        onGoHome={handleGoHome}
      />
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {renderView()}
        <InstallPrompt />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
