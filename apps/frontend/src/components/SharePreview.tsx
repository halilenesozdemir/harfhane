import type { TileStatus } from "../types";

interface SharePreviewProps {
  evaluations: TileStatus[][];
}

const STATUS_BG: Record<NonNullable<TileStatus>, string> = {
  correct: "bg-correct",
  present: "bg-present",
  absent: "bg-absent",
};

function getTileBg(status: TileStatus): string {
  if (!status) return "bg-absent";
  return STATUS_BG[status];
}

function SharePreview({ evaluations }: SharePreviewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 items-center">
      {evaluations.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((status, colIndex) => (
            <div
              key={colIndex}
              className={`w-5 h-5 rounded-sm ${getTileBg(status)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SharePreview;
