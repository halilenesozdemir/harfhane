import { StyleSheet, Text, View } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { base } from '@harfhane/ui-tokens';
import { useTheme } from '../ThemeProvider';
import type { ThemeColors } from '../theme';
import { parsePx } from '../utils/px';

export interface TileProps {
  readonly letter: string;
  readonly status: TileStatus;
  readonly isFilled: boolean;
  readonly testID?: string;
}

const TILE_SIZE = 56;
const TILE_BORDER_WIDTH = 2;
const TILE_FONT_SIZE = 28;

const STATUS_LABELS: Record<'correct' | 'present' | 'absent', string> = {
  correct: 'doğru yerde',
  present: 'kelimede var',
  absent: 'kelimede yok',
};

function getAccessibilityLabel(letter: string, status: TileStatus): string {
  if (!letter) return 'boş';
  if (!status) return letter;
  return `${letter}, ${STATUS_LABELS[status]}`;
}

function getBorderAndBackground(status: TileStatus, isFilled: boolean, colors: ThemeColors) {
  if (status === 'correct') return { backgroundColor: colors.correct, borderColor: colors.correct };
  if (status === 'present') return { backgroundColor: colors.present, borderColor: colors.present };
  if (status === 'absent') return { backgroundColor: colors.absent, borderColor: colors.absent };
  if (isFilled) return { backgroundColor: colors.surface, borderColor: colors.tileFilledBorder };
  return { backgroundColor: colors.tileEmptyBg, borderColor: colors.tileEmptyBorder };
}

function getTextColor(status: TileStatus, colors: ThemeColors): string {
  if (status === 'correct') return colors.correctFg;
  if (status === 'present') return colors.presentFg;
  if (status === 'absent') return colors.absentFg;
  return colors.text;
}

export function Tile({ letter, status, isFilled, testID }: TileProps) {
  const { colors } = useTheme();
  const { backgroundColor, borderColor } = getBorderAndBackground(status, isFilled, colors);

  return (
    <View
      testID={testID}
      accessibilityLabel={getAccessibilityLabel(letter, status)}
      style={[styles.tile, { backgroundColor, borderColor }]}
    >
      <Text style={[styles.letter, { color: getTextColor(status, colors) }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: TILE_BORDER_WIDTH,
    borderRadius: parsePx(base.radiusTile),
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: TILE_FONT_SIZE,
    fontWeight: '800',
  },
});
