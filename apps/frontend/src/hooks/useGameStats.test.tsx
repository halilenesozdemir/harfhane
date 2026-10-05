import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { useGameStats } from './useGameStats';
import * as authApi from '../lib/auth-api';

vi.mock('../lib/auth-api');

function renderUseGameStats(wordId: number | null) {
  const queryClient = new QueryClient();
  return renderHook(
    ({ wordId: id }: { wordId: number | null }) =>
      useGameStats({ isUnlimited: true, wordLength: 5, token: 'tok', wordId: id }),
    {
      initialProps: { wordId },
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    }
  );
}

describe('useGameStats', () => {
  it('should send the current wordId when updateStats is called after wordId changes', () => {
    const saveResultMock = vi.spyOn(authApi, 'saveResult').mockReturnValue(new Promise(() => {}));
    const { result, rerender } = renderUseGameStats(1);

    rerender({ wordId: 2 });
    act(() => { result.current.updateStats(true, 3); });

    expect(saveResultMock).toHaveBeenCalledWith('tok', expect.objectContaining({ word_id: 2 }));
  });
});
