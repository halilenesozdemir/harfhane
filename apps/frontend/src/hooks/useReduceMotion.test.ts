import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useReduceMotion } from './useReduceMotion';

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initialMatches: boolean): { setMatches: (value: boolean) => void } {
  let matches = initialMatches;
  const listeners = new Set<Listener>();

  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    setMatches: (value: boolean) => {
      matches = value;
      for (const listener of listeners) listener({ matches: value } as MediaQueryListEvent);
    },
  };
}

describe('useReduceMotion', () => {
  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('should return false when the OS has no reduced-motion preference', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when the OS asks for reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(true);
  });

  it('should update when the preference changes while mounted', () => {
    const { setMatches } = mockMatchMedia(false);
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);

    act(() => setMatches(true));

    expect(result.current).toBe(true);
  });
});
