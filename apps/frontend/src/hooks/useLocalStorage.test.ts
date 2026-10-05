import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('should return the initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('harfhane:test:empty', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should return the stored value when storage already has a value', () => {
    window.localStorage.setItem('harfhane:test:existing', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('harfhane:test:existing', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should persist the new value to storage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('harfhane:test:write', 'default'));
    act(() => result.current[1]('updated'));
    expect(window.localStorage.getItem('harfhane:test:write')).toBe(JSON.stringify('updated'));
  });

  it('should switch to the new key value when key changes', () => {
    window.localStorage.setItem('harfhane:test:b', JSON.stringify('b-value'));
    const { result, rerender } = renderHook(({ key }: { key: string }) => useLocalStorage(key, 'default'), {
      initialProps: { key: 'harfhane:test:a' },
    });

    rerender({ key: 'harfhane:test:b' });

    expect(result.current[0]).toBe('b-value');
  });

  it('should persist under the latest key after a key change', () => {
    const { result, rerender } = renderHook(({ key }: { key: string }) => useLocalStorage(key, 'default'), {
      initialProps: { key: 'harfhane:test:c' },
    });

    rerender({ key: 'harfhane:test:d' });
    act(() => result.current[1]('for-d'));

    expect(window.localStorage.getItem('harfhane:test:d')).toBe(JSON.stringify('for-d'));
    expect(window.localStorage.getItem('harfhane:test:c')).toBeNull();
  });
});
