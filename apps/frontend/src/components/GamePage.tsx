import { useEffect } from 'react';
import DesktopShell from './DesktopShell';
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
import GameLoadingScreen from './GameLoadingScreen';
import GameErrorScreen from './GameErrorScreen';
import GameHint from './GameHint';
import { useGameState } from '../hooks/useGameState';
import { useGameModals } from '../hooks/useGameModals';
import { useAuth } from '../context/AuthContext';
import { useSessionChallenge } from '../hooks/useSessionChallenge';
import { useHint } from '../hooks/useHint';
import WinConfetti from './WinConfetti';
import type { GameMode, WordLength } from '../types';

interface GamePageProps {
  mode: GameMode;
  wordLength: WordLength;
  onGoHome: () => void;
}

export default function GamePage({ mode, wordLength, onGoHome }: GamePageProps): React.JSX.Element {
  const {
    guesses, evaluations, currentGuess, gameStatus, keyboardStatus,
    solution, solutionEntry, gameNumber, stats, isRevealing,
    isLoading, isError, shakeRow, message, hasSeenHelp,
    isUnlimited, lastXPResult,
    addLetter, removeLetter, submitGuess, setHasSeenHelp, startNewGame,
  } = useGameState(mode, wordLength);

  const { token } = useAuth();
  const sessionChallenge = useSessionChallenge();
  const { hintText, hintUsed, revealHint } = useHint(solutionEntry, wordLength, isUnlimited);

  const modals = useGameModals({
    gameStatus,
    isUnlimited,
    onGameEnd: (won) => sessionChallenge.record(won),
  });

  useEffect(() => {
    if (!hasSeenHelp) {
      modals.openHelp();
      setHasSeenHelp(true);
    }
  }, [hasSeenHelp, setHasSeenHelp]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://harfhane.app';
  const challengeUrl = `${origin}/daily/${wordLength}`;

  const handleKeyPress = (key: string): void => {
    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') removeLetter();
    else addLetter(key);
  };

  const handlePlayAgain = (): void => {
    modals.closeGameOver();
    startNewGame();
  };

  const handleGoHome = (): void => {
    modals.closeGameOver();
    onGoHome();
  };

  if (isLoading) return <GameLoadingScreen />;
  if (isError) return <GameErrorScreen wordLength={wordLength} onGoHome={onGoHome} />;

  const modeLabel = isUnlimited ? 'Sınırsız' : 'Günlük';

  return (
    <DesktopShell mode={mode} wordLength={wordLength} stats={stats} onGoHome={handleGoHome}>
      <div className="min-h-screen bg-bg-primary flex flex-col lg:min-h-0">
        <WinConfetti active={gameStatus === 'won' && !modals.showGameOver} />
        <Header
          onTitleClick={handleGoHome}
          onHelpClick={modals.openHelp}
          onStatsClick={modals.openStats}
          onSettingsClick={modals.openSettings}
          onLeaderboardClick={modals.openLeaderboard}
          onAuthClick={modals.openAuth}
          onProfileClick={modals.openProfile}
          modeLabel={modeLabel}
        />
        <Toast message={message} />
        <main className="flex-1 flex flex-col items-center justify-center gap-3">
          <GameGrid
            guesses={guesses}
            evaluations={evaluations}
            currentGuess={currentGuess}
            isRevealing={isRevealing}
            shakeRow={shakeRow}
            gameStatus={gameStatus}
            wordLength={wordLength}
          />
          <GameHint
            hintText={hintText}
            hintUsed={hintUsed}
            gameStatus={gameStatus}
            isUnlimited={isUnlimited}
            onRevealHint={revealHint}
          />
        </main>
        <Keyboard onKeyPress={handleKeyPress} keyboardStatus={keyboardStatus} />
        <HowToPlayModal isOpen={modals.showHelp} onClose={modals.closeHelp} />
        <StatsModal
          isOpen={modals.showStats}
          onClose={modals.closeStats}
          stats={stats}
          lastGuessCount={guesses.length}
          gameStatus={gameStatus}
          isUnlimited={isUnlimited}
        />
        <GameOverModal
          isOpen={modals.showGameOver}
          onClose={modals.closeGameOver}
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
          onAuthClick={modals.openAuth}
          xpResult={lastXPResult}
          sessionChallenge={isUnlimited ? sessionChallenge : undefined}
          challengeUrl={challengeUrl}
        />
        <SettingsModal isOpen={modals.showSettings} onClose={modals.closeSettings} />
        <AuthModal isOpen={modals.showAuth} onClose={modals.closeAuth} />
        <LeaderboardModal isOpen={modals.showLeaderboard} onClose={modals.closeLeaderboard} />
        <ProfileModal isOpen={modals.showProfile} onClose={modals.closeProfile} />
      </div>
    </DesktopShell>
  );
}
