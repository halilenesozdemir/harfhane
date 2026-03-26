import { Loader } from 'lucide-react';
import type { DuelPublic } from '../types';

interface DuelResultBannerProps {
  duel: DuelPublic;
}

function GuessLabel({ count, won }: { count: number; won: boolean }): React.JSX.Element {
  const color = won ? 'text-tile-correct' : 'text-tile-absent';
  const label = won ? `${count} tahminde çözdü` : 'çözemedi';
  return <span className={`text-lg font-bold ${color}`}>{label}</span>;
}

function ResultSummary({ duel }: { duel: DuelPublic }): React.JSX.Element {
  const opponentWon = duel.opponentWon ?? false;

  if (duel.myWon && !opponentWon) {
    return <p className="text-tile-correct font-semibold text-center">Sen kazandın!</p>;
  }
  if (!duel.myWon && opponentWon) {
    return <p className="text-tile-absent font-semibold text-center">Rakip kazandı!</p>;
  }
  if (duel.myWon && opponentWon) {
    if (duel.myGuesses < (duel.opponentGuesses ?? Infinity)) {
      return <p className="text-tile-correct font-semibold text-center">Sen daha az tahminde çözdün!</p>;
    }
    if (duel.myGuesses > (duel.opponentGuesses ?? 0)) {
      return <p className="text-tile-absent font-semibold text-center">Rakip daha az tahminde çözdü!</p>;
    }
    return <p className="text-text-secondary font-semibold text-center">Berabere!</p>;
  }
  return <p className="text-text-secondary font-semibold text-center">İkiniz de çözemediniz.</p>;
}

export default function DuelResultBanner({ duel }: DuelResultBannerProps): React.JSX.Element {
  if (!duel.opponentFinished) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-border-color bg-bg-secondary px-6 py-4 mt-4">
        <Loader size={18} className="animate-spin text-text-secondary" />
        <span className="text-text-secondary text-sm">Rakip henüz oynuyor...</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-color bg-bg-secondary px-6 py-4 mt-4 w-full max-w-sm">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary uppercase tracking-wide">Sen</span>
          <GuessLabel count={duel.myGuesses} won={duel.myWon} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-secondary uppercase tracking-wide">Rakip</span>
          <GuessLabel count={duel.opponentGuesses ?? 0} won={duel.opponentWon ?? false} />
        </div>
      </div>
      <ResultSummary duel={duel} />
    </div>
  );
}
