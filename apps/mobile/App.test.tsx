import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App, { AppNavigator, FirstLaunchGate } from './App';
import { ThemeProvider } from './src/ThemeProvider';
import { api } from './src/lib/api';
import { deviceStore } from './src/game/device-store';
import { PLAYABLE_LENGTHS_STORAGE_KEY } from './src/lib/playable-lengths';
import { createMemoryStore, flattenStyle } from './src/test-utils/render-with-theme';
import { useFonts } from '@expo-google-fonts/baloo-2/useFonts';
import { HOW_TO_PLAY_SEEN_KEY } from './src/first-launch-store';
import type { KeyValueStore } from './src/game/game-storage';

const mockPerformAndroidHapticsAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  AndroidHaptics: {
    Keyboard_Tap: 'keyboard-tap',
    Confirm: 'confirm',
    Reject: 'reject',
    Long_Press: 'long-press',
    Context_Click: 'context-click',
  },
  performAndroidHapticsAsync: (...args: unknown[]) => mockPerformAndroidHapticsAsync(...args),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('@expo-google-fonts/baloo-2/useFonts', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('@expo-google-fonts/baloo-2/800ExtraBold', () => ({
  Baloo2_800ExtraBold: 'Baloo2_800ExtraBold-mock',
}));

jest.mock('./src/lib/api', () => ({
  api: {
    fetchDailyWord: jest.fn().mockResolvedValue({ word: { word: 'KALEM' }, gameNumber: 1, date: '2026-10-05' }),
    fetchRandomWord: jest.fn().mockResolvedValue({ word: { word: 'KİTAP' }, wordId: 9 }),
    validateWord: jest.fn().mockResolvedValue({ isValid: true }),
    fetchPlayableLengths: jest.fn().mockResolvedValue({ lengths: [4, 5, 6] }),
  },
}));

jest.mock('./src/game/device-store', () => {
  const entries = new Map<string, string>();
  return {
    deviceStore: {
      getItem: jest.fn(async (key: string) => entries.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        entries.set(key, value);
      }),
    },
    __entries: entries,
  };
});

interface DeviceStoreMockModule {
  readonly __entries: Map<string, string>;
}

// Full isolation between tests: without this, one test's writes (and any
// of its still-settling async reads) could leak into the next test's
// render through the shared in-memory map above.
afterEach(() => {
  (jest.requireMock('./src/game/device-store') as DeviceStoreMockModule).__entries.clear();
});

async function openAndClose(openLabel: string, title: string, closeLabel: string) {
  await fireEvent.press(screen.getByLabelText(openLabel));
  expect(await screen.findByText(title)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText(closeLabel));
  expect(await screen.findByLabelText('Harfhane')).toBeTruthy();
}

function latestBackHandler(addSpy: jest.SpyInstance): () => boolean {
  const lastCall = addSpy.mock.calls[addSpy.mock.calls.length - 1] as [string, () => boolean];
  return lastCall[1];
}

describe('App', () => {
  // Every test below is about a returning user, not the first-launch flow
  // (covered separately in its own describe block), so each one starts
  // with the how-to-play-seen flag already set in the shared device store
  // mock — otherwise the first launch of How to play (R7/AE5) would cover
  // the home screen these tests expect to see immediately.
  beforeEach(async () => {
    await deviceStore.setItem(HOW_TO_PLAY_SEEN_KEY, 'true');
  });

  it('should reach the game screen from home when daily is started and go back', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByTestId('home-daily-card'));
    expect(await screen.findByLabelText('Günlük, 5 harf')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Geri'));
    expect(await screen.findByLabelText('Harfhane')).toBeTruthy();
  });

  it('should open and close HowToPlay, Settings and Stats from home', async () => {
    await render(<App />);
    await openAndClose('Nasıl oynanır sayfasını aç', 'Nasıl oynanır', 'Geri');
    await openAndClose('Ayarları aç', 'Ayarlar', 'Geri');
    await openAndClose('İstatistikleri aç', 'İstatistikler', 'Geri');
  });

  it('should keep the selected word length after returning from a game', async () => {
    await render(<App />);
    await fireEvent.press(screen.getByLabelText('6 harfli kelime seç'));
    await fireEvent.press(screen.getByTestId('home-daily-card'));
    expect(await screen.findByLabelText('Günlük, 6 harf')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Geri'));
    expect(await screen.findByText('Günün 6 harfli kelimesi')).toBeTruthy();
  });

  it('should pop the stack on hardware back from game or stats, and leave home unhandled', async () => {
    const addSpy = jest.spyOn(BackHandler, 'addEventListener');
    await render(<App />);

    expect(latestBackHandler(addSpy)()).toBe(false);

    await fireEvent.press(screen.getByTestId('home-daily-card'));
    await screen.findByLabelText('Günlük, 5 harf');
    let handledGame = false;
    await act(async () => {
      handledGame = latestBackHandler(addSpy)();
    });
    expect(handledGame).toBe(true);
    expect(await screen.findByLabelText('Harfhane')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('İstatistikleri aç'));
    await screen.findByLabelText('Geri');
    let handledStats = false;
    await act(async () => {
      handledStats = latestBackHandler(addSpy)();
    });
    expect(handledStats).toBe(true);
    expect(await screen.findByLabelText('Harfhane')).toBeTruthy();

    addSpy.mockRestore();
  });

  it('should apply nonzero safe-area insets as padding on the root container', async () => {
    const insets = { top: 24, right: 0, bottom: 16, left: 0 };
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets }}>
        <ThemeProvider store={createMemoryStore()}>
          <AppNavigator hasSeenHowToPlay onHowToPlaySeen={() => undefined} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    const container = screen.getByTestId('app-safe-area-container');
    const style = flattenStyle(container.props.style);
    expect(style.paddingTop).toBe(24);
    expect(style.paddingBottom).toBe(16);
  });

  it('(008-AE1) should hide the unlimited-mode length picker when only one length is playable', async () => {
    (api.fetchPlayableLengths as jest.Mock).mockResolvedValueOnce({ lengths: [5] });
    await render(<App />);
    expect(await screen.findByText('Günün 5 harfli kelimesi')).toBeTruthy();
    expect(screen.queryByLabelText('4 harfli kelime seç')).toBeNull();
    expect(screen.queryByLabelText('5 harfli kelime seç')).toBeNull();
  });

  it('should prefer length 5 as the daily default when 4, 5 and 6 are all playable', async () => {
    (api.fetchPlayableLengths as jest.Mock).mockResolvedValueOnce({ lengths: [4, 5, 6] });
    await render(<App />);
    expect(await screen.findByText('Günün 5 harfli kelimesi')).toBeTruthy();
  });

  it('should fall back to the first playable length when 5 is not playable', async () => {
    // If the fetch result were ignored, the hook's own loading default
    // ([5]) would make this show "5 harfle başlat" instead of "4".
    (api.fetchPlayableLengths as jest.Mock).mockResolvedValueOnce({ lengths: [4, 6] });
    await render(<App />);
    expect(await screen.findByText('Günün 4 harfli kelimesi')).toBeTruthy();
  });

  it('(008-AE1) should show the cached lengths immediately, then switch to the freshly fetched lengths once they load', async () => {
    await deviceStore.setItem(PLAYABLE_LENGTHS_STORAGE_KEY, JSON.stringify([4, 6]));
    let resolveFetch!: (value: { lengths: number[] }) => void;
    (api.fetchPlayableLengths as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    await render(<App />);
    // Cache applied before the fetch resolves: default length is 4 (5 isn't in [4, 6]).
    expect(await screen.findByText('Günün 4 harfli kelimesi')).toBeTruthy();

    await act(async () => {
      resolveFetch({ lengths: [5] });
    });
    // The fetch result ([5]) wins once it arrives, proving it isn't ignored
    // and a slower cache read can't overwrite it afterwards.
    expect(await screen.findByText('Günün 5 harfli kelimesi')).toBeTruthy();
  });

  describe('splash screen hold (R6)', () => {
    const STORE_DELAY_MS = 300;

    // A fresh module registry, not the mockClear()-reset shared instance
    // above: this is the only way to see App.tsx's *module-load* behavior
    // (the top-level preventAutoHideAsync() call) in isolation, instead of
    // relying on a mock reset that would just as happily hide a real bug
    // (e.g. an accidental immediate hideAsync() at import time).
    it('(011-AE4) should call preventAutoHideAsync as a module-load side effect, without calling hideAsync at the same time', () => {
      // jest.mock's module factory is memoized per mocked path across
      // isolateModules boundaries, so the mock fns below are the SAME
      // jest.fn() instances as the outer `SplashScreen` import, already
      // carrying calls from the file's own static import and earlier
      // tests. Deltas, not absolute counts, isolate what THIS fresh
      // evaluation of App.tsx actually did — this is exactly what
      // mockClear() cannot prove, since it would also erase a real bug
      // (e.g. an accidental immediate hideAsync() at import time).
      const preventCallsBefore = (SplashScreen.preventAutoHideAsync as jest.Mock).mock.calls.length;
      const hideCallsBefore = (SplashScreen.hideAsync as jest.Mock).mock.calls.length;

      let freshSplash!: typeof SplashScreen;
      jest.isolateModules(() => {
        // jest.isolateModules needs a synchronous require to get a fresh
        // module instance; a static/dynamic `import` would not re-run
        // App.tsx's module-load side effect in isolation.
        /* eslint-disable @typescript-eslint/no-require-imports */
        freshSplash = require('expo-splash-screen');
        // Module-load side effect fires here, synchronously, before any
        // component ever mounts.
        require('./App');
        /* eslint-enable @typescript-eslint/no-require-imports */
      });

      expect(freshSplash.preventAutoHideAsync).toHaveBeenCalledTimes(preventCallsBefore + 1);
      expect(freshSplash.hideAsync).toHaveBeenCalledTimes(hideCallsBefore);
    });

    function createDelayedStore(): KeyValueStore {
      return {
        getItem: () => new Promise((resolve) => setTimeout(() => resolve(null), STORE_DELAY_MS)),
        setItem: async () => undefined,
      };
    }

    it('(011-AE4) should hide the splash screen only after stored state has loaded', async () => {
      (SplashScreen.hideAsync as jest.Mock).mockClear();

      // FirstLaunchGate (not AppNavigator directly): splash-hiding now
      // lives in the how-to-play gate, which only starts loading once
      // ThemeProvider's own delayed load below has already resolved, so
      // this still proves the splash waits for both theme and the flag.
      await render(
        <SafeAreaProvider>
          <ThemeProvider store={createDelayedStore()}>
            <FirstLaunchGate />
          </ThemeProvider>
        </SafeAreaProvider>,
      );
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, STORE_DELAY_MS + 50));
      });
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });

    it('(011-AE5) should render neither Home nor How to play while the how-to-play flag read is still pending', async () => {
      // Kills the mutant that drops FirstLaunchGate's "return null until
      // isLoaded": without that guard, AppNavigator would mount with
      // whatever hasSeenHowToPlay default it falls back to while this
      // read never settles, rendering one screen or the other.
      const mocked = jest.requireMock('./src/game/device-store') as DeviceStoreMockModule;
      const defaultGetItem = async (key: string) => mocked.__entries.get(key) ?? null;
      (deviceStore.getItem as jest.Mock).mockImplementation((key: string) =>
        key === HOW_TO_PLAY_SEEN_KEY ? new Promise<string | null>(() => undefined) : defaultGetItem(key),
      );

      await render(<App />);
      expect(screen.queryByText('Nasıl oynanır')).toBeNull();
      expect(screen.queryByLabelText('Harfhane')).toBeNull();

      (deviceStore.getItem as jest.Mock).mockImplementation(defaultGetItem);
    });

    it('(011-AE4) should not mount the themed app, and so never hide the splash, while fonts are still loading', async () => {
      (SplashScreen.hideAsync as jest.Mock).mockClear();
      (useFonts as jest.Mock).mockReturnValueOnce([false, null]);

      await render(<App />);
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
      expect(screen.queryByTestId('app-safe-area-container')).toBeNull();
    });

    it('should still mount the app when font loading fails permanently, instead of holding the splash forever', async () => {
      (useFonts as jest.Mock).mockReturnValueOnce([false, new Error('font load failed')]);

      await render(<App />);
      expect(await screen.findByLabelText('Harfhane')).toBeTruthy();
    });
  });

  describe('first launch (R7)', () => {
    it('(011-AE5) should show How to play on a fresh install, then go straight home on the next launch after closing it', async () => {
      // Overrides this test's own beforeEach (which assumes a returning
      // user) with any value other than the seen sentinel, reproducing
      // what a fresh install's missing key resolves to: "not seen".
      await deviceStore.setItem(HOW_TO_PLAY_SEEN_KEY, 'not-seen-yet');

      const firstLaunch = await render(<App />);
      expect(await screen.findByText('Nasıl oynanır')).toBeTruthy();
      expect(screen.queryByLabelText('Harfhane')).toBeNull();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Oynamaya başla'));
      });
      expect(await screen.findByLabelText('Harfhane')).toBeTruthy();
      await act(async () => {
        firstLaunch.unmount();
      });

      // Re-mounts App against the same persisted device store (the shared
      // mock's Map carries the write from closing How to play above), which
      // is this test's stand-in for "the next launch".
      await render(<App />);
      expect(await screen.findByLabelText('Harfhane')).toBeTruthy();
      expect(screen.queryByText('Nasıl oynanır')).toBeNull();
    });

    it('(011-AE5) should go home directly on hardware back from How to play on first launch', async () => {
      await deviceStore.setItem(HOW_TO_PLAY_SEEN_KEY, 'not-seen-yet');
      const addSpy = jest.spyOn(BackHandler, 'addEventListener');

      await render(<App />);
      expect(await screen.findByText('Nasıl oynanır')).toBeTruthy();

      let handled = false;
      await act(async () => {
        handled = latestBackHandler(addSpy)();
      });
      expect(handled).toBe(true);
      expect(await screen.findByLabelText('Harfhane')).toBeTruthy();

      addSpy.mockRestore();
    });
  });

  describe('haptics (Plan 011 U3)', () => {
    // The real path: Settings is a separate route, and GameScreen reads the stored setting
    // through useGame() when the game mounts. A Keyboard-only prop test can't prove that the
    // switch is wired to setEnabled, that it persists, or that the stored value is parsed.
    it('should stop the key-tap haptic after Titreşim is switched off in Settings (011-AE3)', async () => {
      await render(<App />);
      await fireEvent.press(screen.getByTestId('home-daily-card'));
      await screen.findByLabelText('Günlük, 5 harf');
      await screen.findByTestId('key-A');

      mockPerformAndroidHapticsAsync.mockClear();
      await fireEvent.press(screen.getByTestId('key-A'));
      expect(mockPerformAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');

      await fireEvent.press(screen.getByLabelText('Geri'));
      await fireEvent.press(screen.getByLabelText('Ayarları aç'));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(screen.getByLabelText('Titreşim').props.disabled).toBe(false);

      await fireEvent(screen.getByLabelText('Titreşim'), 'valueChange', false);
      await fireEvent.press(screen.getByLabelText('Geri'));

      await fireEvent.press(screen.getByTestId('home-daily-card'));
      await screen.findByTestId('key-A');
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      mockPerformAndroidHapticsAsync.mockClear();
      await fireEvent.press(screen.getByTestId('key-A'));
      expect(mockPerformAndroidHapticsAsync).not.toHaveBeenCalled();
    });
  });
});
