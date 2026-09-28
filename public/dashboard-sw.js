const CACHE_NAME = 'educalizando-creator-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('educalizando-creator-') && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    )).then(() => self.clients.claim()),
  );
});

// O painel contém dados financeiros e pessoais. O aplicativo permanece
// instalável, mas sempre busca páginas e dados atualizados na rede em vez de
// guardar conteúdo sensível em cache offline.
self.addEventListener('fetch', () => {});
