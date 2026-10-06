import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePlayableLengths } from './playable-lengths';
import type { ApiClient } from './api';
import type { KeyValueStore } from '../game/game-storage';

function createApi(impl: Partial<ApiClient> = {}): ApiClient {
  return {
    fetchDailyWord: jest.fn(),
    fetchRandomWord: jest.fn(),
    validateWord: jest.fn(),
    fetchPlayableLengths: jest.fn(),
    ...impl,
  } as ApiClient;
}

describe('usePlayableLengths', () => {
  it('should not let a cache read that resolves after the fetch override the fresher fetch result', async () => {
    let resolveGetItem!: (value: string | null) => void;
    const store: KeyValueStore = {
      getItem: jest.fn(() => new Promise((resolve) => { resolveGetItem = resolve; })),
      setItem: jest.fn().mockResolvedValue(undefined),
    };
    const api = createApi({ fetchPlayableLengths: jest.fn().mockResolvedValue({ lengths: [4, 6] }) });

    const { result } = await renderHook(() => usePlayableLengths(api, store));

    // The fetch resolves first (its backing promise is already settled).
    await waitFor(() => expect(result.current).toEqual([4, 6]));

    // The slow cache read finally resolves, with a different, stale value.
    await act(async () => {
      resolveGetItem(JSON.stringify([5]));
    });

    // The late cache result must not un-apply the fresher fetch result.
    expect(result.current).toEqual([4, 6]);
  });
});
