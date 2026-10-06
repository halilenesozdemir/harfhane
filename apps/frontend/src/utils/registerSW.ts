import { registerSW } from 'virtual:pwa-register';

let deferredUpdate: (() => void) | null = null;

/** @deferred No UI listens for "sw-update-available" yet. See docs/backlog.md. */
export function hasPendingUpdate(): boolean {
  return deferredUpdate !== null;
}

/** @deferred No UI listens for "sw-update-available" yet. See docs/backlog.md. */
export function applyPendingUpdate(): void {
  deferredUpdate?.();
  deferredUpdate = null;
}

export const registerServiceWorker = (): void => {
  const updateSW = registerSW({
    onNeedRefresh() {
      deferredUpdate = () => updateSW(true);
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (registration) {
        setInterval(() => { registration.update(); }, 60 * 60 * 1000);
      }
    },
    onRegisterError() {
      window.dispatchEvent(new CustomEvent('sw-register-error'));
    },
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const scheduleDailyReminder = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;

  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(20, 0, 0, 0);

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const delay = reminderTime.getTime() - now.getTime();

  setTimeout(async () => {
    await registration.showNotification('Günlük Harfhane hazır!', {
      body: "Bugünün kelimesini tahmin etmeye hazır mısın?",
      icon: '/harfhane-icon-192.png',
      badge: '/harfhane-icon-192.png',
      tag: 'daily-reminder',
      requireInteraction: false,
    });
    void scheduleDailyReminder();
  }, delay);
};

