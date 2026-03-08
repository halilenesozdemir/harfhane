import Tile from './Tile';
import type { GameGridProps } from '../types';

const MAX_GUESSES = 6;

const GameGrid = ({
  guesses,
  evaluations,
  currentGuess,
  isRevealing,
  shakeRow,
  gameStatus,
  wordLength,
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
      const letter = rowContent[j] || '';
      const status = rowEvaluation ? rowEvaluation[j]! : null;
      
      tiles.push(
        <Tile
          key={`${i}-${j}`}
          letter={letter}
          status={status}
          isRevealing={isRevealingRow}
          revealDelay={j}
          isFilled={!!letter}
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
    <div className="flex flex-col gap-1.5 p-4">
      {rows}
    </div>
  );
};

export default GameGrid;
