/* eslint-disable no-restricted-globals */

// Cache name
const CACHE_NAME = 'medicine-expiry-tracker-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  self.skipWaiting(); // Ensure the service worker activates immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
          return Promise.resolve();
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push Notification Received:', event.data?.text());
  
  const options = {
    body: event.data?.text() || 'No message content',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Medicine Expiry Alert', options)
      .catch(error => console.error('Error showing notification:', error))
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app and navigate to the medicine details
    event.waitUntil(
      clients.openWindow('/')
        .catch(error => console.error('Error opening window:', error))
    );
  }
}); 