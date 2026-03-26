import { useEffect } from 'react';
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
    isUnlimited, lastXPResult, wordId,
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

  const challengeUrl = isUnlimited && wordId
    ? `https://harfhane.app/c/${wordId}`
    : `https://harfhane.app/daily/${wordLength}`;

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
        {!isUnlimited && gameStatus === 'playing' && (
          hintText ? (
            <div className="text-xs text-text-secondary bg-bg-secondary border border-border-color rounded-full px-4 py-1.5">
              {hintText}
            </div>
          ) : (
            <button
              onClick={revealHint}
              disabled={hintUsed}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hintUsed ? 'İpucu kullanıldı' : 'İpucu göster'}
            </button>
          )
        )}
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
  );
}
