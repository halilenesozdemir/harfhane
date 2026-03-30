import type { WordLength } from '../types';

interface GameErrorScreenProps {
  wordLength: WordLength;
  onGoHome: () => void;
}

export default function GameErrorScreen({ wordLength, onGoHome }: GameErrorScreenProps): React.JSX.Element {
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
