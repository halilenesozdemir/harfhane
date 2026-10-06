import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { CONTENT_MAX_WIDTH, FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { WordLength } from '../stats/stats';

export type HomeScreenMode = 'daily' | 'unlimited';

export interface HomeScreenProps {
  readonly selectedLength: WordLength;
  readonly onSelectLength: (length: WordLength) => void;
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
  readonly onOpenHowToPlay: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenStats: (length: WordLength) => void;
}

export const DEFAULT_WORD_LENGTH: WordLength = 5;
const UNLIMITED_LENGTHS: readonly WordLength[] = [4, 5, 6];
const TITLE_LETTER_SPACING = 2;
const LENGTH_OPTION_HEIGHT = 36;

export function HomeScreen({ selectedLength, onSelectLength, onStart, onOpenHowToPlay, onOpenSettings, onOpenStats }: HomeScreenProps) {
  const { colors } = useTheme();

  const handleStartDaily = useCallback(() => onStart('daily', selectedLength), [onStart, selectedLength]);
  const handleStartUnlimited = useCallback(() => onStart('unlimited', selectedLength), [onStart, selectedLength]);
  const handleOpenStats = useCallback(() => onOpenStats(selectedLength), [onOpenStats, selectedLength]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>HARFHANE</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Türkçe kelime oyunu</Text>

      <Pressable
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
        <View style={styles.lengthRow}>
          {UNLIMITED_LENGTHS.map((length) => (
            <LengthOption key={length} length={length} isSelected={selectedLength === length} onSelect={onSelectLength} />
          ))}
        </View>
      </View>

      <View style={styles.menuRow}>
        <MenuLink label="Nasıl oynanır" onPress={onOpenHowToPlay} />
        <MenuLink label="İstatistikler" onPress={handleOpenStats} />
        <MenuLink label="Ayarlar" onPress={onOpenSettings} />
      </View>
    </View>
  );
}

interface MenuLinkProps {
  readonly label: string;
  readonly onPress: () => void;
}

function MenuLink({ label, onPress }: MenuLinkProps) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.menuLink}>
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
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.display,
    fontWeight: '800',
    letterSpacing: TITLE_LETTER_SPACING,
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
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
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
