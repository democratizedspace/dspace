/* eslint-env serviceworker */

importScripts('/cache-version.js');

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${self.CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${self.CACHE_VERSION}`;

const PRECACHE_URLS = ['/', '/play', '/quests', '/settings', '/config.json'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//, /^\/config\.json$/];

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
    if (PRECACHE_URLS.includes(url.pathname)) {
        return true;
    }
    return RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (!shouldHandleRequest(request)) {
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
