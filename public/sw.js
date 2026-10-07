// Service worker Nsokoze — installation PWA + consultation hors ligne minimale.
//  * Pages (navigation) : réseau d'abord, sinon la dernière coquille en cache.
//  * Fichiers /assets/* (noms hachés par Vite, donc immuables) : cache d'abord.
//  * Tout le reste (Supabase, tuiles de carte, Unsplash…) : jamais mis en cache,
//    pour ne jamais afficher de créneaux ou de RDV périmés.
const VERSION = 'nsokoze-v1'
const COQUILLE = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((rep) => {
          const copie = rep.clone()
          caches.open(VERSION).then((c) => c.put('/', copie))
          return rep
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (enCache) =>
          enCache ||
          fetch(req).then((rep) => {
            const copie = rep.clone()
            caches.open(VERSION).then((c) => c.put(req, copie))
            return rep
          })
      )
    )
  }
})
