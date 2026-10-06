import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { FONT_SIZE, RADIUS, SPACING } from '../ui/layout';
import { StatsScreen } from './StatsScreen';
import { loadDailyStats, loadUnlimitedStats } from '../stats/stats';
import type { DailyStats, UnlimitedStats, WordLength } from '../stats/stats';
import type { KeyValueStore } from '../game/game-storage';

export interface StatsContainerProps {
  readonly length: WordLength;
  readonly store: KeyValueStore;
  readonly onClose: () => void;
}

type StatsMode = 'daily' | 'unlimited';

interface LoadedStats {
  readonly daily: DailyStats;
  readonly unlimited: UnlimitedStats;
}

interface ModeOption {
  readonly value: StatsMode;
  readonly label: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  { value: 'daily', label: 'Günlük' },
  { value: 'unlimited', label: 'Sınırsız' },
];

function useLoadedStats(store: KeyValueStore, length: WordLength): LoadedStats | null {
  const [loaded, setLoaded] = useState<LoadedStats | null>(null);
  useEffect(() => {
    let isCurrent = true;
    Promise.all([loadDailyStats(store, length), loadUnlimitedStats(store, length)]).then(([daily, unlimited]) => {
      if (isCurrent) setLoaded({ daily, unlimited });
    });
    return () => {
      isCurrent = false;
    };
  }, [store, length]);
  return loaded;
}

interface ModeSegmentProps {
  readonly value: StatsMode;
  readonly label: string;
  readonly isActive: boolean;
  readonly onSelect: (value: StatsMode) => void;
}

function ModeSegment({ value, label, isActive, onSelect }: ModeSegmentProps) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={handlePress}
      style={[styles.segment, { backgroundColor: isActive ? colors.brand : colors.surface }]}
    >
      <Text style={[styles.segmentLabel, { color: isActive ? colors.brandFg : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function StatsContainer({ length, store, onClose }: StatsContainerProps) {
  const { colors } = useTheme();
  const loaded = useLoadedStats(store, length);
  const [mode, setMode] = useState<StatsMode>('daily');

  if (loaded === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator accessibilityLabel="İstatistikler yükleniyor" color={colors.brand} />
      </View>
    );
  }

  const stats = mode === 'daily' ? loaded.daily : loaded.unlimited;
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.segmentedControl}>
        {MODE_OPTIONS.map((option) => (
          <ModeSegment key={option.value} value={option.value} label={option.label} isActive={mode === option.value} onSelect={setMode} />
        ))}
      </View>
      <StatsScreen stats={stats} isUnlimited={mode === 'unlimited'} onClose={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  segmentedControl: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg },
  segment: { flex: 1, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  segmentLabel: { fontSize: FONT_SIZE.body, fontWeight: '700' },
});
