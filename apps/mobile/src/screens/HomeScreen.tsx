import { CircleQuestionMark, ChartColumn, Flame, Settings } from 'lucide-react-native';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { TopBar } from '../ui/TopBar';
import { IconButton } from '../ui/IconButton';
import { Chip } from '../ui/Chip';
import { AppText } from '../ui/Typography';
import { HomeHero } from '../home/HomeHero';
import { DailyCard } from '../home/DailyCard';
import { UnlimitedCard } from '../home/UnlimitedCard';
import { useHomeStatus } from '../home/useHomeStatus';
import { CONTENT_MAX_WIDTH, ICON_SIZE, SCREEN_PADDING, SPACING } from '../ui/layout';
import type { KeyValueStore } from '../game/game-storage';
import type { WordLength } from '../stats/stats';

export type HomeScreenMode = 'daily' | 'unlimited';

export interface HomeScreenProps {
  readonly selectedLength: WordLength;
  readonly onSelectLength: (length: WordLength) => void;
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
  readonly onOpenHowToPlay: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenStats: (length: WordLength) => void;
  readonly store: KeyValueStore;
  /** R1: lengths the unlimited-mode picker offers; defaults to every scheduled length. */
  readonly playableLengths?: readonly WordLength[];
  /** Injectable clock for `useHomeStatus` (tests only); defaults to the real time. */
  readonly now?: () => Date;
}

export const DEFAULT_WORD_LENGTH: WordLength = 5;
const SCHEDULED_WORD_LENGTHS: readonly WordLength[] = [4, 5, 6];

function streakAccessibilityLabel(length: WordLength, streak: number): string {
  return `${length} harf, ${streak} günlük seri`;
}

function LengthPicker({
  playableLengths,
  selectedLength,
  onSelectLength,
}: {
  playableLengths: readonly WordLength[];
  selectedLength: WordLength;
  onSelectLength: (length: WordLength) => void;
}) {
  if (playableLengths.length <= 1) return null;
  return (
    <View style={styles.lengthRow} accessibilityLabel="Kelime uzunluğu" testID="home-length-row">
      {playableLengths.map((length) => (
        <Chip
          key={length}
          variant="length"
          label={`${length} harf`}
          selected={selectedLength === length}
          accessibilityLabel={`${length} harfli kelime seç`}
          onPress={() => onSelectLength(length)}
        />
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
  store,
  playableLengths = SCHEDULED_WORD_LENGTHS,
  now,
}: HomeScreenProps) {
  const { colors } = useTheme();
  const { status } = useHomeStatus(store, selectedLength, now);
  const isDailyFinished = status !== null && (status.state.kind === 'won' || status.state.kind === 'lost');
  const displayedStreak = status?.displayedStreak ?? 0;

  const handleStartDaily = useCallback(() => onStart('daily', selectedLength), [onStart, selectedLength]);
  const handleStartUnlimited = useCallback(() => onStart('unlimited', selectedLength), [onStart, selectedLength]);
  const handleOpenStats = useCallback(() => onOpenStats(selectedLength), [onOpenStats, selectedLength]);

  const streakChip =
    displayedStreak > 0 ? (
      <Chip
        variant="streak"
        icon={<Flame size={ICON_SIZE.sm} color={colors.text} />}
        label={String(displayedStreak)}
        accessibilityLabel={streakAccessibilityLabel(selectedLength, displayedStreak)}
        onPress={handleOpenStats}
      />
    ) : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        variant="home"
        leading={streakChip}
        trailing={[
          <IconButton key="help" icon={<CircleQuestionMark size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Nasıl oynanır sayfasını aç" onPress={onOpenHowToPlay} />,
          <IconButton key="stats" icon={<ChartColumn size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="İstatistikleri aç" onPress={handleOpenStats} />,
          <IconButton key="settings" icon={<Settings size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel="Ayarları aç" onPress={onOpenSettings} />,
        ]}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <HomeHero />
          <AppText role="bodyLarge" color={colors.textMuted}>
            Türkçe kelime oyunu
          </AppText>
          <DailyCard wordLength={selectedLength} status={status} now={now} onPress={handleStartDaily} />
          <LengthPicker playableLengths={playableLengths} selectedLength={selectedLength} onSelectLength={onSelectLength} />
          <UnlimitedCard wordLength={selectedLength} isDailyFinished={isDailyFinished} onPress={handleStartUnlimited} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingHorizontal: SCREEN_PADDING, paddingBottom: SPACING.xxxl },
  content: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, gap: SPACING.xxl },
  lengthRow: { flexDirection: 'row', gap: SPACING.sm },
});
