/**
 * Service Worker Registration
 * PWA için otomatik güncelleme ve offline desteği
 */

import { registerSW } from 'virtual:pwa-register';

export const registerServiceWorker = (): void => {
  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
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

// Notification permission request (günlük hatırlatma için)
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Günlük hatırlatma planla
export const scheduleDailyReminder = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Service Worker üzerinden notification gönder
  if ('serviceWorker' in navigator && 'registration' in navigator.serviceWorker) {
    const registration = await navigator.serviceWorker.ready;
    
    // Her gün saat 20:00'da hatırlat
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

      // Bir sonraki günü planla
      scheduleDailyReminder();
    }, delay);
  }
};

