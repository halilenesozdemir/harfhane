import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { HAPTICS_ENABLED_KEY, parseHapticsEnabled, useHapticsSettings } from './useHapticsSettings';

// Every test below passes its own memory store, but the hook module still statically
// imports the real deviceStore for its default parameter. jest.config.js maps
// @react-native-async-storage/async-storage to its official jest mock repo-wide, so that
// import never touches the native module here.

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

  it('should report isLoaded false until the stored value resolves, true after', async () => {
    let resolveGetItem!: (value: string | null) => void;
    const store = {
      getItem: () => new Promise<string | null>((resolve) => { resolveGetItem = resolve; }),
      setItem: async () => undefined,
    };
    const { result } = await renderHook(() => useHapticsSettings(store));
    expect(result.current.isLoaded).toBe(false);
    await act(async () => {
      resolveGetItem(null);
      await Promise.resolve();
    });
    expect(result.current.isLoaded).toBe(true);
  });

  it('should keep a user-set value when the stored-value load resolves after it', async () => {
    let resolveGetItem!: (value: string | null) => void;
    const store = {
      getItem: () => new Promise<string | null>((resolve) => { resolveGetItem = resolve; }),
      setItem: async () => undefined,
    };
    const { result } = await renderHook(() => useHapticsSettings(store));
    await act(async () => {
      result.current.setEnabled(false);
    });
    expect(result.current.isEnabled).toBe(false);
    await act(async () => {
      resolveGetItem('true');
      await Promise.resolve();
    });
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.isLoaded).toBe(true);
  });
});
