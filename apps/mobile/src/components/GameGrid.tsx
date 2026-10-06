import { StyleSheet, View } from 'react-native';
import type { LetterHint, TileStatus } from '@harfhane/shared';
import { Tile } from './Tile';

export interface GameGridProps {
  readonly guesses: readonly string[];
  readonly evaluations: readonly (readonly TileStatus[])[];
  readonly currentGuess: string;
  readonly wordLength: number;
  readonly hints?: readonly LetterHint[];
  // A hint only ever marks the active (still-playable) row; once the game is won or lost that
  // row is just a blank trailing row and must not keep showing a placeholder letter.
  readonly isPlaying?: boolean;
}

const MAX_GUESSES = 6;
const ROW_GAP = 6;
const TILE_GAP = 6;

interface GameRowProps {
  readonly rowIndex: number;
  readonly letters: string;
  readonly evaluation: readonly TileStatus[] | null;
  readonly wordLength: number;
  readonly hints?: readonly LetterHint[];
}

function getRowLetters(rowIndex: number, guesses: readonly string[], currentGuess: string): string {
  if (rowIndex < guesses.length) return guesses[rowIndex] ?? '';
  if (rowIndex === guesses.length) return currentGuess;
  return '';
}

function GameRow({ rowIndex, letters, evaluation, wordLength, hints }: GameRowProps) {
  const tiles = [];
  for (let col = 0; col < wordLength; col++) {
    const typedLetter = letters[col] ?? '';
    const hint = hints?.find((entry) => entry.position === col) ?? null;
    const isHint = typedLetter.length === 0 && hint !== null;
    const letter = isHint && hint ? hint.letter : typedLetter;
    tiles.push(
      <Tile
        key={col}
        testID={`tile-${rowIndex}-${col}`}
        letter={letter}
        status={evaluation?.[col] ?? null}
        isFilled={typedLetter.length > 0}
        isHint={isHint}
      />,
    );
  }
  return <View style={styles.row}>{tiles}</View>;
}

export function GameGrid({ guesses, evaluations, currentGuess, wordLength, hints, isPlaying = true }: GameGridProps) {
  const rows = [];
  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex++) {
    const letters = getRowLetters(rowIndex, guesses, currentGuess);
    const rowHints = isPlaying && rowIndex === guesses.length ? hints : undefined;
    rows.push(
      <GameRow
        key={rowIndex}
        rowIndex={rowIndex}
        letters={letters}
        evaluation={evaluations[rowIndex] ?? null}
        wordLength={wordLength}
        hints={rowHints}
      />,
    );
  }
  return <View style={styles.grid}>{rows}</View>;
}

const styles = StyleSheet.create({
  grid: { gap: ROW_GAP, alignItems: 'center' },
  row: { flexDirection: 'row', gap: TILE_GAP },
});
