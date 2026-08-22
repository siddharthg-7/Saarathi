// Saarathi Web Push & Background Notification Service Worker

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push events
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Saarathi Reminder', body: event.data.text() };
    }
  }

  const title = data.title || 'Saarathi Task Reminder';
  const options = {
    body: data.body || 'You have an upcoming scheduled task in Saarathi.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || `saarathi_notif_${Date.now()}`,
    data: data.data || {},
    actions: [
      { action: 'done', title: 'Done' },
      { action: 'snooze_10', title: 'Snooze 10m' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification interaction & deep-linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and post action message
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_ACTION_CLICK',
            action,
            data: notifData,
          });
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
