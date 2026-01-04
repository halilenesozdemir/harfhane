/**
 * Service Worker Registration
 * PWA için otomatik güncelleme ve offline desteği
 */

import { registerSW } from 'virtual:pwa-register';

export const registerServiceWorker = (): void => {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Yeni versiyon mevcut - kullanıcıya bildir
      if (confirm('Yeni versiyon mevcut! Güncellemek ister misiniz?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('✅ Uygulama offline modda çalışmaya hazır');
      
      // Kullanıcıya bildir (toast gibi)
      const event = new CustomEvent('sw-offline-ready');
      window.dispatchEvent(event);
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      console.log('✅ Service Worker kaydedildi');
      
      // Her 1 saatte bir güncelleme kontrolü
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: unknown) {
      console.error('❌ Service Worker kayıt hatası:', error);
    },
  });
};

// Notification permission request (günlük hatırlatma için)
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Bu tarayıcı bildirim desteklemiyor');
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
      await registration.showNotification('Günlük Nurdle hazır! 🎮', {
        body: "Bugünün kelimesini tahmin etmeye hazır mısın?",
        icon: '/nurdle-icon-192.png',
        badge: '/nurdle-icon-192.png',
        tag: 'daily-reminder',
        requireInteraction: false,
      });

      // Bir sonraki günü planla
      scheduleDailyReminder();
    }, delay);
  }
};

