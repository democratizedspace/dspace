/* eslint-env serviceworker */

importScripts('/cache-version.js');

const SW_CACHE_VERSION = '2025-02-15';
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${SW_CACHE_VERSION}`;
const MAX_CACHE_HISTORY = 2;

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/', '/play', '/quests', '/settings'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//, /^\/_astro\//];
const NAVIGATION_FALLBACK = '/';
const ASSET_EXTENSIONS = [/\.css(\?.*)?$/i, /\.js(\?.*)?$/i];
let skipWaitingRequested = false;

function extractCacheVersion(cacheName, prefix) {
    if (!cacheName.startsWith(prefix)) {
        return null;
    }
    return cacheName.slice(prefix.length);
}

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
            .then((keys) => {
                const versions = new Set([SW_CACHE_VERSION]);

                keys.forEach((key) => {
                    const version =
                        extractCacheVersion(key, PRECACHE_PREFIX) ||
                        extractCacheVersion(key, RUNTIME_PREFIX);
                    if (version) {
                        versions.add(version);
                    }
                });

                const sortedVersions = Array.from(versions).sort((a, b) => b.localeCompare(a));
                const keepVersions = new Set(sortedVersions.slice(0, MAX_CACHE_HISTORY));

                return Promise.all(
                    keys.map((key) => {
                        const isPrecache = key.startsWith(PRECACHE_PREFIX);
                        const isRuntime = key.startsWith(RUNTIME_PREFIX);

                        if (!isPrecache && !isRuntime) {
                            return Promise.resolve(false);
                        }

                        const version = isPrecache
                            ? extractCacheVersion(key, PRECACHE_PREFIX)
                            : extractCacheVersion(key, RUNTIME_PREFIX);

                        if (version && keepVersions.has(version)) {
                            return Promise.resolve(false);
                        }

                        return caches.delete(key);
                    })
                );
            })
            .then(() => {
                if (skipWaitingRequested) {
                    return self.clients.claim();
                }
                return Promise.resolve();
            })
    );
});

self.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') {
        return;
    }

    if (event.data.type === 'SKIP_WAITING') {
        skipWaitingRequested = true;
        self.skipWaiting();
    }
});

function shouldHandleRequest(request) {
    if (request.method !== 'GET') {
        return false;
    }
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return false;
    }
    return true;
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

function handleNavigation(request) {
    return caches.open(PRECACHE_NAME).then((cache) =>
        fetch(request)
            .then((response) => {
                if (response && response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            })
            .catch(() =>
                cache.match(request).then((cached) => cached || cache.match(NAVIGATION_FALLBACK))
            )
    );
}

function isStaticAsset(pathname) {
    if (!pathname.startsWith('/_astro/')) {
        return false;
    }

    return ASSET_EXTENSIONS.some((pattern) => pattern.test(pathname));
}

function cacheFirstAsset(request) {
    return caches.match(request).then((cachedResponse) => {
        return fetch(request)
            .then((response) => {
                if (response.ok) {
                    caches
                        .open(RUNTIME_NAME)
                        .then((cache) => cache.put(request, response.clone()));
                    return response;
                }
                if (cachedResponse) {
                    return cachedResponse;
                }
                return response;
            })
            .catch(() => cachedResponse || Response.error());
    });
}

function handleRuntimeRequest(request) {
    return caches.match(request).then((cachedResponse) =>
        fetch(request)
            .then((response) => {
                if (response && response.ok) {
                    caches
                        .open(RUNTIME_NAME)
                        .then((cache) => cache.put(request, response.clone()));
                    return response;
                }
                return cachedResponse || response;
            })
            .catch(() => cachedResponse || caches.match(NAVIGATION_FALLBACK))
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

    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(handleNavigation(request));
        return;
    }

    if (PRECACHE_URLS.includes(url.pathname)) {
        event.respondWith(handleNavigation(request));
        return;
    }

    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstAsset(request));
        return;
    }

    if (RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname))) {
        event.respondWith(handleRuntimeRequest(request));
    }
});
