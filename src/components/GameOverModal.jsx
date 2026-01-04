import { useState, useEffect } from 'react';
import { Share2, Check, RotateCcw, Home } from 'lucide-react';
import Modal from './Modal';
import { getTimeUntilMidnight, generateShareText } from '../utils/gameLogic';

const StatBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-xs text-gray-400">{label}</span>
  </div>
);

const GameOverModal = ({ 
  isOpen, 
  onClose, 
  gameStatus, 
  solution, 
  guesses, 
  evaluations,
  gameNumber,
  stats,
  isUnlimited,
  onPlayAgain,
  onGoHome,
}) => {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [copied, setCopied] = useState(false);

  // Geri sayım (sadece günlük mod)
  useEffect(() => {
    if (!isOpen || isUnlimited) return;
    
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isUnlimited]);

  // Paylaş
  const handleShare = async () => {
    const modeText = isUnlimited ? 'Sınırsız' : `#${gameNumber}`;
    const shareText = generateShareText(
      guesses,
      evaluations,
      modeText,
      gameStatus === 'won'
    );

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const winPercentage = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={gameStatus === 'won' ? 'Tebrikler! 🎉' : 'Oyun Bitti'}
    >
      <div className="text-white space-y-6">
        {/* Sonuç Mesajı */}
        <div className="text-center">
          {gameStatus === 'won' ? (
            <p className="text-lg">
              Kelimeyi <span className="text-correct font-bold">{guesses.length}</span> denemede buldunuz!
            </p>
          ) : (
            <div>
              <p className="text-lg mb-2">Kelime:</p>
              <p className="text-2xl font-bold text-present">{solution}</p>
            </div>
          )}
        </div>

        {/* Mini İstatistikler */}
        <div className="grid grid-cols-4 gap-2 py-4 border-y border-tile-empty">
          <StatBox value={stats.gamesPlayed} label="Oyun" />
          <StatBox value={winPercentage} label="Kazanma %" />
          {!isUnlimited && (
            <>
              <StatBox value={stats.currentStreak} label="Seri" />
              <StatBox value={stats.maxStreak} label="En İyi" />
            </>
          )}
          {isUnlimited && (
            <>
              <StatBox value={stats.gamesWon} label="Kazanılan" />
              <StatBox value={stats.gamesPlayed - stats.gamesWon} label="Kaybedilen" />
            </>
          )}
        </div>

        {/* Sonraki Kelime Geri Sayım (sadece günlük mod) */}
        {!isUnlimited && (
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Sonraki Nurdle</p>
            <p className="text-3xl font-mono font-bold">
              {countdown.hours}:{countdown.minutes}:{countdown.seconds}
            </p>
          </div>
        )}

        {/* Butonlar */}
        <div className="space-y-3">
          {/* Paylaş Butonu */}
          <button
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-correct hover:bg-correct/90 text-white flex items-center justify-center gap-2 transition-all duration-200"
          >
            {copied ? (
              <>
                <Check size={20} />
                Kopyalandı!
              </>
            ) : (
              <>
                <Share2 size={20} />
                Paylaş
              </>
            )}
          </button>

          {/* Sınırsız mod butonları */}
          {isUnlimited && (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-md font-bold text-lg bg-present hover:bg-present/90 text-white flex items-center justify-center gap-2 transition-all duration-200"
            >
              <RotateCcw size={20} />
              Tekrar Oyna
            </button>
          )}

          {/* Ana Sayfa Butonu */}
          <button
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-tile-empty hover:bg-tile-filled text-white flex items-center justify-center gap-2 transition-all duration-200"
          >
            <Home size={20} />
            Ana Sayfa
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GameOverModal;
