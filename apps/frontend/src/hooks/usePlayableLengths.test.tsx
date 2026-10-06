import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDefaultPlayableLength, usePlayableLengths } from './usePlayableLengths';
import * as api from '../lib/api';

function renderWithClient<T>(hook: () => T) {
  const queryClient = new QueryClient();
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePlayableLengths', () => {
  it('returns the default [5] while the request is pending', () => {
    vi.spyOn(api, 'fetchPlayableLengths').mockReturnValue(new Promise(() => {}));

    const { result } = renderWithClient(() => usePlayableLengths());

    expect(result.current).toEqual([5]);
  });

  it('returns the lengths from the API once loaded', async () => {
    vi.spyOn(api, 'fetchPlayableLengths').mockResolvedValue({ lengths: [4, 5] });

    const { result } = renderWithClient(() => usePlayableLengths());

    await waitFor(() => expect(result.current).toEqual([4, 5]));
  });

  it('falls back to [5] when the request fails', async () => {
    vi.spyOn(api, 'fetchPlayableLengths').mockRejectedValue(new Error('network error'));

    const { result } = renderWithClient(() => usePlayableLengths());

    await waitFor(() => expect(result.current).toEqual([5]));
  });

  it('falls back to [5] when the API returns no valid scheduled length', async () => {
    vi.spyOn(api, 'fetchPlayableLengths').mockResolvedValue({ lengths: [7, 0] });

    const { result } = renderWithClient(() => usePlayableLengths());

    await waitFor(() => expect(result.current).toEqual([5]));
  });
});

describe('getDefaultPlayableLength', () => {
  it('prefers 5 when it is playable, regardless of order', () => {
    expect(getDefaultPlayableLength([4, 5, 6])).toBe(5);
    expect(getDefaultPlayableLength([6, 5])).toBe(5);
  });

  it('falls back to the first playable length when 5 is not playable', () => {
    expect(getDefaultPlayableLength([4, 6])).toBe(4);
  });

  it('falls back to 5 when the list is empty', () => {
    expect(getDefaultPlayableLength([])).toBe(5);
  });
});
