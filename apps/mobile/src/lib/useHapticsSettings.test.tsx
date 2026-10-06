import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createMemoryStore } from '../test-utils/render-with-theme';
import { HAPTICS_ENABLED_KEY, parseHapticsEnabled, useHapticsSettings } from './useHapticsSettings';

// Every test passes its own memory store, but the hook module still imports the real
// deviceStore for its default parameter, so it needs a mock to avoid touching native AsyncStorage.
jest.mock('../game/device-store', () => ({
  deviceStore: { getItem: () => Promise.resolve(null), setItem: () => Promise.resolve() },
}));

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
  it('should default to enabled before the stored value loads', async () => {
    const store = createMemoryStore();
    const { result } = await renderHook(() => useHapticsSettings(store));
    expect(result.current.isEnabled).toBe(true);
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
