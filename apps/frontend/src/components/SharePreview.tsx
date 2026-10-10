import type { TileStatus } from "../types";

interface SharePreviewProps {
  evaluations: TileStatus[][];
  gameNumber?: number | string;
  guessCount?: number;
  isWon?: boolean;
  challengeUrl?: string | undefined;
}

const STATUS_BG: Record<NonNullable<TileStatus>, string> = {
  correct: "bg-correct",
  present: "bg-present",
  absent: "bg-absent",
};

function getTileBg(status: TileStatus): string {
  return status ? STATUS_BG[status] : "bg-absent";
}

function SharePreview({ evaluations, gameNumber, guessCount, isWon, challengeUrl }: SharePreviewProps): React.JSX.Element {
  const scoreText = isWon ? `${guessCount}/6` : 'X/6';

  return (
    <div className="w-full rounded-xl border border-border-color bg-bg-primary overflow-hidden">
      <div className="bg-correct/10 border-b border-border-color px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold tracking-widest text-text-primary text-sm">HARFHANE</span>
        {gameNumber !== undefined && (
          <span className="text-xs text-text-secondary">
            {typeof gameNumber === 'number' ? `#${gameNumber}` : gameNumber}
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex items-center gap-4">
        <div className="flex flex-col gap-0.5">
          {evaluations.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-0.5" data-testid="share-preview-row">
              {row.map((status, colIndex) => (
                <div
                  key={colIndex}
                  data-testid="share-preview-tile"
                  className={`w-4 h-4 rounded-sm ${getTileBg(status)}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className={`text-2xl font-bold tabular-nums ${isWon ? 'text-correct' : 'text-red-400'}`}>
            {scoreText}
          </span>
          {challengeUrl && (
            <span className="text-xs text-text-secondary break-all">{challengeUrl}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharePreview;
