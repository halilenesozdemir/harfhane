import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { useShare } from './useShare';

const RESET_DELAY_MS = 2000;

describe('useShare', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when navigator.share is available', () => {
    it('should call navigator.share with the provided text', async () => {
      const shareText = 'Nurdle 5/6\n\nhttps://harfhane.app';
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, writable: true, configurable: true });

      const { result } = renderHook(() => useShare(shareText));

      await act(async () => { await result.current.share(); });

      expect(shareMock).toHaveBeenCalledWith({ text: shareText });
    });

    it('should set copied to true on success', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, writable: true, configurable: true });

      const { result } = renderHook(() => useShare('test'));

      await act(async () => { await result.current.share(); });

      expect(result.current.copied).toBe(true);
    });

    it('should fall back to clipboard when share throws', async () => {
      const shareMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      const clipboardMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, writable: true, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardMock }, writable: true, configurable: true });

      const { result } = renderHook(() => useShare('test'));

      await act(async () => { await result.current.share(); });

      expect(clipboardMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when navigator.share is not available', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    });

    it('should write to clipboard directly', async () => {
      const shareText = 'Nurdle 3/6\n\nhttps://harfhane.app';
      const clipboardMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardMock }, writable: true, configurable: true });

      const { result } = renderHook(() => useShare(shareText));

      await act(async () => { await result.current.share(); });

      expect(clipboardMock).toHaveBeenCalledWith(shareText);
    });

    it('should set copied to true on clipboard success', async () => {
      const clipboardMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardMock }, writable: true, configurable: true });

      const { result } = renderHook(() => useShare('test'));

      await act(async () => { await result.current.share(); });

      expect(result.current.copied).toBe(true);
    });

    it('should set failed to true when clipboard fails', async () => {
      const clipboardMock = vi.fn().mockRejectedValue(new Error('Unavailable'));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardMock }, writable: true, configurable: true });

      const { result } = renderHook(() => useShare('test'));

      await act(async () => { await result.current.share(); });

      expect(result.current.failed).toBe(true);
    });

    it('should reset failed to false after 2 seconds', async () => {
      const clipboardMock = vi.fn().mockRejectedValue(new Error('Unavailable'));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: clipboardMock }, writable: true, configurable: true });

      const { result } = renderHook(() => useShare('test'));

      await act(async () => { await result.current.share(); });
      expect(result.current.failed).toBe(true);

      act(() => { vi.advanceTimersByTime(RESET_DELAY_MS); });

      expect(result.current.failed).toBe(false);
    });
  });
});
