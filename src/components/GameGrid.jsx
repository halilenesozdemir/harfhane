import Tile from './Tile';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const GameGrid = ({ 
  guesses, 
  evaluations, 
  currentGuess, 
  isRevealing, 
  shakeRow,
  gameStatus 
}) => {
  // Grid'i oluştur
  const rows = [];
  
  for (let i = 0; i < MAX_GUESSES; i++) {
    const isCurrentRow = i === guesses.length && gameStatus === 'playing';
    const isRevealingRow = isRevealing && i === guesses.length - 1;
    
    let rowContent = '';
    let rowEvaluation = null;
    
    if (i < guesses.length) {
      // Tamamlanmış satır
      rowContent = guesses[i];
      rowEvaluation = evaluations[i];
    } else if (isCurrentRow) {
      // Aktif satır
      rowContent = currentGuess.padEnd(WORD_LENGTH, '');
    }
    
    const tiles = [];
    for (let j = 0; j < WORD_LENGTH; j++) {
      const letter = rowContent[j] || '';
      const status = rowEvaluation ? rowEvaluation[j] : null;
      
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
