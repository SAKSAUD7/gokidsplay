/*
 * Go Kids Play web app (service worker).
 *
 * - Pages always come from the network (prices, availability and bookings are
 *   never stale); with no signal an offline page is shown instead.
 * - Build files (/_next/static, never change) are kept on the phone.
 * - Photos and icons load from the phone and refresh in the background.
 * - Bookings, payments, accounts, the admin portal and the API are never cached.
 */
const VERSION = 'gkp-v2';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png', '/gokidsplay-logo.png'];
const MAX_IMAGES = 80;

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
        if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
        await self.clients.claim();
    })());
});

const NEVER = [/^\/api\//, /^\/admin/, /^\/account/, /^\/book\/success/, /^\/booking\//, /^\/_next\/data\//];

async function trimCache(name, max) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;          // API, SumUp, Google, maps: straight to the network
    if (NEVER.some((re) => re.test(url.pathname))) return;

    // Pages: network first, offline page if there is no connection
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const preloaded = await event.preloadResponse;
                return preloaded || await fetch(request);
            } catch {
                const cache = await caches.open(STATIC_CACHE);
                return (await cache.match(OFFLINE_URL)) || Response.error();
            }
        })());
        return;
    }
    // React Server Component requests (in-app navigation) must stay live
    if (request.headers.get('RSC') || url.searchParams.has('_rsc')) return;

    // Build files: content-hashed, so the cached copy is always right
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(caches.open(STATIC_CACHE).then(async (cache) => {
            const hit = await cache.match(request);
            if (hit) return hit;
            const response = await fetch(request);
            if (response.ok) cache.put(request, response.clone());
            return response;
        }));
        return;
    }

    // Photos and icons: from the phone, refreshed in the background
    if (/^\/(images|icons)\//.test(url.pathname) || url.pathname.startsWith('/_next/image')) {
        event.respondWith(caches.open(IMAGE_CACHE).then(async (cache) => {
            const hit = await cache.match(request);
            const refresh = fetch(request).then((response) => {
                if (response.ok) cache.put(request, response.clone()).then(() => trimCache(IMAGE_CACHE, MAX_IMAGES));
                return response;
            }).catch(() => hit);
            return hit || refresh;
        }));
    }
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
