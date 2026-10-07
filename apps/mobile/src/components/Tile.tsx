import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { base } from '@harfhane/ui-tokens';
import { useTheme } from '../ThemeProvider';
import { useReduceMotion } from '../ui/motion/useReduceMotion';
import { TILE_SIZE_FALLBACK } from '../ui/motion/tile-size';
import type { ThemeColors } from '../theme';
import { parsePx } from '../utils/px';
import { parseMs } from '../utils/ms';

export interface TileProps {
  readonly letter: string;
  readonly status: TileStatus;
  readonly isFilled: boolean;
  readonly isHint?: boolean;
  readonly testID?: string;
  readonly size?: number;
  // The row currently flipping through its evaluated colours (R2); this tile's own slice of it.
  readonly isRevealing?: boolean;
  readonly revealDelayMs?: number;
  // The owner-requested "wow" wave after a winning row finishes its flip, beyond R2's letter.
  readonly celebrate?: boolean;
  readonly celebrateDelayMs?: number;
}

const TILE_BORDER_WIDTH = 2;
const TILE_FONT_RATIO = 0.5;
const PERSPECTIVE = 800;
const BOUNCE_SCALE = 1.15;
const POP_SCALE = 1.1;
// 50% failed 3:1 contrast on web for the hint letter; 75% keeps the placeholder feel while reading clearly.
const HINT_LETTER_OPACITY = 0.75;

const POP_MS = parseMs(base.motionPop);
const FLIP_MS = parseMs(base.motionFlip);
const BOUNCE_MS = parseMs(base.motionBounce);
const FLIP_HALF_MS = FLIP_MS / 2;

const STATUS_LABELS: Record<'correct' | 'present' | 'absent', string> = {
  correct: 'doğru yerde',
  present: 'kelimede var',
  absent: 'kelimede yok',
};

function getAccessibilityLabel(letter: string, status: TileStatus, isHint: boolean): string {
  if (!letter) return 'boş';
  if (isHint) return `${letter}, ipucu`;
  if (!status) return letter;
  return `${letter}, ${STATUS_LABELS[status]}`;
}

function getBorderAndBackground(status: TileStatus, isFilled: boolean, isHint: boolean, colors: ThemeColors) {
  if (isHint) return { backgroundColor: colors.surface, borderColor: colors.brand };
  if (status === 'correct') return { backgroundColor: colors.correct, borderColor: colors.correct };
  if (status === 'present') return { backgroundColor: colors.present, borderColor: colors.present };
  if (status === 'absent') return { backgroundColor: colors.absent, borderColor: colors.absent };
  if (isFilled) return { backgroundColor: colors.surface, borderColor: colors.tileFilledBorder };
  return { backgroundColor: colors.tileEmptyBg, borderColor: colors.tileEmptyBorder };
}

function getTextColor(status: TileStatus, isHint: boolean, colors: ThemeColors): string {
  if (isHint) return colors.brand;
  if (status === 'correct') return colors.correctFg;
  if (status === 'present') return colors.presentFg;
  if (status === 'absent') return colors.absentFg;
  return colors.text;
}

// Pops the tile when a letter fills it (not for a hint placeholder, and never once evaluated).
function usePopAnimation(isFilled: boolean, status: TileStatus, reduceMotion: boolean, scale: Animated.Value) {
  const wasPoppable = useRef(isFilled && !status);
  useEffect(() => {
    const isPoppable = isFilled && !status;
    const justFilled = isPoppable && !wasPoppable.current;
    wasPoppable.current = isPoppable;
    if (!justFilled || reduceMotion) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: POP_SCALE, duration: POP_MS / 2, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: POP_MS / 2, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [isFilled, status, reduceMotion, scale]);
}

// Flips the tile through the evaluated colour at the midpoint, with a per-tile stagger delay.
// Reduce motion (AE2) skips the flip entirely and shows the evaluated colour immediately.
function useFlipAnimation(isRevealing: boolean, revealDelayMs: number, reduceMotion: boolean, rotation: Animated.Value) {
  const [colorRevealed, setColorRevealed] = useState(true);
  const [wasRevealing, setWasRevealing] = useState(false);

  // Adjust state when the row starts revealing (React's "adjusting state when a prop changes"
  // pattern) instead of setting it from inside the effect below.
  if (isRevealing !== wasRevealing) {
    setWasRevealing(isRevealing);
    if (isRevealing) setColorRevealed(reduceMotion);
  }

  useEffect(() => {
    if (!isRevealing || reduceMotion) return undefined;
    rotation.setValue(0);
    Animated.timing(rotation, { toValue: 1, duration: FLIP_MS, delay: revealDelayMs, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
    const midTimer = setTimeout(() => setColorRevealed(true), revealDelayMs + FLIP_HALF_MS);
    return () => clearTimeout(midTimer);
  }, [isRevealing, revealDelayMs, reduceMotion, rotation]);

  return colorRevealed;
}

function useCelebrateAnimation(celebrate: boolean, celebrateDelayMs: number, reduceMotion: boolean, scale: Animated.Value) {
  useEffect(() => {
    if (!celebrate || reduceMotion) return;
    Animated.sequence([
      Animated.delay(celebrateDelayMs),
      Animated.timing(scale, { toValue: BOUNCE_SCALE, duration: BOUNCE_MS / 2, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: BOUNCE_MS / 2, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [celebrate, celebrateDelayMs, reduceMotion, scale]);
}

export function Tile({
  letter,
  status,
  isFilled,
  isHint = false,
  testID,
  size = TILE_SIZE_FALLBACK,
  isRevealing = false,
  revealDelayMs = 0,
  celebrate = false,
  celebrateDelayMs = 0,
}: TileProps) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const [rotation] = useState(() => new Animated.Value(0));

  usePopAnimation(isFilled, status, reduceMotion, scale);
  const colorRevealed = useFlipAnimation(isRevealing, revealDelayMs, reduceMotion, rotation);
  useCelebrateAnimation(celebrate, celebrateDelayMs, reduceMotion, scale);

  const effectiveStatus = colorRevealed ? status : null;
  const { backgroundColor, borderColor } = getBorderAndBackground(effectiveStatus, isFilled, isHint, colors);
  const rotateX = rotation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '0deg'] });

  return (
    <Animated.View
      testID={testID}
      accessibilityLabel={getAccessibilityLabel(letter, status, isHint)}
      style={[
        styles.tile,
        isHint ? styles.hintTile : styles.solidTile,
        { width: size, height: size, backgroundColor, borderColor },
        { transform: [{ perspective: PERSPECTIVE }, { rotateX }, { scale }] },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * TILE_FONT_RATIO, color: getTextColor(effectiveStatus, isHint, colors) }, isHint && styles.hintLetter]}>
        {letter}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: TILE_BORDER_WIDTH,
    borderRadius: parsePx(base.radiusTile),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTile: { borderStyle: 'dashed' },
  // Android keeps a previously applied dashed border unless solid is set explicitly.
  solidTile: { borderStyle: 'solid' },
  letter: {
    fontWeight: '800',
  },
  hintLetter: { opacity: HINT_LETTER_OPACITY },
});
