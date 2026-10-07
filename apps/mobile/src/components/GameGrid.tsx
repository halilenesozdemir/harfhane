import { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { isHintSolved } from '@harfhane/shared';
import type { LetterHint, TileStatus } from '@harfhane/shared';
import { Tile } from './Tile';
import { computeTileSize } from '../ui/motion/tile-size';
import { useReduceMotion } from '../ui/motion/useReduceMotion';
import { useShakeAnimation } from '../ui/motion/useShakeAnimation';
import { base } from '@harfhane/ui-tokens';
import { parseMs } from '../utils/ms';

export interface GameGridProps {
  readonly guesses: readonly string[];
  readonly evaluations: readonly (readonly TileStatus[])[];
  readonly currentGuess: string;
  readonly wordLength: number;
  readonly hints?: readonly LetterHint[];
  // A hint only ever marks the active (still-playable) row; once the game is won or lost that
  // row is just a blank trailing row and must not keep showing a placeholder letter.
  readonly isPlaying?: boolean;
  // The row just committed is flipping through its evaluated colours (R2).
  readonly isRevealing?: boolean;
  // The current (not yet committed) row was rejected and shakes once (R2).
  readonly shakeRow?: boolean;
  // The winning row bounces in a wave once its flip finishes (owner "wow" addition).
  readonly celebrateRow?: boolean;
}

const MAX_GUESSES = 6;
const ROW_GAP = 6;
const TILE_GAP = 6;
const STAGGER_MS = parseMs(base.motionStagger);

interface GameRowProps {
  readonly rowIndex: number;
  readonly letters: string;
  readonly evaluation: readonly TileStatus[] | null;
  readonly wordLength: number;
  readonly hints?: readonly LetterHint[];
  readonly tileSize: number;
  readonly isRevealing: boolean;
  readonly shake: boolean;
  readonly celebrate: boolean;
}

function getRowLetters(rowIndex: number, guesses: readonly string[], currentGuess: string): string {
  if (rowIndex < guesses.length) return guesses[rowIndex] ?? '';
  if (rowIndex === guesses.length) return currentGuess;
  return '';
}

function GameRow({ rowIndex, letters, evaluation, wordLength, hints, tileSize, isRevealing, shake, celebrate }: GameRowProps) {
  const reduceMotion = useReduceMotion();
  const translateX = useShakeAnimation(shake, reduceMotion);
  const tiles = [];
  for (let col = 0; col < wordLength; col++) {
    const typedLetter = letters[col] ?? '';
    const hint = hints?.find((entry) => entry.position === col) ?? null;
    const isHint = typedLetter.length === 0 && hint !== null;
    const letter = isHint && hint ? hint.letter : typedLetter;
    const delayMs = col * STAGGER_MS;
    tiles.push(
      <Tile
        key={col}
        testID={`tile-${rowIndex}-${col}`}
        letter={letter}
        status={evaluation?.[col] ?? null}
        isFilled={typedLetter.length > 0}
        isHint={isHint}
        size={tileSize}
        isRevealing={isRevealing}
        revealDelayMs={delayMs}
        celebrate={celebrate}
        celebrateDelayMs={delayMs}
      />,
    );
  }
  return <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>{tiles}</Animated.View>;
}

export function GameGrid({
  guesses,
  evaluations,
  currentGuess,
  wordLength,
  hints,
  isPlaying = true,
  isRevealing = false,
  shakeRow = false,
  celebrateRow = false,
}: GameGridProps) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const tileSize = computeTileSize(box, wordLength, { rows: MAX_GUESSES, columnGap: TILE_GAP, rowGap: ROW_GAP });

  function handleLayout(event: LayoutChangeEvent): void {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
  }

  const rows = [];
  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex++) {
    const letters = getRowLetters(rowIndex, guesses, currentGuess);
    const isCurrentRow = isPlaying && rowIndex === guesses.length;
    const rowHints = isCurrentRow
      ? hints?.filter((hint) => !isHintSolved([...guesses], hint.position, hint.letter))
      : undefined;
    rows.push(
      <GameRow
        key={rowIndex}
        rowIndex={rowIndex}
        letters={letters}
        evaluation={evaluations[rowIndex] ?? null}
        wordLength={wordLength}
        hints={rowHints}
        tileSize={tileSize}
        isRevealing={isRevealing && rowIndex === guesses.length - 1}
        shake={shakeRow && rowIndex === guesses.length}
        celebrate={celebrateRow && rowIndex === guesses.length - 1}
      />,
    );
  }
  return (
    <View testID="game-grid" style={styles.container} onLayout={handleLayout}>
      <View style={styles.grid}>{rows}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  grid: { gap: ROW_GAP, alignItems: 'center' },
  row: { flexDirection: 'row', gap: TILE_GAP },
});
