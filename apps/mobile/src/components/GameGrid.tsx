import { StyleSheet, View } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { Tile } from './Tile';

export interface GameGridProps {
  readonly guesses: readonly string[];
  readonly evaluations: readonly (readonly TileStatus[])[];
  readonly currentGuess: string;
  readonly wordLength: number;
}

const MAX_GUESSES = 6;
const ROW_GAP = 6;
const TILE_GAP = 6;

interface GameRowProps {
  readonly rowIndex: number;
  readonly letters: string;
  readonly evaluation: readonly TileStatus[] | null;
  readonly wordLength: number;
}

function getRowLetters(rowIndex: number, guesses: readonly string[], currentGuess: string): string {
  if (rowIndex < guesses.length) return guesses[rowIndex] ?? '';
  if (rowIndex === guesses.length) return currentGuess;
  return '';
}

function GameRow({ rowIndex, letters, evaluation, wordLength }: GameRowProps) {
  const tiles = [];
  for (let col = 0; col < wordLength; col++) {
    const letter = letters[col] ?? '';
    tiles.push(
      <Tile
        key={col}
        testID={`tile-${rowIndex}-${col}`}
        letter={letter}
        status={evaluation?.[col] ?? null}
        isFilled={letter.length > 0}
      />,
    );
  }
  return <View style={styles.row}>{tiles}</View>;
}

export function GameGrid({ guesses, evaluations, currentGuess, wordLength }: GameGridProps) {
  const rows = [];
  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex++) {
    const letters = getRowLetters(rowIndex, guesses, currentGuess);
    rows.push(
      <GameRow
        key={rowIndex}
        rowIndex={rowIndex}
        letters={letters}
        evaluation={evaluations[rowIndex] ?? null}
        wordLength={wordLength}
      />,
    );
  }
  return <View style={styles.grid}>{rows}</View>;
}

const styles = StyleSheet.create({
  grid: { gap: ROW_GAP, alignItems: 'center' },
  row: { flexDirection: 'row', gap: TILE_GAP },
});
