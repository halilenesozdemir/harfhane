import { StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { AppText } from '../ui/Typography';
import { DepthTile } from '../ui/DepthTile';
import { DEPTH, FONT_SIZE, SPACING } from '../ui/layout';
import type { ThemeColors } from '../theme';

// mobile-redesign-spec.md section B: the hero is the H-A-R-F tile row (not all
// 8 letters), each on its own game-state fill, followed by "hane" in display type.
const HERO_LETTERS = ['H', 'A', 'R', 'F'] as const;
const HERO_TILE_SIZE = 48;
const HERO_ACCESSIBILITY_LABEL = 'Harfhane';
const HERO_MAX_FONT_SCALE = 1.2;

function heroTileFill(colors: ThemeColors, index: number): string {
  return index % 2 === 0 ? colors.correct : colors.present;
}

function heroTileDepth(colors: ThemeColors, index: number): string {
  return index % 2 === 0 ? colors.correctDepth : colors.presentDepth;
}

// C1: each letter's foreground is the *Fg matching its own fill, never a
// single shared colour across fills.
function heroTileFg(colors: ThemeColors, index: number): string {
  return index % 2 === 0 ? colors.correctFg : colors.presentFg;
}

export function HomeHero() {
  const { colors } = useTheme();

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={HERO_ACCESSIBILITY_LABEL}
      testID="home-hero"
    >
      {HERO_LETTERS.map((letter, index) => (
        <DepthTile
          key={letter}
          letter={letter}
          fill={heroTileFill(colors, index)}
          foreground={heroTileFg(colors, index)}
          depthColor={heroTileDepth(colors, index)}
          size={HERO_TILE_SIZE}
          depth={DEPTH.lg}
          letterFontSize={FONT_SIZE.headline}
        />
      ))}
      <AppText
        role="display"
        color={colors.text}
        style={styles.wordmark}
        maxFontSizeMultiplier={HERO_MAX_FONT_SCALE}
        importantForAccessibility="no-hide-descendants"
      >
        hane
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  wordmark: { marginLeft: SPACING.xs },
});
