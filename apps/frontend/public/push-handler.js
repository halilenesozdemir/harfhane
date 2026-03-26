self.addEventListener('push', (event) => {
  const defaults = {
    title: 'Harfhane',
    body: 'Bugünkü kelimeyi henüz çözmedin! Seriyi kırmadan oyna.',
    url: '/daily/5',
  };

  let payload = defaults;
  if (event.data) {
    try {
      payload = { ...defaults, ...JSON.parse(event.data.text()) };
    } catch {
      payload = defaults;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/nurdle-icon.svg',
      badge: '/nurdle-icon.svg',
      tag: 'daily-reminder',
      renotify: false,
      data: { url: payload.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          void client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
