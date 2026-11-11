// Service worker for the SC Hydra app.
//
// It deliberately does not cache app pages or data: members, payments and
// attendance must always come fresh from the server. Its only jobs are to make
// the app installable and to show a friendly page when the phone is offline.

const CACHE = 'sc-hydra-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method === 'GET' && request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    } else if (request.method === 'GET' && request.url === new URL('/icons/icon-192.png', self.location).href) {
        event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
});
