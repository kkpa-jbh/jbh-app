// Kill switch for the old JBH service worker.
//
// The old worker answered every request from its cache first, including index.html and /jbh-api calls,
// so browsers kept showing an old app version and old data after a deploy. Browsers that still have it
// fetch this file on their next visit (the bytes changed), install it, and this worker then deletes every
// cache, unregisters itself and reloads the open tabs from the network.
//
// Keep this file published for some months, so browsers that visit rarely also get cleaned. It has no
// fetch handler on purpose: every request goes to the network.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach((client) => client.navigate(client.url));
  })());
});
