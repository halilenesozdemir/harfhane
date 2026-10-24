import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGameStats } from './useGameStats';
import { requestPersistentStorage } from '../utils/persistStorage';

vi.mock('../utils/persistStorage', () => ({ requestPersistentStorage: vi.fn().mockResolvedValue(undefined) }));

describe('useGameStats', () => {
  it('should update the local unlimited guess distribution when updateStats is called', () => {
    const { result } = renderHook(() => useGameStats({ isUnlimited: true, wordLength: 5 }));

    act(() => { result.current.updateStats(true, 3); });

    expect(result.current.currentStats.gamesPlayed).toBe(1);
    expect(result.current.currentStats.gamesWon).toBe(1);
    expect(result.current.currentStats.guessDistribution[2]).toBe(1);
  });

  it('should ask the browser to keep storage when a game result is saved', () => {
    const { result } = renderHook(() => useGameStats({ isUnlimited: false, wordLength: 5 }));

    act(() => { result.current.updateStats(false, 0); });

    expect(requestPersistentStorage).toHaveBeenCalled();
  });
});
