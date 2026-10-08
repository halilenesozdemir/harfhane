import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { CONTENT_MAX_WIDTH, FONT_FAMILY_DISPLAY, FONT_SIZE, RADIUS, SCREEN_PADDING, SPACING } from '../ui/layout';
import type { ThemeColors } from '../theme';
import type { WordLength } from '../stats/stats';

export type HomeScreenMode = 'daily' | 'unlimited';

export interface HomeScreenProps {
  readonly selectedLength: WordLength;
  readonly onSelectLength: (length: WordLength) => void;
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
  readonly onOpenHowToPlay: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenStats: (length: WordLength) => void;
  /** R1: lengths the unlimited-mode picker offers; defaults to every scheduled length. */
  readonly playableLengths?: readonly WordLength[];
}

export const DEFAULT_WORD_LENGTH: WordLength = 5;
const SCHEDULED_WORD_LENGTHS: readonly WordLength[] = [4, 5, 6];
const LENGTH_OPTION_HEIGHT = 36;

// R5: the home title is an H-A-R-F tile row, matching the web splash
// screen's brand mark (apps/frontend/src/components/SplashScreen.tsx)
// instead of a plain "HARFHANE" wordmark.
const TITLE_LETTERS = ['H', 'A', 'R', 'F'] as const;
const TITLE_TILE_SIZE = 40;
// Plan 011 U7c prep: matches the redesigned hero's label ahead of that cutover.
const TITLE_ACCESSIBILITY_LABEL = 'Harfhane';
// Caps how far the title letters scale with the system font setting so they
// never overflow the fixed-size tile.
const TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.2;

function titleTileColor(colors: ThemeColors, index: number): string {
  return index % 2 === 0 ? colors.correct : colors.present;
}

// Each tile's text uses the fg token for its own background, not a single
// shared one: correct's fg is white, present's is a dark token, since
// present's background is light (WCAG contrast, not a cosmetic choice).
function titleTileFg(colors: ThemeColors, index: number): string {
  return index % 2 === 0 ? colors.correctFg : colors.presentFg;
}

function HomeTitle() {
  const { colors } = useTheme();
  return (
    <View
      style={styles.titleRow}
      accessible
      accessibilityRole="header"
      accessibilityLabel={TITLE_ACCESSIBILITY_LABEL}
      testID="home-title-row"
    >
      {TITLE_LETTERS.map((letter, index) => (
        <View key={letter} style={[styles.titleTile, { backgroundColor: titleTileColor(colors, index) }]}>
          <Text
            style={[styles.titleTileLabel, { color: titleTileFg(colors, index) }]}
            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
          >
            {letter}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function HomeScreen({
  selectedLength,
  onSelectLength,
  onStart,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenStats,
  playableLengths = SCHEDULED_WORD_LENGTHS,
}: HomeScreenProps) {
  const { colors } = useTheme();

  const handleStartDaily = useCallback(() => onStart('daily', selectedLength), [onStart, selectedLength]);
  const handleStartUnlimited = useCallback(() => onStart('unlimited', selectedLength), [onStart, selectedLength]);
  const handleOpenStats = useCallback(() => onOpenStats(selectedLength), [onOpenStats, selectedLength]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <HomeTitle />
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Türkçe kelime oyunu</Text>

      <Pressable
        testID="home-daily-card"
        accessibilityRole="button"
        accessibilityLabel={`Günlük oyunu ${selectedLength} harfle başlat`}
        onPress={handleStartDaily}
        style={[styles.card, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.cardTitle, { color: colors.correctFg }]}>Günlük Oyun</Text>
        <Text style={[styles.cardBody, { color: colors.correctFg }]}>
          {`Günün ${selectedLength} harfli kelimesi. Herkes aynı kelimeyi çözer.`}
        </Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sınırsız modu ${selectedLength} harfle başlat`}
          onPress={handleStartUnlimited}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sınırsız Mod</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Dilediğin kadar oyna. Her seferinde yeni kelime.
          </Text>
        </Pressable>
        {playableLengths.length > 1 && (
          <View style={styles.lengthRow}>
            {playableLengths.map((length) => (
              <LengthOption key={length} length={length} isSelected={selectedLength === length} onSelect={onSelectLength} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.menuRow}>
        <MenuLink label="Nasıl oynanır" accessibilityLabel="Nasıl oynanır sayfasını aç" onPress={onOpenHowToPlay} />
        <MenuLink label="İstatistikler" accessibilityLabel="İstatistikleri aç" onPress={handleOpenStats} />
        <MenuLink label="Ayarlar" accessibilityLabel="Ayarları aç" onPress={onOpenSettings} />
      </View>
    </View>
  );
}

interface MenuLinkProps {
  readonly label: string;
  /** Plan 011 U7c prep: matches the redesigned top bar's icon-button label ahead of that cutover. */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

function MenuLink({ label, accessibilityLabel, onPress }: MenuLinkProps) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.menuLink}>
      <Text style={[styles.menuLinkLabel, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

interface LengthOptionProps {
  readonly length: WordLength;
  readonly isSelected: boolean;
  readonly onSelect: (length: WordLength) => void;
}

function LengthOption({ length, isSelected, onSelect }: LengthOptionProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onSelect(length), [onSelect, length]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${length} harfli kelime seç`}
      accessibilityState={{ selected: isSelected }}
      onPress={handlePress}
      style={[styles.lengthOption, { backgroundColor: isSelected ? colors.brand : colors.tileEmptyBg }]}
    >
      <Text style={[styles.lengthLabel, { color: isSelected ? colors.brandFg : colors.textMuted }]}>
        {length} harf
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SCREEN_PADDING,
    gap: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  titleTile: {
    width: TITLE_TILE_SIZE,
    height: TITLE_TILE_SIZE,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTileLabel: {
    fontFamily: FONT_FAMILY_DISPLAY,
    fontSize: FONT_SIZE.title,
  },
  subtitle: {
    fontSize: FONT_SIZE.bodyLarge,
    marginBottom: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY_DISPLAY,
    fontSize: FONT_SIZE.title,
    marginBottom: SPACING.xs,
  },
  cardBody: {
    fontSize: FONT_SIZE.body,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  lengthOption: {
    flex: 1,
    height: LENGTH_OPTION_HEIGHT,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.lg,
  },
  menuLink: {
    padding: SPACING.sm,
  },
  menuLinkLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
});
