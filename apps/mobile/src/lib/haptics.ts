import { AndroidHaptics, performAndroidHapticsAsync } from 'expo-haptics';

async function performHaptic(type: AndroidHaptics, isEnabled: boolean): Promise<void> {
  if (!isEnabled) return;
  try {
    await performAndroidHapticsAsync(type);
  } catch {
    // A missing/unsupported haptics engine on a device should never crash the game.
  }
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
