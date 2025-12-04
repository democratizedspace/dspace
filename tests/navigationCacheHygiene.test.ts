import path from 'node:path';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

class FakeResponse {
    status: number;
    ok: boolean;
    private _headers: Map<string, string>;
    private _body: string;

    constructor(status = 200, body = '', headers: Record<string, string> = {}) {
        this.status = status;
        this.ok = status >= 200 && status < 300;
        this._body = body;
        this._headers = new Map(Object.entries(headers));
    }

    clone() {
        const headers: Record<string, string> = {};
        this._headers.forEach((value, key) => {
            headers[key] = value;
        });
        return new FakeResponse(this.status, this._body, headers);
    }

    get headers() {
        return {
            get: (name: string) => this._headers.get(name.toLowerCase()) || null,
        };
    }

    static error() {
        return new FakeResponse(500);
    }
}

class FakeRequest {
    url: string;
    cache?: string;
    method: string;
    mode?: string;
    private _headers: Map<string, string>;

    constructor(
        url: string,
        options: { cache?: string; method?: string; mode?: string; headers?: Record<string, string> } = {}
    ) {
        this.url = url;
        this.cache = options.cache;
        this.method = options.method ?? 'GET';
        this.mode = options.mode;
        this._headers = new Map(Object.entries(options.headers || {}));
    }

    get headers() {
        return {
            get: (name: string) => this._headers.get(name.toLowerCase()) || null,
        };
    }
}

class FakeCache {
    name: string;
    store: Map<string, FakeResponse>;

    constructor(name: string) {
        this.name = name;
        this.store = new Map();
    }

    async put(request: string | FakeRequest, response: FakeResponse) {
        const key = typeof request === 'string' ? request : request.url;
        this.store.set(key, response);
    }

    async match(request: string | FakeRequest) {
        const key = typeof request === 'string' ? request : request.url;
        return this.store.get(key);
    }
}

describe('service worker navigation cache hygiene', () => {
    it('does not reuse stale HTML across SW versions after activation', async () => {
        const swPath = path.resolve(__dirname, '../frontend/public/service-worker.js');
        const swSource = readFileSync(swPath, 'utf8');

        const cachesStore = new Map<string, FakeCache>();
        const listeners = new Map<string, Array<(event: any) => void>>();

        // Simulate first deployment
        const firstVersion = '2025-01-01';

        // Simulate second deployment with new version
        const secondVersion = '2025-02-01';
        const secondHtml = `<!DOCTYPE html><html><head><link href="/_astro/new-styles.css" rel="stylesheet"></head></html>`;

        const cacheApi = {
            async open(name: string) {
                if (!cachesStore.has(name)) {
                    cachesStore.set(name, new FakeCache(name));
                }
                return cachesStore.get(name)!;
            },
            async keys() {
                return Array.from(cachesStore.keys());
            },
            async delete(name: string) {
                return cachesStore.delete(name);
            },
            async match(request: string | FakeRequest) {
                for (const cache of cachesStore.values()) {
                    const match = await cache.match(request);
                    if (match) {
                        return match;
                    }
                }
                return undefined;
            },
        };

        // Pre-populate caches with old version data
        const oldNavigationCache = await cacheApi.open(`dspace-pages-v${firstVersion}`);
        const oldPrecache = await cacheApi.open(`dspace-precache-v${firstVersion}`);
        const oldRuntime = await cacheApi.open(`dspace-runtime-v${firstVersion}`);

        await oldNavigationCache.put(
            'https://example.test/',
            new FakeResponse(200, '<html>old</html>', { 'content-type': 'text/html' })
        );

        const fetch = async (input: string | FakeRequest) => {
            const url = typeof input === 'string' ? input : input.url ?? String(input);

            // Return new HTML for navigation requests
            if (url === 'https://example.test/' || url === '/') {
                return new FakeResponse(200, secondHtml, { 'content-type': 'text/html' });
            }

            if (url.includes('config.json')) {
                return new FakeResponse(200, '{}', { 'content-type': 'application/json' });
            }

            if (url.includes('manifest') || url.includes('favicon') || url.includes('logo.png')) {
                return new FakeResponse(200, '', { 'content-type': 'image/png' });
            }

            return new FakeResponse(200);
        };

        const selfRef: any = {
            addEventListener(type: string, handler: (event: any) => void) {
                const handlers = listeners.get(type) ?? [];
                handlers.push(handler);
                listeners.set(type, handlers);
            },
            clients: {
                claim: () => Promise.resolve(true),
                matchAll: () => Promise.resolve([{ id: 'test-client' }]),
            },
            skipWaiting: () => Promise.resolve(),
            location: { origin: 'https://example.test' },
        };

        const context: any = {
            caches: cacheApi,
            fetch,
            Request: FakeRequest,
            Response: FakeResponse,
            console,
            importScripts: () => {
                selfRef.CACHE_VERSION = secondVersion;
            },
            self: selfRef,
            URL: URL,
        };

        Object.assign(selfRef, context);

        // Replace the version in SW source for the test
        const swSourceWithVersion = swSource.replace(
            /const SW_CACHE_VERSION = '[^']+';/,
            `const SW_CACHE_VERSION = '${secondVersion}';`
        );

        vm.runInNewContext(swSourceWithVersion, context);

        // Verify old caches exist before activation
        const cachesBeforeActivate = await cacheApi.keys();
        expect(cachesBeforeActivate).toContain(`dspace-pages-v${firstVersion}`);
        expect(cachesBeforeActivate).toContain(`dspace-precache-v${firstVersion}`);
        expect(cachesBeforeActivate).toContain(`dspace-runtime-v${firstVersion}`);

        // Trigger activate event to clean up old caches
        const activateHandlers = listeners.get('activate');
        expect(activateHandlers?.length).toBeGreaterThan(0);

        const waitUntilPromises: Array<Promise<unknown>> = [];
        activateHandlers?.forEach((handler) =>
            handler({
                waitUntil(promise: Promise<unknown>) {
                    waitUntilPromises.push(promise);
                },
            })
        );

        await expect(Promise.all(waitUntilPromises)).resolves.toBeDefined();

        // After activation:
        // - Old navigation cache should be deleted (only current version kept)
        // - Old precache/runtime should be kept (MAX_CACHE_HISTORY = 2)
        const remainingCaches = await cacheApi.keys();
        
        // Navigation cache: only current version
        expect(remainingCaches).not.toContain(`dspace-pages-v${firstVersion}`);
        
        // Runtime/precache: old versions should still be there (multi-version support)
        expect(remainingCaches).toContain(`dspace-precache-v${firstVersion}`);
        expect(remainingCaches).toContain(`dspace-runtime-v${firstVersion}`);
    });

    it('prevents HTML from being cached in runtime caches', async () => {
        const swPath = path.resolve(__dirname, '../frontend/public/service-worker.js');
        const swSource = readFileSync(swPath, 'utf8');

        const cachesStore = new Map<string, FakeCache>();
        const listeners = new Map<string, Array<(event: any) => void>>();

        const cacheApi = {
            async open(name: string) {
                if (!cachesStore.has(name)) {
                    cachesStore.set(name, new FakeCache(name));
                }
                return cachesStore.get(name)!;
            },
            async keys() {
                return Array.from(cachesStore.keys());
            },
            async delete(name: string) {
                return cachesStore.delete(name);
            },
            async match() {
                return undefined;
            },
        };

        const fetch = async (input: string | FakeRequest) => {
            const url = typeof input === 'string' ? input : input.url ?? String(input);

            // Return HTML for a runtime-matched path
            if (url.includes('/quests/')) {
                return new FakeResponse(200, '<html>Quest HTML</html>', {
                    'content-type': 'text/html',
                });
            }

            // Return JSON for config
            if (url.includes('config.json')) {
                return new FakeResponse(200, '{}', { 'content-type': 'application/json' });
            }

            return new FakeResponse(200, 'asset content', { 'content-type': 'text/css' });
        };

        const selfRef: any = {
            addEventListener(type: string, handler: (event: any) => void) {
                const handlers = listeners.get(type) ?? [];
                handlers.push(handler);
                listeners.set(type, handlers);
            },
            clients: {
                claim: () => Promise.resolve(true),
                matchAll: () => Promise.resolve([]),
            },
            skipWaiting: () => Promise.resolve(),
            location: { origin: 'https://example.test' },
        };

        const context: any = {
            caches: cacheApi,
            fetch,
            Request: FakeRequest,
            Response: FakeResponse,
            console,
            importScripts: () => {
                selfRef.CACHE_VERSION = '2025-02-01';
            },
            self: selfRef,
            URL: URL,
        };

        Object.assign(selfRef, context);

        vm.runInNewContext(swSource, context);

        // Trigger install to set up caches
        const installHandlers = listeners.get('install');
        const installWaitUntil: Array<Promise<unknown>> = [];
        installHandlers?.forEach((handler) =>
            handler({
                waitUntil(promise: Promise<unknown>) {
                    installWaitUntil.push(promise);
                },
            })
        );
        await Promise.all(installWaitUntil);

        // Simulate a fetch for a quest page (which matches RUNTIME_MATCHERS)
        const fetchHandlers = listeners.get('fetch');
        expect(fetchHandlers?.length).toBeGreaterThan(0);

        let capturedResponse: FakeResponse | undefined;
        const questRequest = new FakeRequest('https://example.test/quests/play/1', {
            method: 'GET',
        });

        fetchHandlers?.[0]({
            request: questRequest,
            respondWith(response: Promise<FakeResponse>) {
                response.then((r) => {
                    capturedResponse = r;
                });
            },
        });

        // Wait for async handling
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Check that HTML was NOT cached in RUNTIME cache
        const runtimeCache = cachesStore.get('dspace-runtime-v2025-02-01');
        if (runtimeCache) {
            const cachedHtml = await runtimeCache.match(questRequest);
            expect(cachedHtml).toBeUndefined();
        }

        // Response should still be served successfully
        expect(capturedResponse?.ok).toBe(true);
    });
});
