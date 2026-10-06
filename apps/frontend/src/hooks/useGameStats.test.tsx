import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGameStats } from './useGameStats';

describe('useGameStats', () => {
  it('should update the local unlimited guess distribution when updateStats is called', () => {
    const { result } = renderHook(() => useGameStats({ isUnlimited: true, wordLength: 5 }));

    act(() => { result.current.updateStats(true, 3); });

    expect(result.current.currentStats.gamesPlayed).toBe(1);
    expect(result.current.currentStats.gamesWon).toBe(1);
    expect(result.current.currentStats.guessDistribution[2]).toBe(1);
  });
});
