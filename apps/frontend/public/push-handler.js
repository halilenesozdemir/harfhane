self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('Harfhane', {
      body: 'Bugünkü kelimeyi henüz çözmedin! Seriyi kırmadan oyna.',
      icon: '/nurdle-icon.svg',
      badge: '/nurdle-icon.svg',
      tag: 'daily-reminder',
      renotify: false,
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
