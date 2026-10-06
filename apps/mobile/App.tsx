// Imported from the single-weight subpath, not the package root, so Metro
// doesn't bundle the other four Baloo 2 weights this app never uses.
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import { useFonts } from '@expo-google-fonts/baloo-2/useFonts';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { deviceStore } from './src/game/device-store';
import { ThemeProvider, useTheme } from './src/ThemeProvider';
import { api } from './src/lib/api';
import { resolveSelectedLength, usePlayableLengths } from './src/lib/playable-lengths';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HowToPlayScreen } from './src/screens/HowToPlayScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsContainer } from './src/screens/StatsContainer';
import { canGoBack, createInitialNavigationState, currentRoute, reduceNavigation } from './src/navigation/routes';
import { useHardwareBackHandler } from './src/navigation/useHardwareBackHandler';
import type { HomeScreenMode } from './src/screens/HomeScreen';
import type { Route } from './src/navigation/routes';
import type { WordLength } from './src/stats/stats';

// R6/AE4: hold the native splash until the theme, stored game state and
// fonts are loaded, instead of letting it auto-hide on the first frame.
// Must run at module load, before any component mounts.
void SplashScreen.preventAutoHideAsync();

interface RouteViewProps {
  readonly route: Route;
  readonly selectedLength: WordLength;
  readonly playableLengths: readonly WordLength[];
  readonly onSelectLength: (length: WordLength) => void;
  readonly onStart: (mode: HomeScreenMode, length: WordLength) => void;
  readonly onOpenHowToPlay: () => void;
  readonly onOpenSettings: () => void;
  readonly onOpenStats: (length: WordLength) => void;
  readonly onBack: () => void;
}

function RouteView({
  route,
  selectedLength,
  playableLengths,
  onSelectLength,
  onStart,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenStats,
  onBack,
}: RouteViewProps) {
  if (route.screen === 'game') {
    return <GameScreen mode={route.mode} wordLength={route.length} onBack={onBack} api={api} store={deviceStore} />;
  }
  if (route.screen === 'howToPlay') return <HowToPlayScreen onClose={onBack} />;
  if (route.screen === 'settings') return <SettingsScreen onClose={onBack} />;
  if (route.screen === 'stats') return <StatsContainer length={route.length} store={deviceStore} onClose={onBack} />;
  return (
    <HomeScreen
      selectedLength={selectedLength}
      playableLengths={playableLengths}
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
  const playableLengths = usePlayableLengths(api, deviceStore);
  // null means "no explicit pick yet"; resolveSelectedLength also falls
  // back whenever a previous pick stops being playable (derived, not an
  // effect, to avoid a redundant render).
  const [pickedLength, setPickedLength] = useState<WordLength | null>(null);
  const selectedLength = resolveSelectedLength(pickedLength, playableLengths);
  const route = currentRoute(state);

  const handleHardwareBack = useCallback(() => {
    if (!canGoBack(state)) return false;
    dispatch({ type: 'back' });
    return true;
  }, [state]);
  useHardwareBackHandler(handleHardwareBack);

  // AppNavigator only mounts once ThemeProvider has finished loading the
  // stored theme preference (R6/AE4), so this effect firing is itself the
  // "theme and stored state are ready" signal; fonts are gated separately
  // in App() below, before this tree is even mounted.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

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
        playableLengths={playableLengths}
        onSelectLength={setPickedLength}
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
  const [fontsLoaded, fontsError] = useFonts({ Baloo2_800ExtraBold });
  // Keeps the splash up until Baloo 2 is ready, so ThemeProvider (and its
  // own stored-state gate below) never mount with the fallback font. A
  // permanent font-loading error still lets the app through (system font
  // fallback) instead of holding the splash forever.
  if (!fontsLoaded && !fontsError) return null;

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
