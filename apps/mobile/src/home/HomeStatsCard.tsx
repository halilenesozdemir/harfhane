import { Flame } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Card } from '../ui/Card';
import { AppText } from '../ui/Typography';
import { ICON_SIZE, SPACING } from '../ui/layout';
import { winPercentage } from '../stats/win-percentage';
import type { DailyStats } from '../stats/stats';

export interface HomeStatsCardProps {
  /** The streak as the home screen shows it (already reset when a day was missed). */
  readonly displayedStreak: number;
  readonly stats: DailyStats;
  readonly onPress: () => void;
}

const EMPTY_MESSAGE = 'İlk oyununu bitir, serin burada başlasın';

interface StatItem {
  readonly value: string;
  readonly label: string;
}

function statItems(displayedStreak: number, stats: DailyStats): readonly StatItem[] {
  return [
    { value: String(displayedStreak), label: 'Seri' },
    { value: String(stats.maxStreak), label: 'En iyi seri' },
    { value: `%${winPercentage(stats)}`, label: 'Kazanma' },
    { value: String(stats.gamesPlayed), label: 'Oyun' },
  ];
}

function accessibilityLabel(displayedStreak: number, stats: DailyStats): string {
  if (stats.gamesPlayed === 0) return `İstatistikler. ${EMPTY_MESSAGE}`;
  return `İstatistikler: seri ${displayedStreak}, en iyi seri ${stats.maxStreak}, kazanma yüzde ${winPercentage(stats)}, ${stats.gamesPlayed} oyun`;
}

/** A compact daily stats summary under the mode cards; the streak is the main reason to come back tomorrow. */
export function HomeStatsCard({ displayedStreak, stats, onPress }: HomeStatsCardProps) {
  const { colors } = useTheme();

  return (
    <Card onPress={onPress} accessibilityLabel={accessibilityLabel(displayedStreak, stats)} testID="home-stats-card">
      {stats.gamesPlayed === 0 ? (
        <View style={styles.emptyRow}>
          <Flame size={ICON_SIZE.md} color={colors.textMuted} />
          <AppText role="body" color={colors.textMuted} style={styles.emptyText}>
            {EMPTY_MESSAGE}
          </AppText>
        </View>
      ) : (
        <View style={styles.statsRow}>
          {statItems(displayedStreak, stats).map((item, index) => (
            <View key={item.label} style={styles.statItem}>
              <View style={styles.valueRow}>
                {index === 0 ? <Flame size={ICON_SIZE.sm} color={colors.text} /> : null}
                <AppText role="title">{item.value}</AppText>
              </View>
              <AppText role="caption" color={colors.textMuted}>
                {item.label}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  emptyText: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
});
