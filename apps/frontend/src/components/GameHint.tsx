import type { LetterHint } from '@harfhane/shared';
import type { GameStatus } from '../types';

interface GameHintProps {
  hint: LetterHint | null;
  hintUsed: boolean;
  hintAvailable: boolean;
  gameStatus: GameStatus;
  onRevealHint: () => void;
}

export default function GameHint({ hint, hintUsed, hintAvailable, gameStatus, onRevealHint }: GameHintProps): React.JSX.Element | null {
  if (!hintAvailable || gameStatus !== 'playing') return null;

  if (hint) {
    return (
      <div className="text-xs text-text-secondary bg-bg-secondary border border-border-color rounded-full px-4 py-1.5">
        {hint.position + 1}. harf: {hint.letter}
      </div>
    );
  }

  return (
    <button
      onClick={onRevealHint}
      disabled={hintUsed}
      className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {hintUsed ? 'İpucu kullanıldı' : 'İpucu göster'}
    </button>
  );
}
