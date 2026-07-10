importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
const { registerRoute } = workbox.routing;
self.__WB_DISABLE_DEV_LOGS = true

// 使用示例
registerRoute(
  ({ url }) => url.protocol=='http:',
  new workbox.strategies.NetworkOnly
);
registerRoute(
  ({ request }) => /script|stylesheet/.test(request.destination),
  new workbox.strategies.CacheFirst
);
registerRoute(
  ({ request }) => request.destination == 'image',
  new workbox.strategies.CacheFirst
);
