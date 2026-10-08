import { useState, useEffect } from "react";
import { Share2, Check, RotateCcw, Home, X } from "lucide-react";
import Modal from "./Modal";
import SharePreview from "./SharePreview";
import { getTimeUntilMidnight, generateShareText } from "@harfhane/shared";
import { useShare } from "../hooks/useShare";
import type { GameOverModalProps, TimeCountdown } from "../types";

interface StatBoxProps {
  value: number;
  label: string;
}

function StatBox({ value, label }: StatBoxProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
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
  gameNumber,
  stats,
  isUnlimited,
  onPlayAgain,
  onGoHome,
  sessionChallenge,
  challengeUrl,
  hintUsed = false,
}: GameOverModalProps): React.JSX.Element {
  const [countdown, setCountdown] = useState<TimeCountdown>(
    getTimeUntilMidnight()
  );
  const [isNewDayAvailable, setIsNewDayAvailable] = useState<boolean>(false);

  const modeText = isUnlimited ? "Sınırsız" : `#${gameNumber}`;
  const shareText = generateShareText(
    guesses,
    evaluations,
    modeText,
    gameStatus === "won",
    { shareUrl: challengeUrl, hintUsed }
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

  const winPercentage =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const avgGuesses = stats.gamesWon > 0
    ? Math.round(
        stats.guessDistribution.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / stats.gamesWon * 10
      ) / 10
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={gameStatus === "won" ? "Tebrikler!" : "Oyun Bitti"}
    >
      <div className="space-y-6">
        <div className="text-center">
          {gameStatus === "won" ? (
            <p className="text-lg text-text-primary">
              Kelimeyi{" "}
              <span className="text-correct font-bold">{guesses.length}</span>{" "}
              denemede buldunuz!
            </p>
          ) : (
            <div>
              <p className="text-lg mb-2 text-text-primary">Kelime:</p>
              <p className="text-2xl font-bold text-present">{solution}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 py-4 border-t border-border-color">
          <StatBox value={stats.gamesPlayed} label="Oyun" />
          <StatBox value={winPercentage} label="Kazanma %" />
          {!isUnlimited && "currentStreak" in stats && (
            <>
              <StatBox value={stats.currentStreak} label="Seri" />
              <StatBox value={stats.maxStreak} label="En İyi" />
            </>
          )}
          {isUnlimited && (
            <>
              <StatBox value={stats.gamesWon} label="Kazanılan" />
              <StatBox value={avgGuesses} label="Ort. Deneme" />
            </>
          )}
        </div>

        <div className="pb-4 border-b border-border-color space-y-1.5">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Tahmin Dağılımı</p>
          {stats.guessDistribution.map((count, index) => {
            const maxCount = Math.max(...stats.guessDistribution, 1);
            const isCurrentGuess = gameStatus === "won" && guesses.length === index + 1;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-secondary w-3 shrink-0">{index + 1}</span>
                <div className="flex-1 h-5 bg-tile-empty rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm flex items-center justify-end pr-1.5 transition-all duration-500 ${isCurrentGuess ? 'bg-correct' : 'bg-tile-filled'}`}
                    style={{ width: count === 0 ? '0%' : `${Math.max((count / maxCount) * 100, 8)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-xs font-bold text-white leading-none">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
          <div className="text-center">
            {isNewDayAvailable ? (
              <div className="space-y-2">
                <p className="text-lg text-correct font-bold">
                  Yeni kelime hazır!
                </p>
                <p className="text-sm text-text-secondary">
                  Yeni kelimeyi oynamak için tıklayın
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-2">
                  Sonraki kelime
                </p>
                <p className="text-3xl font-mono font-bold text-text-primary">
                  {countdown.hours}:{countdown.minutes}:{countdown.seconds}
                </p>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          {!isUnlimited && isNewDayAvailable && (
            <button
              onClick={handleNewDay}
              className="w-full py-3 px-4 rounded-md font-bold text-lg bg-brand hover:bg-brand/90 text-brand-fg flex items-center justify-center gap-2 transition-all duration-200 animate-bounce-in cursor-pointer"
            >
              <RotateCcw size={20} />
              Yeni Oyunu Başlat
            </button>
          )}

          {gameStatus !== "playing" && (
            <SharePreview
              evaluations={evaluations}
              gameNumber={gameNumber}
              guessCount={guesses.length}
              isWon={gameStatus === "won"}
              challengeUrl={challengeUrl}
            />
          )}

          <button
            onClick={share}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-brand hover:bg-brand/90 text-brand-fg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
                Paylaş
              </>
            )}
          </button>

          {isUnlimited && (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-md font-bold text-lg bg-present hover:bg-present/90 text-present-fg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw size={20} />
              Tekrar Oyna
            </button>
          )}

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

export default GameOverModal;
