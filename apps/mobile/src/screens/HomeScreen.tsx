import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { WordLength } from '../stats/stats';

export type HomeScreenMode = 'daily' | 'unlimited';

export interface HomeScreenProps {
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
}

const DAILY_WORD_LENGTH: WordLength = 5;
const UNLIMITED_LENGTHS: readonly WordLength[] = [4, 5, 6];

export function HomeScreen({ onStart }: HomeScreenProps) {
  const { colors } = useTheme();
  const [selectedLength, setSelectedLength] = useState<WordLength>(DAILY_WORD_LENGTH);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>HARFHANE</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Türkçe kelime oyunu</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Günlük oyunu başlat"
        onPress={() => onStart('daily', DAILY_WORD_LENGTH)}
        style={[styles.card, { backgroundColor: colors.correct }]}
      >
        <Text style={[styles.cardTitle, { color: colors.correctFg }]}>Günlük Oyun</Text>
        <Text style={[styles.cardBody, { color: colors.correctFg }]}>
          Günün 5 harfli kelimesi. Herkes aynı kelimeyi çözer.
        </Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sınırsız modu ${selectedLength} harfle başlat`}
          onPress={() => onStart('unlimited', selectedLength)}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sınırsız Mod</Text>
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Dilediğin kadar oyna. Her seferinde yeni kelime.
          </Text>
        </Pressable>
        <View style={styles.lengthRow}>
          {UNLIMITED_LENGTHS.map((length) => (
            <LengthOption
              key={length}
              length={length}
              isSelected={selectedLength === length}
              onSelect={() => setSelectedLength(length)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

interface LengthOptionProps {
  readonly length: WordLength;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}

function LengthOption({ length, isSelected, onSelect }: LengthOptionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${length} harfli kelime seç`}
      accessibilityState={{ selected: isSelected }}
      onPress={onSelect}
      style={[
        styles.lengthOption,
        { backgroundColor: isSelected ? colors.brand : colors.tileEmptyBg },
      ]}
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
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  lengthOption: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
