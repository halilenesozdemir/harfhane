import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { StatsScreen } from './StatsScreen';
import type { StatsMode } from './StatsScreen';
import { loadDailyStats, loadUnlimitedStats } from '../stats/stats';
import type { DailyStats, UnlimitedStats, WordLength } from '../stats/stats';
import type { KeyValueStore } from '../game/game-storage';

export interface StatsContainerProps {
  readonly length: WordLength;
  readonly store: KeyValueStore;
  readonly onClose: () => void;
}

interface LoadedStats {
  readonly daily: DailyStats;
  readonly unlimited: UnlimitedStats;
}

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
    <StatsScreen
      stats={stats}
      isUnlimited={mode === 'unlimited'}
      wordLength={length}
      mode={mode}
      onModeChange={setMode}
      onClose={onClose}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
