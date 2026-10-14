import Tile from './Tile';
import type { GameGridProps } from '../types';
import { isHintSolved } from '@harfhane/shared';

const MAX_GUESSES = 6;
// Matches the Tailwind gap-1.5 used between tiles and between rows.
const TILE_GAP_PX = 6;
// Width budget: leaves margin either side of the board on narrow screens.
const BOARD_WIDTH_VIEWPORT_PCT = 90;
// Height budget: leaves room for the header, hint button and keyboard below
// so the whole screen fits without a vertical scroll at 360x640 (012-AE5).
const BOARD_HEIGHT_VIEWPORT_PCT = 36;

const GameGrid = ({
  guesses,
  evaluations,
  currentGuess,
  isRevealing,
  shakeRow,
  gameStatus,
  wordLength,
  hint,
}: GameGridProps): React.JSX.Element => {
  const rows = [];

  for (let i = 0; i < MAX_GUESSES; i++) {
    const isCurrentRow = i === guesses.length && gameStatus === 'playing';
    const isRevealingRow = isRevealing && i === guesses.length - 1;

    let rowContent = '';
    let rowEvaluation = evaluations[i] || null;

    if (i < guesses.length) {
      rowContent = guesses[i]!;
      rowEvaluation = evaluations[i] || null;
    } else if (isCurrentRow) {
      rowContent = currentGuess.padEnd(wordLength, '');
    }

    const tiles = [];
    for (let j = 0; j < wordLength; j++) {
      let letter = rowContent[j] || '';
      const status = rowEvaluation ? rowEvaluation[j]! : null;
      const isHint =
        isCurrentRow &&
        hint != null &&
        hint.position === j &&
        !letter &&
        !isHintSolved(guesses, hint.position, hint.letter);
      if (isHint) letter = hint!.letter;

      tiles.push(
        <Tile
          key={`${i}-${j}`}
          letter={letter}
          status={status}
          isRevealing={isRevealingRow}
          revealDelay={j}
          isFilled={!isHint && !!letter}
          isHint={isHint}
        />
      );
    }

    rows.push(
      <div
        key={i}
        className={`
          flex gap-1.5 justify-center
          ${isCurrentRow && shakeRow ? 'animate-shake' : ''}
        `}
      >
        {tiles}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5 px-2 py-2"
      style={
        {
          '--tile-count': wordLength,
          // KTD2: tile size is a CSS clamp on the board width, bounded by
          // min(vw, dvh) terms and the tile-size-min/max tokens; this is a
          // static formula built from the word length prop, not a measured
          // value, so there is no JS resize listener behind it.
          '--board-tile-size': `clamp(var(--hh-tile-size-min), calc((min(${BOARD_WIDTH_VIEWPORT_PCT}vw, ${BOARD_HEIGHT_VIEWPORT_PCT}dvh) - (var(--tile-count) - 1) * ${TILE_GAP_PX}px) / var(--tile-count)), var(--hh-tile-size-max))`,
        } as React.CSSProperties
      }
    >
      {rows}
    </div>
  );
};

export default GameGrid;
