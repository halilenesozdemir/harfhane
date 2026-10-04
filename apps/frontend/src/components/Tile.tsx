import type { TileProps } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  correct: 'bg-correct border-correct text-correct-fg shadow-depth-correct',
  present: 'bg-present border-present text-present-fg shadow-depth-present',
  absent: 'bg-absent border-absent text-absent-fg shadow-depth-absent',
};

const getStateClasses = (status: TileProps['status'], isFilled: boolean): string => {
  if (status) return STATUS_CLASSES[status] ?? '';
  if (isFilled) return 'bg-bg-secondary border-tile-filled text-text-primary shadow-depth-tile';
  return 'bg-tile-empty-bg border-tile-empty text-text-primary';
};

const Tile = ({ letter, status, isRevealing, revealDelay, isFilled }: TileProps): React.JSX.Element => (
  <div
    data-status={status ?? (isFilled ? 'filled' : 'empty')}
    className={`
      w-14 h-14 md:w-16 md:h-16
      flex items-center justify-center
      rounded-tile border-2
      font-display text-3xl md:text-4xl font-extrabold uppercase leading-none
      ${getStateClasses(status, Boolean(isFilled))}
      ${isRevealing ? `tile-flip tile-flip-delay-${revealDelay}` : ''}
      ${isFilled && !status ? 'animate-pop' : ''}
      select-none
    `}
  >
    {letter}
  </div>
);

export default Tile;
