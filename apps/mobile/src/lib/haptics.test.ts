import { beforeEach, describe, expect, it, vi } from 'vitest';

const performAndroidHapticsAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('expo-haptics', () => ({
  AndroidHaptics: {
    Keyboard_Tap: 'keyboard-tap',
    Confirm: 'confirm',
    Reject: 'reject',
    Long_Press: 'long-press',
    Context_Click: 'context-click',
  },
  performAndroidHapticsAsync: (...args: unknown[]) => performAndroidHapticsAsync(...args),
}));

const { keyTap, win, reject } = await import('./haptics');

describe('haptics', () => {
  beforeEach(() => {
    performAndroidHapticsAsync.mockClear();
  });

  it('should trigger the keyboard-tap haptic when enabled on key press', async () => {
    await keyTap(true);
    expect(performAndroidHapticsAsync).toHaveBeenCalledWith('keyboard-tap');
  });

  it('should trigger the confirm haptic when enabled on win', async () => {
    await win(true);
    expect(performAndroidHapticsAsync).toHaveBeenCalledWith('confirm');
  });

  it('should trigger the reject haptic when enabled on a rejected guess', async () => {
    await reject(true);
    expect(performAndroidHapticsAsync).toHaveBeenCalledWith('reject');
  });

  it('should not call expo-haptics for keyTap when haptics are switched off', async () => {
    await keyTap(false);
    expect(performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should not call expo-haptics for win when haptics are switched off', async () => {
    await win(false);
    expect(performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should not call expo-haptics for reject when haptics are switched off', async () => {
    await reject(false);
    expect(performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it('should not throw when the device has no haptics engine', async () => {
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('no haptics engine'));
    await expect(keyTap(true)).resolves.toBeUndefined();
  });

  it('should fall back to long-press when confirm is unsupported (pre-API-30 win)', async () => {
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('HapticsNotSupportedException'));
    await win(true);
    expect(performAndroidHapticsAsync).toHaveBeenNthCalledWith(1, 'confirm');
    expect(performAndroidHapticsAsync).toHaveBeenNthCalledWith(2, 'long-press');
  });

  it('should fall back to context-click when reject is unsupported (pre-API-30 reject)', async () => {
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('HapticsNotSupportedException'));
    await reject(true);
    expect(performAndroidHapticsAsync).toHaveBeenNthCalledWith(1, 'reject');
    expect(performAndroidHapticsAsync).toHaveBeenNthCalledWith(2, 'context-click');
  });

  it('should not throw when both the primary and the fallback haptic are unsupported', async () => {
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('unsupported'));
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('unsupported'));
    await expect(win(true)).resolves.toBeUndefined();
  });

  it('should not fall back for keyTap, which has no fallback type', async () => {
    performAndroidHapticsAsync.mockRejectedValueOnce(new Error('unsupported'));
    await keyTap(true);
    expect(performAndroidHapticsAsync).toHaveBeenCalledTimes(1);
  });
});
