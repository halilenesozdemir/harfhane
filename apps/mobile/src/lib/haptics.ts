import { AndroidHaptics, performAndroidHapticsAsync } from 'expo-haptics';

async function performHaptic(type: AndroidHaptics, isEnabled: boolean): Promise<void> {
  if (!isEnabled) return;
  await performAndroidHapticsAsync(type);
}

/** Light feedback for a single key press. No-op when haptics are disabled. */
export function keyTap(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Keyboard_Tap, isEnabled);
}

/** Distinct feedback for a won game. No-op when haptics are disabled. */
export function win(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Confirm, isEnabled);
}

/** Distinct feedback for a rejected guess. No-op when haptics are disabled. */
export function reject(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Reject, isEnabled);
}
