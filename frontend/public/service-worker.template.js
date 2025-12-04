/* eslint-env serviceworker */

importScripts('/cache-version.js');

const SW_CACHE_VERSION = '__CACHE_VERSION__';
self.CACHE_VERSION = SW_CACHE_VERSION;

const PRECACHE_PREFIX = 'dspace-precache-v';
const RUNTIME_PREFIX = 'dspace-runtime-v';
const PRECACHE_NAME = `${PRECACHE_PREFIX}${SW_CACHE_VERSION}`;
const RUNTIME_NAME = `${RUNTIME_PREFIX}${SW_CACHE_VERSION}`;
const NAVIGATION_CACHE = 'dspace-pages';
const MAX_CACHE_HISTORY = 2;

// Keep config flags on a runtime, network-first path so updates flow without waiting for a cache
// version bump. The install handler warms the runtime cache to support offline boots.
const CONFIG_PATH = '/config.json';
const PRECACHE_URLS = ['/manifest.webmanifest', '/favicon.ico', '/assets/logo.png'];
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
        fetch(new Request(CONFIG_PATH, { cache: 'no-store' }))
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

async function safePrecache(cache, urls) {
    for (const url of urls) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response?.ok) {
                await cache.put(url, response.clone());
            }
        } catch (error) {
            console.warn('Skipping precache entry due to fetch failure:', url, error);
        }
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(PRECACHE_NAME);
                await safePrecache(cache, PRECACHE_URLS);
            } catch (error) {
                console.warn('Service worker precache failed:', error);
            }

            try {
                await prewarmConfigCache();
            } catch (error) {
                console.warn('Service worker config prewarm failed:', error);
            }
        })()
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
                return false;
            })
    );
});

self.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') {
        return;
    }

    if (event.data.type === 'SKIP_WAITING') {
        skipWaitingRequested = true;
        event.waitUntil(self.skipWaiting());
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
        fetch(request, { cache: 'no-store' })
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
    const navigationRequest = new Request(request, { cache: 'no-store' });
    return caches.open(NAVIGATION_CACHE).then((cache) =>
        fetch(navigationRequest)
            .then((response) => {
                if (response && response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            })
            .catch(() =>
                cache
                    .match(request)
                    .then((cached) => cached || cache.match(NAVIGATION_FALLBACK))
                    .then((fallback) => fallback || Response.error())
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
    return caches.match(request).then((crossCacheMatch) =>
        caches.open(RUNTIME_NAME).then((cache) =>
            cache.match(request).then((cachedResponse) => {
                const cached = cachedResponse || crossCacheMatch;
                const networkFetch = fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                            return response;
                        }
                        if (cached) {
                            return cached;
                        }
                        return response;
                    })
                    .catch(() => cached || Response.error());

                if (cached) {
                    networkFetch.catch(() => {});
                    return cached;
                }

                return networkFetch;
            })
        )
    );
}

function handleRuntimeRequest(request) {
    return caches.open(RUNTIME_NAME).then((cache) =>
        cache.match(request).then((cachedResponse) =>
            fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        cache.put(request, response.clone());
                        return response;
                    }
                    return cachedResponse || response;
                })
                .catch(() => cachedResponse || caches.match(NAVIGATION_FALLBACK))
        )
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
