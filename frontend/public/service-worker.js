/* eslint-env serviceworker */

importScripts('/cache-version.js');

const SW_CACHE_VERSION = '2025-02-15';
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${SW_CACHE_VERSION}`;
const MAX_CACHE_VERSIONS_TO_KEEP = 2;

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/', '/play', '/quests', '/settings'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//];
const HASHED_ASSET_PATH = /^\/_astro\//;

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

function retainRecentCaches(keys, prefix) {
    const versions = keys
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length))
        .filter(Boolean)
        .sort();

    const keep = new Set(
        versions.slice(-MAX_CACHE_VERSIONS_TO_KEEP).map((version) => `${prefix}${version}`)
    );

    return keys
        .filter((key) => key.startsWith(prefix) && !keep.has(key))
        .map((key) => caches.delete(key));
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
                Promise.all([
                    ...retainRecentCaches(keys, PRECACHE_PREFIX),
                    ...retainRecentCaches(keys, RUNTIME_PREFIX),
                ])
            )
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

async function handleConfigFetch(request) {
    const cache = await caches.open(RUNTIME_NAME);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(CONFIG_PATH, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('Config fetch failed, using cache when available:', error);
        const cached = await cache.match(CONFIG_PATH);
        if (cached) {
            return cached;
        }
        const fallback = await caches.match('/');
        return fallback || Response.error();
    }
}

async function handleNavigation(event) {
    const { request } = event;
    const cache = await caches.open(PRECACHE_NAME);

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
            return response;
        }
    } catch (error) {
        console.warn('Navigation fetch failed, falling back to cache:', error);
    }

    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }

    const fallback = await caches.match('/');
    return fallback || Response.error();
}

async function updateAssetCache(cache, request) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('Asset fetch failed while refreshing cache:', error);
        return undefined;
    }
}

async function handleAssetRequest(event) {
    const { request } = event;
    const cache = await caches.open(RUNTIME_NAME);
    const cached = await cache.match(request);

    const networkPromise = updateAssetCache(cache, request);

    if (cached) {
        event.waitUntil(networkPromise);
        return cached;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) {
        return networkResponse;
    }

    return cached || Response.error();
}

async function handleCacheFirst(request) {
    const cache = await caches.open(RUNTIME_NAME);
    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('Runtime fetch failed, attempting precache fallback:', error);
        const fallback = await caches.match(request);
        if (fallback) {
            return fallback;
        }
        return caches.match('/') || Response.error();
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(event));
        return;
    }

    if (url.pathname === CONFIG_PATH) {
        event.respondWith(handleConfigFetch(request));
        return;
    }

    if (
        HASHED_ASSET_PATH.test(url.pathname) ||
        request.destination === 'style' ||
        request.destination === 'script'
    ) {
        event.respondWith(handleAssetRequest(event));
        return;
    }

    if (
        PRECACHE_URLS.includes(url.pathname) ||
        RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname))
    ) {
        event.respondWith(handleCacheFirst(request));
    }
});
