import Modal from './Modal';
import type { StatsModalProps } from '../types';

interface StatBoxProps {
  value: number;
  label: string;
}

const StatBox = ({ value, label }: StatBoxProps): React.JSX.Element => (
  <div className="flex flex-col items-center">
    <span className="text-3xl font-bold text-text-primary">{value}</span>
    <span className="text-xs text-text-secondary">{label}</span>
  </div>
);

interface DistributionBarProps {
  count: number;
  maxCount: number;
  guessNumber: number;
  isHighlighted: boolean;
}

const DistributionBar = ({ count, maxCount, guessNumber, isHighlighted }: DistributionBarProps): React.JSX.Element => {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const minWidth = count > 0 ? Math.max(percentage, 7) : 7;

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-text-primary w-4 text-right">{guessNumber}</span>
      <div
        className={`h-5 px-2 flex items-center justify-end text-white text-sm font-semibold transition-all duration-300 ${isHighlighted ? 'bg-correct' : 'bg-absent'}`}
        style={{ width: `${minWidth}%`, minWidth: '24px' }}
      >
        {count}
      </div>
    </div>
  );
};

const StatsModal = ({ isOpen, onClose, stats, lastGuessCount, gameStatus, isUnlimited }: StatsModalProps): React.JSX.Element => {
  const winPercentage = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUnlimited ? 'Sınırsız Mod İstatistikleri' : 'İstatistikler'}>
      <div>
        {/* Ana İstatistikler */}
        <div className={`grid ${isUnlimited ? 'grid-cols-3' : 'grid-cols-4'} gap-2 mb-6`}>
          <StatBox value={stats.gamesPlayed} label="Oyun" />
          <StatBox value={winPercentage} label="Kazanma %" />
          {!isUnlimited && 'currentStreak' in stats && (
            <>
              <StatBox value={stats.currentStreak} label="Seri" />
              <StatBox value={stats.maxStreak} label="En İyi Seri" />
            </>
          )}
          {isUnlimited && (
            <StatBox value={stats.gamesWon} label="Kazanılan" />
          )}
        </div>

        {/* Tahmin Dağılımı */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-text-primary">Tahmin Dağılımı</h3>
          <div className="px-2">
            {stats.guessDistribution.map((count, index) => (
              <DistributionBar
                key={index}
                count={count}
                maxCount={maxDistribution}
                guessNumber={index + 1}
                isHighlighted={gameStatus === 'won' && lastGuessCount === index + 1}
              />
            ))}
          </div>
        </div>

        {/* İlk oyun mesajı */}
        {stats.gamesPlayed === 0 && (
          <p className="text-center text-text-secondary text-sm">
            İlk oyununuzu tamamladığınızda istatistikler burada görünecek.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default StatsModal;
