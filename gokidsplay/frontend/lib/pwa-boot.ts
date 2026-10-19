// Server-safe (no "use client"): inlined into <head> by app/layout.tsx. See lib/pwa.ts.
/** Runs in <head> before React: keep the install event and register the service worker. */
export const PWA_BOOT_SCRIPT = `
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__gkpInstallPrompt = e;
  window.dispatchEvent(new Event('gkp-installable'));
});
window.addEventListener('appinstalled', function () { window.__gkpInstallPrompt = undefined; });
if ('serviceWorker' in navigator && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}`;
