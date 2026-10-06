import { StatusBar } from 'expo-status-bar';
import { useCallback, useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { deviceStore } from './src/game/device-store';
import { ThemeProvider, useTheme } from './src/ThemeProvider';
import { api } from './src/lib/api';
import { GameScreen } from './src/screens/GameScreen';
import { DEFAULT_WORD_LENGTH, HomeScreen } from './src/screens/HomeScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsContainer } from './src/screens/StatsContainer';
import { canGoBack, createInitialNavigationState, currentRoute, reduceNavigation } from './src/navigation/routes';
import { useHardwareBackHandler } from './src/navigation/useHardwareBackHandler';
import type { HomeScreenMode } from './src/screens/HomeScreen';
import type { Route } from './src/navigation/routes';
import type { WordLength } from './src/stats/stats';

interface RouteViewProps {
  readonly route: Route;
  readonly selectedLength: WordLength;
  readonly onSelectLength: (length: WordLength) => void;
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
  readonly onOpenHowToPlay: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenStats: (length: WordLength) => void;
  readonly onBack: () => void;
}

function RouteView({ route, selectedLength, onSelectLength, onStart, onOpenHowToPlay, onOpenSettings, onOpenStats, onBack }: RouteViewProps) {
  if (route.screen === 'game') {
    return <GameScreen mode={route.mode} wordLength={route.length} onBack={onBack} api={api} store={deviceStore} />;
  }
  if (route.screen === 'howToPlay') return <HowToPlayScreen onClose={onBack} />;
  if (route.screen === 'settings') return <SettingsScreen onClose={onBack} />;
  if (route.screen === 'stats') return <StatsContainer length={route.length} store={deviceStore} onClose={onBack} />;
  return (
    <HomeScreen
      selectedLength={selectedLength}
      onSelectLength={onSelectLength}
      onStart={onStart}
      onOpenHowToPlay={onOpenHowToPlay}
      onOpenSettings={onOpenSettings}
      onOpenStats={onOpenStats}
    />
  );
}

export function AppNavigator() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, dispatch] = useReducer(reduceNavigation, undefined, createInitialNavigationState);
  const [selectedLength, setSelectedLength] = useState<WordLength>(DEFAULT_WORD_LENGTH);
  const route = currentRoute(state);

  const handleHardwareBack = useCallback(() => {
    if (!canGoBack(state)) return false;
    dispatch({ type: 'back' });
    return true;
  }, [state]);
  useHardwareBackHandler(handleHardwareBack);

  const handleStart = useCallback(
    (mode: HomeScreenMode, length: WordLength) => dispatch({ type: 'push', route: { screen: 'game', mode, length } }),
    [],
  );
  const handleOpenHowToPlay = useCallback(() => dispatch({ type: 'push', route: { screen: 'howToPlay' } }), []);
  const handleOpenSettings = useCallback(() => dispatch({ type: 'push', route: { screen: 'settings' } }), []);
  const handleOpenStats = useCallback((length: WordLength) => dispatch({ type: 'push', route: { screen: 'stats', length } }), []);
  const handleBack = useCallback(() => dispatch({ type: 'back' }), []);

  const insetStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, insetStyle]} testID="app-safe-area-container">
      <RouteView
        route={route}
        selectedLength={selectedLength}
        onSelectLength={setSelectedLength}
        onStart={handleStart}
        onOpenHowToPlay={handleOpenHowToPlay}
        onOpenSettings={handleOpenSettings}
        onOpenStats={handleOpenStats}
        onBack={handleBack}
      />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider store={deviceStore}>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
