import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { HAPTICS_ENABLED_KEY, parseHapticsEnabled, useHapticsSettings } from './useHapticsSettings';

// Every test below passes its own memory store, but the hook module still statically
// imports the real deviceStore for its default parameter. device-store.ts itself now
// falls back to a no-op store when the native module isn't linked, so no mock is needed
// here purely to avoid touching native AsyncStorage (see device-store.ts).

describe('parseHapticsEnabled', () => {
  it('should default to on when nothing is stored', () => {
    expect(parseHapticsEnabled(null)).toBe(true);
  });

  it('should read a stored false value', () => {
    expect(parseHapticsEnabled('false')).toBe(false);
  });

  it('should default to on when the stored value is malformed', () => {
    expect(parseHapticsEnabled('not-json')).toBe(true);
  });
});

describe('useHapticsSettings', () => {
  it('should treat haptics as off before the stored value loads, even though the default is on', async () => {
    let resolveGetItem!: (value: string | null) => void;
    const store = {
      getItem: () => new Promise<string | null>((resolve) => { resolveGetItem = resolve; }),
      setItem: async () => undefined,
    };
    const { result } = await renderHook(() => useHapticsSettings(store));
    expect(result.current.isEnabled).toBe(false);
    await act(async () => {
      resolveGetItem(null);
      await Promise.resolve();
    });
    expect(result.current.isEnabled).toBe(true);
  });

  it('should load a stored enabled preference once it resolves', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() => useHapticsSettings(store));
    await waitFor(() => expect(result.current.isEnabled).toBe(true));
  });

  it('should load a stored disabled preference', async () => {
    const store = createMemoryStore({ [HAPTICS_ENABLED_KEY]: 'false' });
    const { result } = await renderHook(() => useHapticsSettings(store));
    await waitFor(() => expect(result.current.isEnabled).toBe(false));
  });

  it('should persist a toggle to off', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() => useHapticsSettings(store));
    await act(async () => {
      result.current.setEnabled(false);
    });
    expect(result.current.isEnabled).toBe(false);
    expect(await store.getItem(HAPTICS_ENABLED_KEY)).toBe('false');
  });
});
