// MUKTalent · service worker v17. Instalación como app (PWA) para los paneles.
// Sólo gestiona navegaciones a /login, /admin y /portal: red primero y, sin conexión, una página offline.
// Nunca guarda respuestas de /api ni datos personales.
const VERSION = 'muk-v17-1';
const SHELL = ['/offline.html', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (r.mode === 'navigate' && /^\/(login|admin|portal|team)(\/|$)/.test(u.pathname)) {
    e.respondWith(fetch(r).catch(() => caches.match('/offline.html')));
  }
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => { const c = list.find(x => /\/(login|admin|portal)/.test(new URL(x.url).pathname)); return c ? c.focus() : self.clients.openWindow('/login/'); }));
});
