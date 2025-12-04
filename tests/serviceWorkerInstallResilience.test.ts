import path from 'node:path';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

class FakeResponse {
    status: number;
    ok: boolean;

    constructor(status = 200) {
        this.status = status;
        this.ok = status >= 200 && status < 300;
    }

    clone() {
        return new FakeResponse(this.status);
    }

    static error() {
        return new FakeResponse(500);
    }
}

class FakeRequest {
    url: string;
    cache?: string;
    method: string;

    constructor(url: string, options: { cache?: string; method?: string } = {}) {
        this.url = url;
        this.cache = options.cache;
        this.method = options.method ?? 'GET';
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

describe('service worker install resilience', () => {
    it('completes install even when precache URLs return 404', async () => {
        const swPath = path.resolve(__dirname, '../frontend/public/service-worker.js');
        const swSource = readFileSync(swPath, 'utf8');

        const cachesStore = new Map<string, FakeCache>();
        const listeners = new Map<string, Array<(event: any) => void>>();
        const fetchLog: string[] = [];

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

        const fetch = async (input: string | FakeRequest) => {
            const url = typeof input === 'string' ? input : input.url ?? String(input);

            fetchLog.push(url);
            if (url.includes('manifest') || url.includes('favicon') || url.includes('logo.png')) {
                return new FakeResponse(404);
            }

            if (url.includes('config.json')) {
                return new FakeResponse(200);
            }

            return new FakeResponse(200);
        };

        const waitUntilPromises: Array<Promise<unknown>> = [];

        const selfRef: any = {
            addEventListener(type: string, handler: (event: any) => void) {
                const handlers = listeners.get(type) ?? [];
                handlers.push(handler);
                listeners.set(type, handlers);
            },
            clients: { claim: () => Promise.resolve(true) },
            skipWaiting: () => Promise.resolve(),
            location: { origin: 'https://example.test' },
        };

        const context: any = {
            caches: cacheApi,
            fetch,
            Request: FakeRequest,
            Response: FakeResponse,
            console,
            importScripts: () => {},
            self: selfRef,
        };

        Object.assign(selfRef, context);

        vm.runInNewContext(swSource, context);

        const installHandlers = listeners.get('install');
        expect(installHandlers?.length).toBeGreaterThan(0);

        installHandlers?.forEach((handler) =>
            handler({
                waitUntil(promise: Promise<unknown>) {
                    waitUntilPromises.push(promise);
                },
            })
        );

        await expect(Promise.all(waitUntilPromises)).resolves.toBeDefined();

        expect(fetchLog.some((url) => url.includes('manifest'))).toBe(true);

        const cachedEntries = Array.from(cachesStore.values()).flatMap((cache) =>
            Array.from(cache.store.keys())
        );
        expect(cachedEntries.some((entry) => entry.includes('config.json'))).toBe(true);
    });
});
