import { CalendarDays, CircleCheck, CircleX, Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { DepthTile } from '../ui/DepthTile';
import { AppText } from '../ui/Typography';
import { DEPTH, ICON_SIZE, RADIUS, SPACING } from '../ui/layout';
import type { ButtonVariant } from '../ui/Button';
import type { ThemeColors } from '../theme';
import type { WordLength } from '../stats/stats';
import type { TodayState, TodayStatus } from './today-status';

export interface DailyCardProps {
  readonly wordLength: WordLength;
  /** Null while the stored stats and daily game state are still loading. */
  readonly status: TodayStatus | null;
  readonly countdown: string;
  readonly onPress: () => void;
}

const ICON_TILE_SIZE = 48;
const STATUS_ROW_MIN_HEIGHT = 28;

function dailyCta(state: TodayState | null): { readonly label: string; readonly variant: ButtonVariant } {
  if (state === null || state.kind === 'not-started') return { label: 'Oyna', variant: 'primary' };
  if (state.kind === 'in-progress') return { label: 'Devam et', variant: 'primary' };
  return { label: 'Sonucu gör', variant: 'secondary' };
}

function dailyAccessibilityLabel(length: WordLength, state: TodayState | null): string {
  const base = `Günlük oyun, ${length} harf`;
  if (state === null || state.kind === 'not-started') return `${base}, yeni kelime hazır`;
  if (state.kind === 'in-progress') return `${base}, ${state.guesses}/6 tahmin`;
  if (state.kind === 'won') return `${base}, bugün çözüldü, ${state.guesses}/6`;
  return `${base}, bugün çözülemedi`;
}

function StatusRow({ state, countdown, colors }: { state: TodayState | null; countdown: string; colors: ThemeColors }) {
  if (state === null) return null;
  if (state.kind === 'not-started') return <Chip variant="status" label="Yeni kelime hazır" />;
  if (state.kind === 'in-progress') return <Chip variant="status" label={`${state.guesses}/6 tahmin`} />;
  const isWon = state.kind === 'won';
  const resultIcon: ReactNode = isWon ? (
    <CircleCheck size={ICON_SIZE.sm} color={colors.correctText} />
  ) : (
    <CircleX size={ICON_SIZE.sm} color={colors.textMuted} />
  );
  const resultLabel = isWon ? `Çözüldü · ${state.guesses}/6` : 'Bu sefer olmadı';
  return (
    <>
      <Chip variant="status" icon={resultIcon} label={resultLabel} color={isWon ? colors.correctText : undefined} />
      <Chip variant="status" icon={<Clock size={ICON_SIZE.sm} color={colors.textMuted} />} label={countdown} />
    </>
  );
}

/** The daily mode card (mobile-redesign-spec.md section B): one pressable target whose status row and CTA follow `getTodayStatus`. */
export function DailyCard({ wordLength, status, countdown, onPress }: DailyCardProps) {
  const { colors } = useTheme();
  const cta = dailyCta(status?.state ?? null);

  return (
    <Card onPress={onPress} accessibilityLabel={dailyAccessibilityLabel(wordLength, status?.state ?? null)} padding={SPACING.xl} testID="home-daily-card">
      <View style={styles.header}>
        <DepthTile
          icon={<CalendarDays size={ICON_SIZE.lg} color={colors.correctFg} />}
          fill={colors.correct}
          foreground={colors.correctFg}
          depthColor={colors.correctDepth}
          size={ICON_TILE_SIZE}
          depth={DEPTH.sm}
          radius={RADIUS.md}
        />
        <View style={styles.titleColumn}>
          <AppText role="title">Günlük</AppText>
          <AppText role="body" color={colors.textMuted}>{`Günün ${wordLength} harfli kelimesi`}</AppText>
        </View>
      </View>
      <View style={styles.statusRow} testID="home-daily-status-row">
        <StatusRow state={status?.state ?? null} countdown={countdown} colors={colors} />
      </View>
      <Button label={cta.label} variant={cta.variant} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  titleColumn: { flex: 1, gap: SPACING.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, minHeight: STATUS_ROW_MIN_HEIGHT, marginBottom: SPACING.lg },
});
