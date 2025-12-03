/* eslint-env serviceworker */

importScripts('/cache-version.js');

const SW_CACHE_VERSION = '2025-02-15';
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${SW_CACHE_VERSION}`;
const HASHED_ASSET_PATTERN = /\/[_]astro\/.*\.(css|js|mjs|woff2?|svg)$/;
const NAVIGATION_FALLBACK = '/';
const MAX_CACHED_VERSIONS = 2;

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/', '/play', '/quests', '/settings'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//, /^\/_astro\//];

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
        caches.keys().then((keys) => {
            const precacheKeys = keys
                .filter((key) => key.startsWith(PRECACHE_PREFIX))
                .sort()
                .reverse();
            const runtimeKeys = keys
                .filter((key) => key.startsWith(RUNTIME_PREFIX))
                .sort()
                .reverse();

            const keysToKeep = new Set([
                ...precacheKeys.slice(0, MAX_CACHED_VERSIONS),
                ...runtimeKeys.slice(0, MAX_CACHED_VERSIONS),
            ]);

            const deletions = keys
                .filter(
                    (key) =>
                        (key.startsWith(PRECACHE_PREFIX) || key.startsWith(RUNTIME_PREFIX)) &&
                        !keysToKeep.has(key)
                )
                .map((key) => caches.delete(key));

            return Promise.all(deletions);
        })
    );
});

self.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') {
        return;
    }

    if (event.data.type === 'SKIP_WAITING') {
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

    if (request.mode === 'navigate' || request.destination === 'document') {
        return true;
    }

    if (url.pathname === CONFIG_PATH) {
        return true;
    }

    if (HASHED_ASSET_PATTERN.test(url.pathname)) {
        return true;
    }

    if (PRECACHE_URLS.includes(url.pathname)) {
        return true;
    }

    return RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname));
}

function handleConfigFetch(request) {
    return caches.open(RUNTIME_NAME).then((cache) =>
        fetch(new Request(request, { cache: 'reload' }))
            .then((response) => {
                if (response.ok) {
                    cache.put(CONFIG_PATH, response.clone());
                }
                return response;
            })
            .catch(() =>
                cache
                    .match(CONFIG_PATH)
                    .then((cached) => cached || caches.match(NAVIGATION_FALLBACK))
            )
    );
}

async function handleNavigation(request) {
    const cache = await caches.open(RUNTIME_NAME);

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const fallback = await caches.match(NAVIGATION_FALLBACK);
        if (fallback) {
            return fallback;
        }

        throw error;
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_NAME);
    const cachedResponse = await cache.match(request);

    const networkFetch = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cachedResponse || caches.match(NAVIGATION_FALLBACK));

    if (cachedResponse) {
        return cachedResponse;
    }

    return networkFetch;
}

async function cacheFirst(request) {
    const cache = await caches.open(RUNTIME_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const fallback = await caches.match(NAVIGATION_FALLBACK);
        if (fallback) {
            return fallback;
        }
        throw error;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (!shouldHandleRequest(request)) {
        return;
    }

    const url = new URL(request.url);
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(handleNavigation(request));
        return;
    }

    if (url.pathname === CONFIG_PATH) {
        event.respondWith(handleConfigFetch(request));
        return;
    }

    if (HASHED_ASSET_PATTERN.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});
