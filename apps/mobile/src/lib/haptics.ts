import { AndroidHaptics, performAndroidHapticsAsync } from 'expo-haptics';

/**
 * `Confirm`/`Reject` map to `HapticFeedbackConstants` added in Android 11 (API 30). Below
 * that, `expo-haptics` rejects the promise with `HapticsNotSupportedException` — it does not
 * drop the call silently — so `performHaptic` catches that and retries with a type
 * guaranteed since API 27 to still give some feedback.
 */
async function performHaptic(type: AndroidHaptics, fallback: AndroidHaptics | null, isEnabled: boolean): Promise<void> {
  if (!isEnabled) return;
  try {
    await performAndroidHapticsAsync(type);
  } catch {
    if (fallback === null) return;
    try {
      await performAndroidHapticsAsync(fallback);
    } catch {
      // A device with no haptics engine at all should never crash the game.
    }
  }
}

/** Light feedback for a single key press. No-op when haptics are disabled. */
export function keyTap(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Keyboard_Tap, null, isEnabled);
}

/** Distinct feedback for a won game. No-op when haptics are disabled. */
export function win(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Confirm, AndroidHaptics.Long_Press, isEnabled);
}

/** Distinct feedback for a rejected guess. No-op when haptics are disabled. */
export function reject(isEnabled: boolean): Promise<void> {
  return performHaptic(AndroidHaptics.Reject, AndroidHaptics.Context_Click, isEnabled);
}
