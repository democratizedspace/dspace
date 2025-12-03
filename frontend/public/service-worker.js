/* eslint-env serviceworker */

importScripts('/cache-version.js');

const SW_CACHE_VERSION = '2025-02-15';
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const ASSET_PREFIX = 'dspace-assets-v';

const PRECACHE_NAME = `${PRECACHE_PREFIX}${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${SW_CACHE_VERSION}`;
const ASSET_CACHE_NAME = `${ASSET_PREFIX}${SW_CACHE_VERSION}`;

const CACHE_PREFIXES = [PRECACHE_PREFIX, RUNTIME_PREFIX, ASSET_PREFIX];

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/', '/play', '/quests', '/settings'];
const RUNTIME_MATCHERS = [/^\/quests\//, /^\/assets\//, /^\/docs\//];
const ASSET_MATCHERS = [/^\/_astro\//];

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

async function retainRecentCaches(prefix, keep = 2) {
    const keys = await caches.keys();
    const matching = keys.filter((key) => key.startsWith(prefix));

    const sorted = matching.sort().reverse();
    const stale = sorted.slice(keep);

    await Promise.all(stale.map((key) => caches.delete(key)));
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
    event.waitUntil(Promise.all(CACHE_PREFIXES.map((prefix) => retainRecentCaches(prefix))));
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
    return (
        url.pathname === CONFIG_PATH ||
        ASSET_MATCHERS.some((regex) => regex.test(url.pathname)) ||
        PRECACHE_URLS.includes(url.pathname) ||
        RUNTIME_MATCHERS.some((regex) => regex.test(url.pathname)) ||
        request.mode === 'navigate'
    );
}

function isNavigationRequest(request) {
    if (request.mode === 'navigate') {
        return true;
    }
    const accept = request.headers.get('accept') || '';
    return accept.includes('text/html');
}

function isAssetRequest(url) {
    return ASSET_MATCHERS.some((regex) => regex.test(url.pathname));
}

async function handleConfigFetch(request) {
    const cache = await caches.open(RUNTIME_NAME);
    try {
        const response = await fetch(request, { cache: 'reload' });
        if (response.ok) {
            cache.put(CONFIG_PATH, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(CONFIG_PATH);
        if (cached) {
            return cached;
        }
        const fallback = await caches.match('/');
        if (fallback) {
            return fallback;
        }
        throw error;
    }
}

async function networkFirstNavigation(request) {
    const cache = await caches.open(PRECACHE_NAME);
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        const fallback = await caches.match('/');
        if (fallback) {
            return fallback;
        }
        throw error;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
        .then(async (response) => {
            if (response && response.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    if (cached) {
        return cached;
    }

    const networkResponse = await fetchPromise;
    if (networkResponse) {
        return networkResponse;
    }

    const fallback = await caches.match('/');
    if (fallback) {
        return fallback;
    }
    return new Response(null, { status: 504 });
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

    if (isNavigationRequest(request)) {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    if (isAssetRequest(url)) {
        event.respondWith(staleWhileRevalidate(request, ASSET_CACHE_NAME));
        return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_NAME));
});
