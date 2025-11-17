/* eslint-env serviceworker */

importScripts('/cache-version.js');

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${self.CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${self.CACHE_VERSION}`;

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/', '/play', '/quests', '/settings'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//];

function prewarmConfigCache() {
    return caches.open(RUNTIME_NAME).then((cache) =>
        fetch(new Request(CONFIG_PATH, { cache: 'reload' }))
            .then((response) => {
                if (response.ok) {
                    cache.put(CONFIG_PATH, response.clone());
                }
            })
            .catch((error) => {
                console.warn('Service worker could not prewarm config cache:', error);
            })
    );
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(PRECACHE_NAME)
            .then((cache) =>
                cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })))
            )
            .catch((error) => {
                console.warn('Service worker precache failed:', error);
            })
            .then(() => prewarmConfigCache())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        const isPrecache = key.startsWith(PRECACHE_PREFIX);
                        const isRuntime = key.startsWith(RUNTIME_PREFIX);
                        if (key === PRECACHE_NAME || key === RUNTIME_NAME) {
                            return Promise.resolve(false);
                        }
                        if (isPrecache || isRuntime) {
                            return caches.delete(key);
                        }
                        return Promise.resolve(false);
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

function shouldHandleRequest(request) {
    if (request.method !== 'GET') {
        return false;
    }
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return false;
    }
    if (url.pathname === CONFIG_PATH) {
        return true;
    }
    if (PRECACHE_URLS.includes(url.pathname)) {
        return true;
    }
    return RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname));
}

function handleConfigFetch(request) {
    return caches.open(RUNTIME_NAME).then((cache) =>
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    cache.put(CONFIG_PATH, response.clone());
                }
                return response;
            })
            .catch(() => cache.match(CONFIG_PATH).then((cached) => cached || caches.match('/')))
    );
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (!shouldHandleRequest(request)) {
        return;
    }

    const url = new URL(request.url);
    if (url.pathname === CONFIG_PATH) {
        event.respondWith(handleConfigFetch(request));
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return caches.open(RUNTIME_NAME).then((cache) =>
                fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => caches.match('/'))
            );
        })
    );
});
