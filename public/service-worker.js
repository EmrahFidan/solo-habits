/* eslint-disable no-restricted-globals */
// Service Worker Global Scope

// 🆕 VERSION GÜNCELLE - Cache'i zorla yenile
const CACHE_NAME = 'solo-leveling-v3'; // ← v2'den v3'e çıkar

// Cache edilecek dosyalar
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Service Worker Install Event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v3 kuruldu!');
  
  // 🆕 Eski cache'i hemen sil
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache v3 açıldı');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker Activate Event  
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker v3 aktif!');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME) // ← Eski cache'leri sil
          .map((cacheName) => {
            console.log('🗑️ Eski cache silindi:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // 🆕 Tüm client'ları hemen güncelle
      return self.clients.claim();
    })
  );
});

// Fetch Event - 🆕 Development'ta cache'i bypass et
self.addEventListener('fetch', (event) => {
  // Development modunda cache'i bypass et
  if (event.request.url.includes('localhost')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Production'da normal cache mantığı
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push Notification Event - Android için optimize edilmiş
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received on Android!');
  
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'solo-leveling-notification',
    // Android için önemli ayarlar
    requireInteraction: false,
    silent: false,
    renotify: false,
    timestamp: Date.now(),
    // Android action buttons (opsiyonel)
    actions: [
      {
        action: 'view',
        title: 'Aç',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Kapat'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Solo Leveling', options)
  );
});

// Android notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked on Android');
  console.log('Action:', event.action);
  
  event.notification.close();
  
  // Action'a göre farklı davranış
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Sadece bildirimi kapat
    return;
  } else {
    // Varsayılan: uygulamayı aç
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Background sync (opsiyonel - Android'de daha iyi çalışır)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Background'da yapılacak işlemler
      console.log('Background sync completed')
    );
  }
});
