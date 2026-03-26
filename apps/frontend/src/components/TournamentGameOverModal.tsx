import { Share2, Check, RotateCcw, Home, X, Trophy } from 'lucide-react';
import Modal from './Modal';
import { generateShareText } from '../utils/gameLogic';
import { useShare } from '../hooks/useShare';
import type { TileStatus } from '../types';

interface TournamentGameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: 'playing' | 'won' | 'lost';
  solution: string;
  solutionMeaning: string;
  guesses: string[];
  evaluations: TileStatus[][];
  tournamentScore: number | null;
  userTotalScore: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function TournamentGameOverModal({
  isOpen,
  onClose,
  gameStatus,
  solution,
  solutionMeaning,
  guesses,
  evaluations,
  tournamentScore,
  userTotalScore,
  onPlayAgain,
  onGoHome,
}: TournamentGameOverModalProps): React.JSX.Element {
  const shareText = generateShareText(guesses, evaluations, 'Yarışma', gameStatus === 'won');
  const { share, copied, failed } = useShare(shareText);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gameStatus === 'won' ? 'Tebrikler!' : 'Oyun Bitti'}
    >
      <div className="space-y-5">
        <div className="text-center">
          {gameStatus === 'won' ? (
            <p className="text-lg text-text-primary">
              Kelimeyi <span className="text-correct font-bold">{guesses.length}</span> denemede buldunuz!
            </p>
          ) : (
            <div>
              <p className="text-lg mb-2 text-text-primary">Kelime:</p>
              <p className="text-2xl font-bold text-present">{solution}</p>
            </div>
          )}
        </div>

        {solutionMeaning && (
          <div className="bg-bg-primary p-3 rounded-lg border border-border-color">
            <span className="text-sm text-text-secondary">Anlam:</span>
            <p className="text-text-primary font-medium">{solutionMeaning}</p>
          </div>
        )}

        {tournamentScore !== null && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                <span className="font-bold text-text-primary">
                  {tournamentScore > 0 ? `+${tournamentScore} puan` : '0 puan'}
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                Toplam: {userTotalScore} puan
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={share}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-correct hover:bg-correct/90 text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            {failed ? (
              <><X size={20} /> Hata!</>
            ) : copied ? (
              <><Check size={20} /> Kopyalandı!</>
            ) : (
              <><Share2 size={20} /> Paylaş</>
            )}
          </button>

          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-present hover:bg-present/90 text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            <RotateCcw size={20} />
            Tekrar Oyna
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-tile-empty hover:bg-tile-filled text-text-primary flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            <Home size={20} />
            Ana Sayfa
          </button>
        </div>
      </div>
    </Modal>
  );
}
