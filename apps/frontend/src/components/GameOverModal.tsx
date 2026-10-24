import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Share2, Check, RotateCcw, Clock, X } from "lucide-react";
import Modal from "./Modal";
import SharePreview from "./SharePreview";
import { getTimeUntilMidnight, getTodayString, generateShareText, type ShareMode } from "@harfhane/shared";
import { useShare } from "../hooks/useShare";
import type { GameOverModalProps, TimeCountdown } from "../types";

interface StatBoxProps {
  value: string | number;
  label: string;
}

function StatBox({ value, label }: StatBoxProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-2xl font-extrabold text-text-primary">{value}</span>
      <span className="text-xs font-bold text-text-secondary">{label}</span>
    </div>
  );
}

interface AnswerTileProps {
  letter: string;
}

function AnswerTile({ letter }: AnswerTileProps): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="w-11 h-11 rounded-tile bg-correct text-correct-fg shadow-depth-correct font-display text-2xl font-extrabold flex items-center justify-center"
    >
      {letter}
    </span>
  );
}

interface DistributionRowProps {
  count: number;
  maxCount: number;
  guessNumber: number;
  isHighlighted: boolean;
}

function DistributionRow({ count, maxCount, guessNumber, isHighlighted }: DistributionRowProps): React.JSX.Element {
  const widthPercent = count === 0 ? 0 : Math.max((count / maxCount) * 100, 8);

  return (
    <div className="flex items-center gap-2" data-testid={`distribution-row-${guessNumber}`}>
      <span className="text-xs font-bold text-text-secondary w-3 shrink-0">{guessNumber}</span>
      <div className="flex-1 flex items-center gap-1.5 h-[18px]">
        {/* width is the guess count's share of the max count, computed per render (KTD4) */}
        <div
          data-testid={`distribution-bar-${guessNumber}`}
          className={`h-full rounded-sm transition-all duration-500 ${isHighlighted ? 'bg-correct' : 'bg-absent'}`}
          style={{ width: `${widthPercent}%` }}
        />
        <span data-testid={`distribution-count-${guessNumber}`} className="text-xs font-bold text-text-primary">
          {count}
        </span>
      </div>
    </div>
  );
}

function GameOverModal({
  isOpen,
  onClose,
  gameStatus,
  solution,
  guesses,
  evaluations,
  stats,
  isUnlimited,
  onPlayAgain,
  onGoHome,
  sessionChallenge,
  hintUsed = false,
}: GameOverModalProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState<TimeCountdown>(
    getTimeUntilMidnight()
  );
  const [isNewDayAvailable, setIsNewDayAvailable] = useState<boolean>(false);

  const shareMode: ShareMode = isUnlimited ? { type: "unlimited" } : { type: "daily", date: getTodayString() };
  const streak = "currentStreak" in stats ? stats.currentStreak : undefined;
  const shareText = generateShareText(
    guesses,
    evaluations,
    solution.length,
    shareMode,
    gameStatus === "won",
    { hintUsed, streak }
  );
  const { share, copied, failed } = useShare(shareText);

  useEffect(() => {
    if (!isOpen || isUnlimited) return;

    const timer = setInterval(() => {
      const newCountdown = getTimeUntilMidnight();
      setCountdown(newCountdown);

      if (
        newCountdown.hours === "00" &&
        newCountdown.minutes === "00" &&
        newCountdown.seconds === "00"
      ) {
        setIsNewDayAvailable(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isUnlimited]);

  const handleNewDay = (): void => {
    window.location.reload();
  };

  const handleContinueUnlimited = (): void => {
    onClose();
    navigate(location.pathname.replace(/^\/daily/, '/unlimited'));
  };

  const winPercentage =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const avgGuesses = stats.gamesWon > 0
    ? Math.round(
        stats.guessDistribution.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / stats.gamesWon * 10
      ) / 10
    : 0;

  const maxDistribution = Math.max(...stats.guessDistribution, 1);
  const title = gameStatus === "won" ? "Tebrikler!" : "Oyun Bitti";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant="sheet">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-3xl font-extrabold text-text-primary">{title}</h2>
          <div className="flex gap-1.5">
            {solution.split('').map((letter, index) => (
              <AnswerTile key={index} letter={letter} />
            ))}
          </div>
          <span className="sr-only">{solution}</span>
          {gameStatus === "won" && (
            <p className="text-sm text-text-secondary">{guesses.length}. tahminde</p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 py-4 border-t border-border-color">
          <StatBox value={stats.gamesPlayed} label="Oynanan" />
          <StatBox value={`%${winPercentage}`} label="Kazanma" />
          {!isUnlimited && "currentStreak" in stats && (
            <>
              <StatBox value={stats.currentStreak} label="Seri" />
              <StatBox value={stats.maxStreak} label="En iyi seri" />
            </>
          )}
          {isUnlimited && (
            <>
              <StatBox value={stats.gamesWon} label="Kazanılan" />
              <StatBox value={avgGuesses} label="Ort. deneme" />
            </>
          )}
        </div>

        <div className="pb-4 border-b border-border-color space-y-1.5">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Tahmin Dağılımı</p>
          {stats.guessDistribution.map((count, index) => (
            <DistributionRow
              key={index}
              count={count}
              maxCount={maxDistribution}
              guessNumber={index + 1}
              isHighlighted={gameStatus === "won" && guesses.length === index + 1}
            />
          ))}
        </div>

        {isUnlimited && sessionChallenge && (
          <div className="bg-bg-primary border border-border-color rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">
                {sessionChallenge.completed ? 'Oturum hedefi tamamlandı!' : 'Oturum hedefi'}
              </span>
              <span className="text-sm font-bold tabular-nums text-correct">
                {sessionChallenge.won}/{sessionChallenge.target}
              </span>
            </div>
            <div className="w-full bg-tile-empty rounded-full h-2">
              {/* width is the session's win ratio, computed per render (KTD4) */}
              <div
                className="bg-correct rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min(sessionChallenge.won / sessionChallenge.target * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {sessionChallenge.completed
                ? '5 oyun kazandın, harika performans!'
                : `${sessionChallenge.target - sessionChallenge.won} oyun daha kazan`}
            </p>
          </div>
        )}

        {!isUnlimited && (
          <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <Clock size={18} aria-hidden="true" />
            {isNewDayAvailable ? (
              <span>Yeni kelime hazır!</span>
            ) : (
              <span>
                Yeni kelime{" "}
                <span className="font-mono font-bold text-text-primary">
                  {countdown.hours}:{countdown.minutes}:{countdown.seconds}
                </span>{" "}
                sonra
              </span>
            )}
          </div>
        )}

        {gameStatus !== "playing" && (
          <SharePreview shareText={shareText} />
        )}

        <div className="space-y-3">
          <button
            onClick={share}
            className="w-full py-3 px-4 rounded-key font-bold text-lg bg-brand shadow-depth-brand text-brand-fg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          >
            {failed ? (
              <>
                <X size={20} />
                Hata!
              </>
            ) : copied ? (
              <>
                <Check size={20} />
                Kopyalandı!
              </>
            ) : (
              <>
                <Share2 size={20} />
                Sonucu paylaş
              </>
            )}
          </button>

          {isUnlimited ? (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-key font-bold text-lg bg-tile-empty border border-border-color text-text-primary flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw size={20} />
              Yeni kelime
            </button>
          ) : (
            <button
              onClick={isNewDayAvailable ? handleNewDay : handleContinueUnlimited}
              className="w-full py-3 px-4 rounded-key font-bold text-lg bg-tile-empty border border-border-color text-text-primary flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw size={20} />
              {isNewDayAvailable ? 'Yeni kelimeyi oyna' : 'Sınırsız modda devam et'}
            </button>
          )}

          <button
            onClick={onGoHome}
            className="w-full py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default GameOverModal;
