// Service worker for the SC Hydra app.
//
// It never caches app pages or data: members, payments and attendance must always
// come fresh from the server. It does three things:
//  1. makes the app installable,
//  2. keeps the app's built files (JavaScript, CSS, fonts under /build/assets/) on the
//     device, so reopening the app does not download them again. Every release gives
//     these files new names, so a stored file is never out of date,
//  3. shows a friendly page when the phone is offline,
//  4. shows push notifications, and opens the right page when one is tapped.

const OFFLINE_CACHE = 'sc-hydra-offline-v3';
const ASSET_CACHE = 'sc-hydra-assets-v1';
const OFFLINE_URL = '/offline.html';
const MAX_ASSETS = 150; // older releases' files are dropped beyond this

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(OFFLINE_CACHE)
            .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    const keep = [OFFLINE_CACHE, ASSET_CACHE];

    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

// Keep the asset cache from growing forever: drop the oldest stored files
async function trimAssets() {
    const cache = await caches.open(ASSET_CACHE);
    const keys = await cache.keys();

    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((key) => cache.delete(key)));
}

// Built files: answer from the device when stored, otherwise download once and store
async function assetFromCacheFirst(request) {
    const cache = await caches.open(ASSET_CACHE);
    const stored = await cache.match(request);

    if (stored) {
        return stored;
    }

    const response = await fetch(request);

    if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
        trimAssets();
    }

    return response;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    } else if (url.origin === self.location.origin && url.pathname.startsWith('/build/assets/')) {
        event.respondWith(assetFromCacheFirst(request));
    } else if (url.href === new URL('/icons/icon-192.png', self.location).href) {
        event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
});

// A push notification arrived: show it (title = club name, body = what happened)
self.addEventListener('push', (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { body: event.data ? event.data.text() : '' };
    }

    // The number on the app's icon (iPhone home-screen app, installed app on a
    // computer; Android shows a dot by itself while a notification is waiting)
    const badge = Number(data.badge) || 0;
    const setBadge =
        'setAppBadge' in self.navigator
            ? (badge > 0 ? self.navigator.setAppBadge(badge) : self.navigator.clearAppBadge()).catch(() => {})
            : Promise.resolve();

    event.waitUntil(
        Promise.all([
            setBadge,
            self.registration.showNotification(data.title || 'SC Hydra', {
                body: data.body || '',
                icon: '/icons/icon-192.png',
                data: { url: data.url || '/dashboard' },
            }),
        ]),
    );
});

// A push notification was tapped: bring the app forward on that page
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            const open = windows.find((client) => new URL(client.url).origin === self.location.origin);

            if (open) {
                return open
                    .focus()
                    .then((client) => (client || open).navigate(url))
                    .catch(() => self.clients.openWindow(url));
            }

            return self.clients.openWindow(url);
        }),
    );
});
