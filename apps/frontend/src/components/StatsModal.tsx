import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { StatsModalProps } from '../types';

interface StatBoxProps {
  value: number;
  label: string;
}

function StatBox({ value, label }: StatBoxProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

interface DistributionBarProps {
  count: number;
  targetWidth: number;
  guessNumber: number;
  isHighlighted: boolean;
  animate: boolean;
}

function DistributionBar({ count, targetWidth, guessNumber, isHighlighted, animate }: DistributionBarProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-text-secondary text-sm w-4 text-right shrink-0">{guessNumber}</span>
      <div className="flex-1 relative h-6">
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-end px-2 rounded-sm text-white text-xs font-bold transition-all duration-500 ease-out ${isHighlighted ? 'bg-correct' : 'bg-absent'}`}
          style={{ width: animate ? `${targetWidth}%` : '0%', minWidth: animate ? '28px' : '0px' }}
        >
          {animate && count}
        </div>
      </div>
    </div>
  );
}

function StatsModal({ isOpen, onClose, stats, lastGuessCount, gameStatus, isUnlimited }: StatsModalProps): React.JSX.Element {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!isOpen) { setAnimate(false); return; }
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const winPercentage = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isUnlimited ? 'Sınırsız Mod İstatistikleri' : 'İstatistikler'}>
      <div>
        <div className={`grid ${isUnlimited ? 'grid-cols-3' : 'grid-cols-4'} gap-2 mb-6`}>
          <StatBox value={stats.gamesPlayed} label="Oyun" />
          <StatBox value={winPercentage} label="Kazanma %" />
          {!isUnlimited && 'currentStreak' in stats && (
            <>
              <StatBox value={stats.currentStreak} label="Seri" />
              <StatBox value={stats.maxStreak} label="En İyi Seri" />
            </>
          )}
          {isUnlimited && <StatBox value={stats.gamesWon} label="Kazanılan" />}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-text-secondary uppercase tracking-wider">Tahmin Dağılımı</h3>
          <div>
            {stats.guessDistribution.map((count, index) => (
              <DistributionBar
                key={index}
                count={count}
                targetWidth={maxDistribution > 0 ? Math.max((count / maxDistribution) * 100, count > 0 ? 8 : 0) : 0}
                guessNumber={index + 1}
                isHighlighted={gameStatus === 'won' && lastGuessCount === index + 1}
                animate={animate}
              />
            ))}
          </div>
        </div>

        {stats.gamesPlayed === 0 && (
          <p className="text-center text-text-secondary text-sm">
            İlk oyununuzu tamamladığınızda istatistikler burada görünecek.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default StatsModal;
