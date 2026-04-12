importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// [CONFIGURABLE-VIA-SETTINGS]
firebase.initializeApp({
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  databaseURL: "http://127.0.0.1:9000?ns=smart-venue-dev",
  projectId: "smart-venue-dev",
  storageBucket: "smart-venue-dev.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:test"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'System Alert';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/firebase-logo.png', // Default icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow)
        return clients.openWindow('/alerts');
    })
  );
});
