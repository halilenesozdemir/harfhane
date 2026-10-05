import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { themes } from '@harfhane/ui-tokens';
import { ThemeProvider, useTheme } from './ThemeProvider';
import type { KeyValueStore } from './game/game-storage';

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore & { entries: Map<string, string> } {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
  };
}

function Probe() {
  const { colors, setPreference, setHighContrast } = useTheme();
  return (
    <>
      <Text testID="bg">{colors.bg}</Text>
      <Text testID="correct">{colors.correct}</Text>
      <Pressable testID="dark" onPress={() => setPreference('dark')} />
      <Pressable testID="contrast" onPress={() => setHighContrast(true)} />
    </>
  );
}

async function renderWithStore(store: KeyValueStore) {
  await render(
    <ThemeProvider store={store}>
      <Probe />
    </ThemeProvider>,
  );
}

function createSlowStore(storedPreference: string) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const store = createMemoryStore({ 'harfhane:theme': storedPreference });
  const slowStore: KeyValueStore = {
    getItem: async (key) => {
      const valueAtRequest = await store.getItem(key);
      await gate;
      return valueAtRequest;
    },
    setItem: store.setItem,
  };
  return { slowStore, release: () => release() };
}

describe('ThemeProvider', () => {
  it('should keep the player choice when stored values arrive after it', async () => {
    const { slowStore, release } = createSlowStore('"light"');
    await render(
      <ThemeProvider store={slowStore} waitForStoredTheme={false}>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('dark'));
    });
    await act(async () => {
      release();
    });
    expect(screen.getByTestId('bg').props.children).toBe(themes.dark.bg);
  });

  it('should render nothing until stored values are loaded', async () => {
    const { slowStore, release } = createSlowStore('"dark"');
    await render(
      <ThemeProvider store={slowStore}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId('bg')).toBeNull();
    await act(async () => {
      release();
    });
    expect(screen.getByTestId('bg').props.children).toBe(themes.dark.bg);
  });

  it('should apply the stored dark preference when the app starts', async () => {
    await renderWithStore(createMemoryStore({ 'harfhane:theme': '"dark"' }));
    expect(await screen.findByText(themes.dark.bg)).toBeTruthy();
  });

  it('should save and apply high contrast when it is turned on', async () => {
    const store = createMemoryStore();
    await renderWithStore(store);
    await act(async () => {
      fireEvent.press(screen.getByTestId('contrast'));
    });
    expect(screen.getByTestId('correct').props.children).toBe(themes['high-contrast'].correct);
    expect(store.entries.get('harfhane:high-contrast')).toBe('true');
  });

  it('should save the preference when the player picks dark', async () => {
    const store = createMemoryStore();
    await renderWithStore(store);
    await act(async () => {
      fireEvent.press(screen.getByTestId('dark'));
    });
    expect(screen.getByTestId('bg').props.children).toBe(themes.dark.bg);
    expect(store.entries.get('harfhane:theme')).toBe('"dark"');
  });
});
