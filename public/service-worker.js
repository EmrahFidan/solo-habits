/* eslint-disable no-restricted-globals */
// Service Worker Global Scope

// 🔔 VERSION GÜNCELLE - Production ready v3.0.0 - Optimized
const CACHE_NAME = 'solo-leveling-v7-fixed';

// Cache edilecek dosyalar - Fixed list
const urlsToCache = [
  '/',
  '/manifest.json',  
  '/icon-192.png',
  '/icon-512.png'
  // Diğer dosyalar runtime'da cache edilecek
];

// Cache strategies
const RUNTIME_CACHE = 'solo-leveling-runtime-v1';
const API_CACHE = 'solo-leveling-api-v1';

// Service Worker Install Event
self.addEventListener('install', (event) => {
  // Eski cache'i hemen sil
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker Activate Event

// 🔔 MESSAGE LISTENER - Bildirim işlemleri için
self.addEventListener('message', (event) => {
  if (event.data.type === 'SETTINGS_UPDATED') {
    // Zamanlayıcıyı güncelle
    scheduleNotifications(event.data.settings);
  }
  if (event.data.type === 'START_SCHEDULER') {
    // Zamanlayıcıyı başlat
    startNotificationScheduler();
  }
});

// 🔔 NOTIFICATION CLICK LISTENER
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Bildirime tıklandı:', event.notification.tag, 'Action:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    console.log('❌ Bildirim kapatıldı');
    return;
  }
  
  // Uygulama açma işlemi
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      console.log('🔍 Açık window\'lar:', clientList.length);
      
      // Eğer uygulama zaten açıksa o tab'i getir
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('🎯 Mevcut window focus ediliyor');
          return client.focus();
        }
      }
      
      // Uygulama açık değilse yeni tab/window aç
      if (self.clients.openWindow) {
        console.log('📱 Yeni window açılıyor:', urlToOpen);
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// PUSH NOTIFICATION EVENT (Gelecekte server-side push için)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification alındı');
  
  let notificationData = {
    title: '⚡ ARISE',
    body: 'Alışkanlıklarını kontrol etme zamanı! 🎯',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };
  
  // Eğer push data varsa parse et
  if (event.data) {
    try {
      notificationData = JSON.parse(event.data.text());
    } catch (e) {
      console.error('Push data parse hatası:', e);
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    tag: 'solo-leveling-push',
    requireInteraction: false,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: '📱 Aç',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: '❌ Kapat'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// FETCH EVENT LISTENER
self.addEventListener('fetch', (event) => {
  // Sadece GET istekleri için cache kontrol et
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Development modunda cache'i bypass et
  if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa döndür
        if (response) {
          return response;
        }
        
        // Cache'de yoksa network'ten al
        return fetch(event.request)
          .then((response) => {
            // Geçerli response kontrolü
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Response'u clone et ve cache'e ekle
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// Background Sync (Opsiyonel)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      console.log('Background sync completed')
    );
  }
});

// 🔔 ZAMANLANMIŞ BİLDİRİM SİSTEMİ
let notificationScheduler = null;
let currentSettings = null;

// Bildirim ayarlarını güncelle
function scheduleNotifications(settings) {
  console.log('📅 Bildirim ayarları güncellendi:', settings);
  currentSettings = settings;
  
  // Eğer scheduler çalışıyorsa, ayarları güncelle
  if (notificationScheduler && settings.notifications && settings.notifications.enabled) {
    console.log('⏰ Bildirim saatleri:', settings.notifications.times);
  }
}

// Scheduler'ı başlat
function startNotificationScheduler() {
  // Her dakika kontrol et
  notificationScheduler = setInterval(() => {
    checkScheduledNotifications();
  }, 60000); // 60 saniye = 1 dakika
  
  // İlk kontrolü hemen yap
  checkScheduledNotifications();
}

// Zamanlanmış bildirimleri kontrol et
function checkScheduledNotifications() {
  if (!currentSettings || !currentSettings.notifications || !currentSettings.notifications.enabled) {
    return;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Bildirim saatlerini kontrol et
  const notificationTimes = currentSettings.notifications.times || [];
  
  if (notificationTimes.includes(currentTime)) {
    console.log('🔔 Bildirim zamanı:', currentTime);
    
    // Bildirim göster
    self.registration.showNotification('⚡ ARISE - Habit Reminder', {
      body: 'Alışkanlıklarını kontrol etme zamanı! 🎯',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'habit-reminder',
      requireInteraction: true,
      actions: [
        { action: 'open', title: '📱 Aç' },
        { action: 'dismiss', title: '❌ Kapat' }
      ]
    });
  }
}

// Client'dan gelen mesajları işle (ayarlar dahil)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { payload } = event.data;
    
    // Bildirim göster
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      tag: payload.tag || 'solo-leveling-notification',
      data: payload.data || {},
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false,
      timestamp: Date.now(),
      actions: [
        {
          action: 'open',
          title: '📱 Uygulamayı Aç',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: '❌ Kapat'
        }
      ]
    });
  }
  
  // Notification ayarlarını al
  if (event.data && event.data.type === 'SET_NOTIFICATION_SETTINGS') {
    const { settings } = event.data;
    
    // Ayarlarda belirtilen saatleri kontrol et
    if (settings && settings.notifications && settings.notifications.enabled) {
      const currentTime = event.data.currentTime;
      const notificationTimes = settings.notifications.times || [];
      
      // Eğer şu anki saat notification saatlerinden biriyse
      if (notificationTimes.includes(currentTime)) {
        // Scheduled notification gönder
        self.registration.showNotification('⚡ ARISE', {
          body: 'Alışkanlıklarını kontrol etme zamanı! 🎯\n\nTATAKAE challenge\'larını ve H- temiz streak\'ini güncellemen gerekiyor.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'scheduled-notification',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          silent: false,
          timestamp: Date.now(),
          actions: [
            {
              action: 'open',
              title: '🎯 Alışkanlıkları Kontrol Et',
              icon: '/icon-192.png'
            },
            {
              action: 'snooze',
              title: '⏰ 10dk Sonra Hatırlat'
            },
            {
              action: 'close',
              title: '❌ Kapat'
            }
          ]
        });
      }
    }
  }
  
  // Scheduler başlatma komutu
  if (event.data && event.data.type === 'START_SCHEDULER') {
    startNotificationScheduler();
  }
});

// Service Worker activate olduğunda scheduler'ı başlat
self.addEventListener('activate', (event) => {
  // Eski cache'leri temizle - Advanced cache management
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep current cache versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients
      self.clients.claim();
      
      // Notification scheduler'ı başlat
      startNotificationScheduler();
      
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const startTime = performance.now();
  
  // Original fetch logic...
  // (keeping existing fetch logic but adding performance monitoring)
  
  // Log performance metrics
  event.respondWith(
    handleFetch(event).then(response => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log slow requests (>1000ms)
      if (duration > 1000) {
        console.warn(`🐌 Slow request: ${event.request.url} took ${duration.toFixed(2)}ms`);
      }
      
      return response;
    })
  );
});

// Enhanced fetch handler
async function handleFetch(event) {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Firebase API requests - Network first, cache fallback
  if (request.url.includes('firestore.googleapis.com') || 
      request.url.includes('firebase.googleapis.com')) {
    try {
      const response = await fetch(request);
      
      // Cache successful responses
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('📱 Serving API from cache:', request.url);
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // Static assets - Cache first, network fallback
  if (request.url.includes('/static/') || 
      request.url.includes('.js') || 
      request.url.includes('.css') ||
      request.url.includes('.png') ||
      request.url.includes('.jpg') ||
      request.url.includes('.svg')) {
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch static asset:', request.url);
      throw error;
    }
  }
  
  // Default: Network first
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}
