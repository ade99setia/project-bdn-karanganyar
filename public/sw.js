const STATIC_CACHE = 'bdn-static-v3';
const NAV_CACHE = 'bdn-nav-v3';
const API_CACHE = 'bdn-api-v3';
const OFFLINE_PAGE = '/offline.html';
const LAUNCHER_PAGE = '/index.html';

function buildOfflineUrl(fromUrl) {
    const offlineUrl = new URL(OFFLINE_PAGE, self.location.origin);

    if (fromUrl?.pathname && fromUrl.pathname !== OFFLINE_PAGE) {
        offlineUrl.searchParams.set('from', `${fromUrl.pathname}${fromUrl.search || ''}`);
    }

    return offlineUrl.toString();
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll([OFFLINE_PAGE, LAUNCHER_PAGE, '/favicon.ico'])),
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => ![STATIC_CACHE, NAV_CACHE, API_CACHE].includes(key))
                    .map((key) => caches.delete(key)),
            ),
        ),
    );
    self.clients.claim();
});

async function networkFirst(request, cacheName, fallbackPath) {
    const cache = await caches.open(cacheName);
    const requestUrl = new URL(request.url);

    async function fallbackResponse() {
        if (!fallbackPath) {
            return null;
        }

        if (requestUrl.pathname !== fallbackPath) {
            return Response.redirect(buildOfflineUrl(requestUrl), 302);
        }

        const fallback = await caches.match(fallbackPath, { ignoreSearch: true });
        return fallback || null;
    }

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
            return response;
        }

        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) {
            return cached;
        }

        const fallback = await fallbackResponse();
        if (fallback) {
            return fallback;
        }

        return response;
    } catch {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) {
            return cached;
        }

        const fallback = await fallbackResponse();
        if (fallback) {
            return fallback;
        }

        throw new Error('No network and no cache');
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    if (response && response.ok) {
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;

    if (request.method !== 'GET') {
        return;
    }

    if (isSameOrigin && (request.mode === 'navigate' || request.destination === 'document')) {
        event.respondWith(networkFirst(request, NAV_CACHE, OFFLINE_PAGE));
        return;
    }

    if (isSameOrigin && (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/models/'))) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    if (isSameOrigin && (url.pathname.startsWith('/sales/') || url.pathname.startsWith('/supervisor/') || url.pathname.startsWith('/dashboard'))) {
        event.respondWith(networkFirst(request, API_CACHE));
    }
});
