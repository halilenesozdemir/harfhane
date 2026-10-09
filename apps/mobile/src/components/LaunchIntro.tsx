import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { TileStatus } from '@harfhane/shared';
import { getThemeColors } from '../theme';
import { ThemeContext } from '../ThemeProvider';
import type { ThemeContextValue } from '../ThemeProvider';
import { useReduceMotion } from '../ui/motion/useReduceMotion';
import { DepthTile } from '../ui/DepthTile';
import { AppText } from '../ui/Typography';
import { Tile } from './Tile';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, SPACING } from '../ui/layout';
import { LAUNCH_INTRO_TIMING, useLaunchIntroPhases } from './useLaunchIntroPhases';
import type { LaunchIntroPhase } from './useLaunchIntroPhases';

export interface LaunchIntroProps {
  /** Called exactly once, whether the intro plays, is skipped, or reduce motion skips it entirely. */
  readonly onDone: () => void;
}

// The dark variant always plays here (owner decision 2026-10-09, section A), independent of the
// device's current theme, so frame 0 matches the native splash's fixed dark background.
const DARK_COLORS = getThemeColors({ scheme: 'dark', isHighContrast: false });

// Forces Tile (consumed by IntroTiles below) into the same fixed dark palette as the rest of the
// intro, independent of the device's own current theme, via a no-op setPreference/setHighContrast
// (Tile never calls them; it only reads `colors`).
const DARK_THEME_CONTEXT: ThemeContextValue = {
  colors: DARK_COLORS,
  scheme: 'dark',
  preference: 'dark',
  isHighContrast: false,
  setPreference: () => undefined,
  setHighContrast: () => undefined,
};

interface IntroTile {
  readonly letter: string;
  readonly status: TileStatus;
}

const ROW1: readonly IntroTile[] = [
  { letter: 'F', status: 'present' },
  { letter: 'A', status: 'correct' },
  { letter: 'R', status: 'correct' },
  { letter: 'K', status: 'absent' },
];
const ROW2: readonly IntroTile[] = [
  { letter: 'H', status: 'correct' },
  { letter: 'A', status: 'correct' },
  { letter: 'R', status: 'correct' },
  { letter: 'F', status: 'correct' },
];

const INTRO_TILE_SIZE = 48;
const MARK_PRESENT_SIZE = 56;
const MARK_PRESENT_DEPTH = 7;
const MARK_CORRECT_SIZE = 80;
const MARK_CORRECT_DEPTH = 10;
const MARK_PRESENT_ROTATION = '12deg';
const MARK_CORRECT_ROTATION = '-6deg';
// Frame-0 mark box, sized to roughly match the native splash mark (apps/mobile/assets/splash-icon-dark.png,
// generated at ADAPTIVE_SAFE_ZONE_SCALE 0.58 of a 1024 px canvas, so a touch over half the canvas
// width) so the intro doesn't visibly jump in size the instant it takes over from the splash.
// Not pixel-measured against a device; documented assumption, not a verified match.
const MARK_BOX_SIZE = 140;
const MARK_PRESENT_LEFT = 65;
const MARK_PRESENT_TOP = 24;
const MARK_CORRECT_LEFT = 30;
const MARK_CORRECT_TOP = 40;
// The wordmark "gathers" by sliding "harf"/"hane" in from opposite sides as it fades in, instead
// of animating `letterSpacing` (not supported by the native animated module, see Wordmark below).
const WORDMARK_GATHER_OFFSET = 14;
const ACCESSIBILITY_LABEL = 'Harfhane';
const ACCESSIBILITY_HINT = 'Ana ekrana geçmek için dokunun';

function useFade(active: boolean, durationMs: number) {
  const [value] = useState(() => new Animated.Value(active ? 1 : 0));
  useEffect(() => {
    Animated.timing(value, { toValue: active ? 1 : 0, duration: durationMs, useNativeDriver: true }).start();
  }, [active, durationMs, value]);
  return value;
}

function phaseAtLeast(phase: LaunchIntroPhase, target: LaunchIntroPhase): boolean {
  const order: readonly LaunchIntroPhase[] = ['mark', 'tiles', 'wordmark', 'crossfade', 'done'];
  return order.indexOf(phase) >= order.indexOf(target);
}

function LaunchMark({ opacity }: { readonly opacity: Animated.Value }) {
  const scale = opacity.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  return (
    <Animated.View style={[styles.markBox, { transform: [{ scale }] }]} importantForAccessibility="no-hide-descendants">
      <View style={[styles.markPresent, { transform: [{ rotate: MARK_PRESENT_ROTATION }] }]}>
        <DepthTile
          fill={DARK_COLORS.present}
          foreground={DARK_COLORS.presentFg}
          depthColor={DARK_COLORS.presentDepth}
          size={MARK_PRESENT_SIZE}
          depth={MARK_PRESENT_DEPTH}
        />
      </View>
      <View style={[styles.markCorrect, { transform: [{ rotate: MARK_CORRECT_ROTATION }] }]}>
        <DepthTile
          letter="H"
          fill={DARK_COLORS.correct}
          foreground={DARK_COLORS.correctFg}
          depthColor={DARK_COLORS.correctDepth}
          size={MARK_CORRECT_SIZE}
          depth={MARK_CORRECT_DEPTH}
          letterFontSize={FONT_SIZE.display}
        />
      </View>
    </Animated.View>
  );
}

function IntroRow({ tiles, startDelayMs, celebrate }: { readonly tiles: readonly IntroTile[]; readonly startDelayMs: number; readonly celebrate: boolean }) {
  return (
    <View style={styles.row}>
      {tiles.map((tile, index) => (
        <Tile
          key={tile.letter + index}
          letter={tile.letter}
          status={tile.status}
          isFilled
          isRevealing
          revealDelayMs={startDelayMs + index * LAUNCH_INTRO_TIMING.ROW_STAGGER_MS}
          celebrate={celebrate}
          celebrateDelayMs={index * LAUNCH_INTRO_TIMING.BOUNCE_STAGGER_MS}
          size={INTRO_TILE_SIZE}
        />
      ))}
    </View>
  );
}

function IntroTiles({ row2Celebrate }: { readonly row2Celebrate: boolean }) {
  const { TILE_REVEAL_START_MS, ROW2_START_MS } = LAUNCH_INTRO_TIMING;
  return (
    <View importantForAccessibility="no-hide-descendants">
      <IntroRow tiles={ROW1} startDelayMs={TILE_REVEAL_START_MS} celebrate={false} />
      <IntroRow tiles={ROW2} startDelayMs={TILE_REVEAL_START_MS + ROW2_START_MS} celebrate={row2Celebrate} />
    </View>
  );
}

// Gathers "harf"/"hane" in from opposite sides as the wordmark fades in. Uses `transform:
// translateX` + the layer's own opacity (both native-driver-safe) instead of animating
// `letterSpacing` directly: letterSpacing is not an animatable native prop, and the previous
// version warned "Style property 'letterSpacing' is not supported by native animated module" on
// every run.
function Wordmark({ opacity }: { readonly opacity: Animated.Value }) {
  const gather = opacity.interpolate({ inputRange: [0, 1], outputRange: [WORDMARK_GATHER_OFFSET, 0] });
  const gatherFromLeft = Animated.multiply(gather, -1);
  return (
    <View style={styles.wordmark} importantForAccessibility="no-hide-descendants">
      <View style={styles.wordmarkRow}>
        <Animated.Text style={[styles.wordmarkText, { color: DARK_COLORS.brand, transform: [{ translateX: gatherFromLeft }] }]}>
          harf
        </Animated.Text>
        <Animated.Text style={[styles.wordmarkText, { color: DARK_COLORS.text, transform: [{ translateX: gather }] }]}>
          hane
        </Animated.Text>
      </View>
      <AppText role="bodyLarge" color={DARK_COLORS.textMuted} style={styles.subtitle}>
        Her gün yeni bir kelime
      </AppText>
    </View>
  );
}

/**
 * The cold-start launch intro (owner decision 2026-10-09, mobile-redesign-spec.md section A):
 * the two-tile brand mark shrinks away, a FARK/HARF mini reveal plays with the game's own tile
 * flip language, the wordmark gathers in, then the screen cross-fades to the real home screen
 * already mounted underneath. Decorative: exposes one accessible label and is always skippable.
 */
export function LaunchIntro({ onDone }: LaunchIntroProps) {
  const reduceMotion = useReduceMotion();
  const { phase, row2Celebrate, skip } = useLaunchIntroPhases(reduceMotion, onDone);

  const markOpacity = useFade(phase === 'mark', LAUNCH_INTRO_TIMING.MARK_MS);
  const tilesOpacity = useFade(phaseAtLeast(phase, 'tiles') && !phaseAtLeast(phase, 'wordmark'), LAUNCH_INTRO_TIMING.MARK_MS);
  const wordmarkOpacity = useFade(phaseAtLeast(phase, 'wordmark'), LAUNCH_INTRO_TIMING.WORDMARK_MS);
  const overlayOpacity = useFade(!phaseAtLeast(phase, 'crossfade'), LAUNCH_INTRO_TIMING.CROSSFADE_MS);

  if (phase === 'done') return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: DARK_COLORS.bg }]}>
      <Pressable
        style={styles.pressable}
        onPress={skip}
        accessible
        accessibilityRole="button"
        accessibilityLabel={ACCESSIBILITY_LABEL}
        accessibilityHint={ACCESSIBILITY_HINT}
        testID="launch-intro"
      >
        {/* Forces Tile and AppText (both normally theme-aware) into the fixed dark palette the
            intro always plays in, independent of the device's current theme. */}
        <ThemeContext.Provider value={DARK_THEME_CONTEXT}>
          <Animated.View style={[styles.layer, { opacity: markOpacity }]}>
            <LaunchMark opacity={markOpacity} />
          </Animated.View>
          <Animated.View style={[styles.layer, { opacity: tilesOpacity }]}>
            <IntroTiles row2Celebrate={row2Celebrate} />
          </Animated.View>
          <Animated.View style={[styles.layer, { opacity: wordmarkOpacity }]}>
            <Wordmark opacity={wordmarkOpacity} />
          </Animated.View>
        </ThemeContext.Provider>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  pressable: { flex: 1 },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  markBox: { width: MARK_BOX_SIZE, height: MARK_BOX_SIZE },
  markPresent: { position: 'absolute', left: MARK_PRESENT_LEFT, top: MARK_PRESENT_TOP },
  markCorrect: { position: 'absolute', left: MARK_CORRECT_LEFT, top: MARK_CORRECT_TOP },
  row: { flexDirection: 'row', gap: SPACING.sm, marginVertical: SPACING.xs },
  wordmark: { alignItems: 'center' },
  wordmarkRow: { flexDirection: 'row' },
  wordmarkText: { fontFamily: FONT_FAMILY_DISPLAY, fontSize: FONT_SIZE.display },
  subtitle: { marginTop: SPACING.xs },
});
