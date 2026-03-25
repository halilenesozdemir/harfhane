import { Home, RotateCcw } from 'lucide-react';
import { useSlugGameState } from '../hooks/useSlugGameState';
import { useAuth } from '../context/AuthContext';
import GameGrid from './GameGrid';
import Keyboard from './Keyboard';
import Toast from './Toast';
import GameOverModal from './GameOverModal';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';

interface SlugGameProps {
  slug: string;
  onGoHome: () => void;
  onAuthRequired?: () => void;
}

export default function SlugGame({ slug, onGoHome, onAuthRequired }: SlugGameProps): React.JSX.Element {
  const { token } = useAuth();
  const {
    listName, wordLength, hasDaily, solution, solutionEntry, gameNumber,
    slugStats, gameState, isRevealing, shakeRow, message, showGameOverModal,
    setShowGameOverModal, countdown, isLoading, isError,
    addLetter, removeLetter, submitGuess, startNewGame,
  } = useSlugGameState(slug);

  const handleKeyPress = (key: string): void => {
    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') removeLetter();
    else addLetter(key);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-tile-filled text-lg font-bold tracking-widest animate-pulse">{listName}</div>
      </div>
    );
  }

  if (isError) {
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
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onGoHome} className="text-text-secondary hover:text-text-primary cursor-pointer">
            <Home size={18} />
          </button>
          <div className="text-center">
            <p className="font-bold tracking-widest text-text-primary text-sm">{listName}</p>
            {hasDaily && <p className="text-xs text-text-secondary">#{gameNumber}</p>}
          </div>
          {hasDaily ? (
            <span className="text-xs font-mono text-text-secondary" title="Sonraki kelime">
              {countdown.hours}:{countdown.minutes}:{countdown.seconds}
            </span>
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
          wordLength={wordLength}
        />
      </main>

      <Keyboard onKeyPress={handleKeyPress} keyboardStatus={gameState.keyboardStatus} />

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
        isAuthenticated={!!token}
        onPlayAgain={() => { setShowGameOverModal(false); startNewGame(); }}
        onGoHome={onGoHome}
        onAuthClick={onAuthRequired ?? (() => undefined)}
      />

      <div className="max-w-lg mx-auto w-full px-4 pb-6 space-y-5">
        <div className="flex items-center gap-3">
          <LikeButton slug={slug} onLoginRequired={onAuthRequired} />
        </div>
        <CommentSection slug={slug} onLoginRequired={onAuthRequired} />
      </div>
    </div>
  );
}
