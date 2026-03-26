import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import GameGrid from './GameGrid';
import Keyboard from './Keyboard';
import Toast from './Toast';
import HowToPlayModal from './HowToPlayModal';
import SettingsModal from './SettingsModal';
import AuthModal from './AuthModal';
import LeaderboardModal from './LeaderboardModal';
import ProfileModal from './ProfileModal';
import TournamentGameOverModal from './TournamentGameOverModal';
import TournamentLeaderboardModal from './TournamentLeaderboardModal';
import WinConfetti from './WinConfetti';
import { useTournamentGame } from '../hooks/useTournamentGame';
import type { WordLength } from '../types';

interface TournamentPageProps {
  onGoHome: () => void;
}

export default function TournamentPage({ onGoHome }: TournamentPageProps): React.JSX.Element {
  const game = useTournamentGame();

  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTournamentLB, setShowTournamentLB] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  const prevStatusRef = useRef(game.gameStatus);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = game.gameStatus;
    if ((game.gameStatus === 'won' || game.gameStatus === 'lost') && prev === 'playing') {
      const timer = setTimeout(() => setShowGameOver(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [game.gameStatus]);

  const handleKeyPress = (key: string): void => {
    if (key === 'ENTER') game.submitGuess();
    else if (key === 'BACKSPACE') game.removeLetter();
    else game.addLetter(key);
  };

  const handlePlayAgain = (): void => {
    setShowGameOver(false);
    game.startNewGame();
  };

  if (game.isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">
          HARFHANE
        </div>
      </div>
    );
  }

  if (game.isError) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary text-xl font-semibold">Yarışma modu yüklenemedi.</p>
        <p className="text-text-secondary text-sm">Giriş yapmış olduğunuzdan emin olun.</p>
        <button
          onClick={onGoHome}
          className="mt-2 px-6 py-2 rounded bg-tile-correct text-white font-medium cursor-pointer hover:opacity-90"
        >
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <WinConfetti active={game.gameStatus === 'won' && !showGameOver} />
      <Header
        onTitleClick={onGoHome}
        onHelpClick={() => setShowHelp(true)}
        onStatsClick={() => setShowTournamentLB(true)}
        onSettingsClick={() => setShowSettings(true)}
        onLeaderboardClick={() => setShowLeaderboard(true)}
        onAuthClick={() => setShowAuth(true)}
        onProfileClick={() => setShowProfile(true)}
        modeLabel="Yarışma"
      />
      <Toast message={game.message} />
      <main className="flex-1 flex flex-col items-center justify-center">
        <GameGrid
          guesses={game.guesses}
          evaluations={game.evaluations}
          currentGuess={game.currentGuess}
          isRevealing={game.isRevealing}
          shakeRow={game.shakeRow}
          gameStatus={game.gameStatus}
          wordLength={game.wordLength as WordLength}
        />
      </main>
      <Keyboard onKeyPress={handleKeyPress} keyboardStatus={game.keyboardStatus} />
      <HowToPlayModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <TournamentGameOverModal
        isOpen={showGameOver}
        onClose={() => setShowGameOver(false)}
        gameStatus={game.gameStatus}
        solution={game.solution}
        solutionMeaning={game.solutionMeaning}
        guesses={game.guesses}
        evaluations={game.evaluations}
        tournamentScore={game.tournamentScore}
        userTotalScore={game.userTotalScore}
        onPlayAgain={handlePlayAgain}
        onGoHome={onGoHome}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <TournamentLeaderboardModal isOpen={showTournamentLB} onClose={() => setShowTournamentLB(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
