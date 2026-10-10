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
import { loadHasSeenHowToPlay, markHowToPlaySeen } from './src/first-launch-store';
import { LaunchIntro } from './src/components/LaunchIntro';
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
  readonly isHowToPlayFirstLaunch: boolean;
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
  isHowToPlayFirstLaunch,
}: RouteViewProps) {
  if (route.screen === 'game') {
    return <GameScreen mode={route.mode} wordLength={route.length} onBack={onBack} api={api} store={deviceStore} />;
  }
  if (route.screen === 'howToPlay') return <HowToPlayScreen onClose={onBack} isFirstLaunch={isHowToPlayFirstLaunch} />;
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
      store={deviceStore}
    />
  );
}

// R7/AE5: whether the how-to-play-seen flag has finished loading, and what
// it said. Loading starts as "not seen" so a rejecting read never blocks
// the gate open (see first-launch-store.ts); FirstLaunchGate below renders
// nothing until isLoaded, so AppNavigator only ever mounts with the real,
// already-settled answer — never an optimistic guess to correct later.
interface HowToPlayGate {
  readonly isLoaded: boolean;
  readonly hasSeenHowToPlay: boolean;
}

const INITIAL_HOW_TO_PLAY_GATE: HowToPlayGate = { isLoaded: false, hasSeenHowToPlay: false };

function useHowToPlayGate(): [HowToPlayGate, () => void] {
  const [gate, setGate] = useState<HowToPlayGate>(INITIAL_HOW_TO_PLAY_GATE);

  useEffect(() => {
    let isCurrent = true;
    void loadHasSeenHowToPlay(deviceStore).then((hasSeenHowToPlay) => {
      if (!isCurrent) return;
      setGate({ isLoaded: true, hasSeenHowToPlay });
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    // A failed write just means How to play shows again next launch —
    // never worth crashing the close action over.
    void markHowToPlaySeen(deviceStore).catch(() => undefined);
    setGate((current) => ({ ...current, hasSeenHowToPlay: true }));
  }, []);

  return [gate, markSeen];
}

// R6/AE4 + R7/AE5: renders nothing until the how-to-play-seen flag has
// loaded, holding the native splash up for it exactly like ThemeProvider
// (its parent here) already does for the theme preference. AppNavigator
// only ever mounts below with the real, settled flag value, so it never
// needs to correct an optimistic guess after the fact.
export function FirstLaunchGate() {
  const [howToPlayGate, markHowToPlaySeenOnce] = useHowToPlayGate();
  // Plan 011 U7d: the cold-start intro overlays AppNavigator (already mounted underneath, so
  // the home screen is ready the instant the intro cross-fades out) and renders itself once per
  // app lifetime — returning from the background never remounts FirstLaunchGate, so it never
  // replays.
  const [isIntroDone, setIsIntroDone] = useState(false);
  const handleIntroDone = useCallback(() => setIsIntroDone(true), []);

  useEffect(() => {
    if (!howToPlayGate.isLoaded) return;
    void SplashScreen.hideAsync();
  }, [howToPlayGate.isLoaded]);

  if (!howToPlayGate.isLoaded) return null;
  // While the intro overlay is up, AppNavigator is hidden from accessibility: it's already
  // mounted underneath (so home is ready the instant the intro cross-fades out, R6/AE4-style),
  // but its buttons are invisible and must not be reachable by TalkBack or Maestro, and the
  // Android hardware back handler (registered inside AppNavigator) must not pop navigation or
  // mark How to play seen while the intro is covering it (Plan 011 U7d AE5 regression).
  const isIntroActive = !isIntroDone;
  return (
    <>
      <View
        style={styles.flexFill}
        importantForAccessibility={isIntroActive ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={isIntroActive}
      >
        <AppNavigator
          hasSeenHowToPlay={howToPlayGate.hasSeenHowToPlay}
          onHowToPlaySeen={markHowToPlaySeenOnce}
          isIntroActive={isIntroActive}
        />
      </View>
      {isIntroActive ? <LaunchIntro onDone={handleIntroDone} /> : null}
    </>
  );
}

interface AppNavigatorProps {
  readonly hasSeenHowToPlay: boolean;
  readonly onHowToPlaySeen: () => void;
  /** Plan 011 U7d: while the launch intro covers the screen, the hardware back button must be
   * swallowed instead of popping navigation or marking How to play seen underneath it. */
  readonly isIntroActive?: boolean;
}

export function AppNavigator({ hasSeenHowToPlay, onHowToPlaySeen, isIntroActive = false }: AppNavigatorProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // hasSeenHowToPlay is only ever read here, as the reducer's one-time
  // initial-state decision; everything else below (the "Oynamaya başla"
  // vs. back-icon choice, the goBack handler) tracks its own local copy
  // instead of re-reading
  // this prop, so a later change to it can never retroactively alter a
  // decision this component already made on mount.
  const [state, dispatch] = useReducer(reduceNavigation, hasSeenHowToPlay, createInitialNavigationState);
  const [hasSeenHowToPlayLocally, setHasSeenHowToPlayLocally] = useState(hasSeenHowToPlay);
  const playableLengths = usePlayableLengths(api, deviceStore);
  // null means "no explicit pick yet"; resolveSelectedLength also falls
  // back whenever a previous pick stops being playable (derived, not an
  // effect, to avoid a redundant render).
  const [pickedLength, setPickedLength] = useState<WordLength | null>(null);
  const selectedLength = resolveSelectedLength(pickedLength, playableLengths);
  const route = currentRoute(state);

  // R7/AE5: going back out of How to play — from its own close/Oyna action
  // (RouteView's onBack, below) or the Android hardware back handler —
  // marks it seen exactly once, right in the handler that leaves the
  // route, not as a passive effect watching for the transition.
  const goBack = useCallback(() => {
    if (route.screen === 'howToPlay' && !hasSeenHowToPlayLocally) {
      setHasSeenHowToPlayLocally(true);
      onHowToPlaySeen();
    }
    dispatch({ type: 'back' });
  }, [route, hasSeenHowToPlayLocally, onHowToPlaySeen]);

  const handleHardwareBack = useCallback(() => {
    // Swallow back while the intro is covering the screen: it must not pop navigation or mark
    // How to play seen underneath an overlay the user cannot even see past (AE5 regression).
    if (isIntroActive) return true;
    if (!canGoBack(state)) return false;
    goBack();
    return true;
  }, [isIntroActive, state, goBack]);
  useHardwareBackHandler(handleHardwareBack);

  const handleStart = useCallback(
    (mode: HomeScreenMode, length: WordLength) => dispatch({ type: 'push', route: { screen: 'game', mode, length } }),
    [],
  );
  const handleOpenHowToPlay = useCallback(() => dispatch({ type: 'push', route: { screen: 'howToPlay' } }), []);
  const handleOpenSettings = useCallback(() => dispatch({ type: 'push', route: { screen: 'settings' } }), []);
  const handleOpenStats = useCallback((length: WordLength) => dispatch({ type: 'push', route: { screen: 'stats', length } }), []);
  const handleBack = goBack;

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
        isHowToPlayFirstLaunch={!hasSeenHowToPlayLocally}
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
        <FirstLaunchGate />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flexFill: { flex: 1 },
});
