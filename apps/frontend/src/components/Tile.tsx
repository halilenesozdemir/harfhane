import type { TileProps } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  correct: 'bg-correct border-correct text-correct-fg shadow-depth-correct',
  present: 'bg-present border-present text-present-fg shadow-depth-present',
  absent: 'bg-absent border-absent text-absent-fg shadow-depth-absent',
};

// Mirrors apps/mobile/src/components/Tile.tsx's getAccessibilityLabel
// wording in shape, and the approved design mockup's own aria text
// (Game.dc.html / GamePhone.dc.html), which uses "başka yerde" for a
// present letter rather than mobile's current "kelimede var".
const STATUS_LABELS: Record<'correct' | 'present' | 'absent', string> = {
  correct: 'doğru yerde',
  present: 'başka yerde',
  absent: 'kelimede yok',
};

const getStateClasses = (status: TileProps['status'], isFilled: boolean, isHint: boolean): string => {
  if (status) return STATUS_CLASSES[status] ?? '';
  // Dashed border + reduced text opacity mark this as a placeholder, not a
  // typed letter, so it reads distinctly from a tile the player filled in.
  if (isHint) return 'bg-tile-empty-bg border-dashed border-brand text-brand/75';
  if (isFilled) return 'bg-bg-secondary border-tile-filled text-text-primary shadow-depth-tile';
  return 'bg-tile-empty-bg border-tile-empty text-text-primary';
};

function getAccessibleName(letter: string, status: TileProps['status'], isHint: boolean): string {
  if (!letter) return 'boş';
  if (isHint) return `${letter}, ipucu`;
  if (!status) return letter;
  return `${letter}, ${STATUS_LABELS[status]}`;
}

const Tile = ({ letter, status, isRevealing, revealDelay, isFilled, isHint, reduceMotion }: TileProps): React.JSX.Element => {
  const skipMotion = Boolean(reduceMotion);

  return (
    <div
      data-testid="tile"
      role="gridcell"
      aria-label={getAccessibleName(letter, status, Boolean(isHint))}
      data-status={status ?? (isFilled ? 'filled' : 'empty')}
      data-hint={isHint ? 'true' : undefined}
      className={`
        w-[var(--board-tile-size)] h-[var(--board-tile-size)]
        flex items-center justify-center
        rounded-tile border-2
        font-display text-[length:calc(var(--board-tile-size)*0.5)] font-extrabold uppercase leading-none
        ${getStateClasses(status, Boolean(isFilled), Boolean(isHint))}
        ${isRevealing && !skipMotion ? `tile-flip tile-flip-delay-${revealDelay}` : ''}
        ${isFilled && !status && !skipMotion ? 'animate-pop' : ''}
        select-none
      `}
    >
      {letter}
    </div>
  );
};

export default Tile;
