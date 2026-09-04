// Service worker for PWA installability without navigation overhead
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    // Claim control immediately
    e.waitUntil(clients.claim());
});
