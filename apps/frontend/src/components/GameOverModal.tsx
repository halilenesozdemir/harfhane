import { useState, useEffect } from "react";
import { Share2, Check, RotateCcw, Home, X } from "lucide-react";
import Modal from "./Modal";
import SharePreview from "./SharePreview";
import { getTimeUntilMidnight, generateShareText } from "../utils/gameLogic";
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
  solutionEntry,
  guesses,
  evaluations,
  gameNumber,
  stats,
  isUnlimited,
  onPlayAgain,
  onGoHome,
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
    gameStatus === "won"
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

        {solutionEntry && (
          <div className="bg-bg-primary p-4 rounded-lg border border-border-color">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-text-secondary">Anlam:</span>
                <p className="text-text-primary font-medium">
                  {solutionEntry.meaning}
                </p>
              </div>
              {solutionEntry.context && (
                <div>
                  <span className="text-sm text-text-secondary">
                    Bağlam:
                  </span>
                  <p className="text-text-primary text-sm italic">
                    "{solutionEntry.context}"
                  </p>
                </div>
              )}
              <div>
                <span className="inline-block px-2 py-1 bg-tile-empty text-text-primary text-xs rounded">
                  {solutionEntry.category}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 py-4 border-y border-border-color">
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
              <StatBox
                value={stats.gamesPlayed - stats.gamesWon}
                label="Kaybedilen"
              />
            </>
          )}
        </div>

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
              className="w-full py-3 px-4 rounded-md font-bold text-lg bg-correct hover:bg-correct/90 text-white flex items-center justify-center gap-2 transition-all duration-200 animate-bounce-in cursor-pointer"
            >
              <RotateCcw size={20} />
              Yeni Oyunu Başlat
            </button>
          )}

          {gameStatus !== "playing" && (
            <SharePreview evaluations={evaluations} />
          )}

          <button
            onClick={share}
            className="w-full py-3 px-4 rounded-md font-bold text-lg bg-correct hover:bg-correct/90 text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
              className="w-full py-3 px-4 rounded-md font-bold text-lg bg-present hover:bg-present/90 text-white flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
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
