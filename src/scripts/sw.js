import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';


precacheAndRoute(self.__WB_MANIFEST,
  { url: '/index.html', revision: null },
  { url: '/index.js', revision: null },
);

registerRoute(
  ({ url }) => url.origin === 'https://restaurant-api.dicoding.dev',
  new StaleWhileRevalidate({
    cacheName: 'restaurant-data',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, 
      }),
    ],
  })
);

self.addEventListener('install', () => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Pushed');

  const dataJson = event.data.json();
  const notification = {
    title: dataJson.title,
    options: {
      body: dataJson.options.body,
      icon: dataJson.options.icon,
      image: dataJson.options.image,
    },
  };

  event.waitUntil(self.registration.showNotification(notification.title, notification.options));
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/images/heros/'), // Pastikan path sesuai dengan lokasi ikon di manifest
  new CacheFirst({
    cacheName: 'icons-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 Minggu
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image', // Menangani semua gambar
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50, // Batas jumlah gambar yang di-cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // Cache selama 30 hari
      }),
    ],
  })
);
