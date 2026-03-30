import type { GameStatus } from '../types';

interface GameHintProps {
  hintText: string | null;
  hintUsed: boolean;
  gameStatus: GameStatus;
  isUnlimited: boolean;
  onRevealHint: () => void;
}

export default function GameHint({ hintText, hintUsed, gameStatus, isUnlimited, onRevealHint }: GameHintProps): React.JSX.Element | null {
  if (isUnlimited || gameStatus !== 'playing') return null;

  if (hintText) {
    return (
      <div className="text-xs text-text-secondary bg-bg-secondary border border-border-color rounded-full px-4 py-1.5">
        {hintText}
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
