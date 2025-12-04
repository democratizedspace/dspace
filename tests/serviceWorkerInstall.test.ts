import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createCacheKey(request: RequestInfo | URL) {
    return typeof request === 'string' || request instanceof URL ? String(request) : request.url;
}

describe('service worker install resilience', () => {
    const originalSelf = globalThis.self;
    const originalCaches = globalThis.caches;
    const originalFetch = globalThis.fetch;
    const originalImportScripts = globalThis.importScripts;
    const originalLocation = globalThis.location;
    let runInstall: ((urls?: string[]) => Promise<void>) | undefined;

    beforeEach(async () => {
        vi.resetModules();

        const listeners = new Map<string, EventListener>();
        const cacheStore = new Map<string, Response>();
        const mockCache = {
            put: vi.fn(async (request: RequestInfo | URL, response: Response) => {
                cacheStore.set(createCacheKey(request), response);
            }),
            match: vi.fn(async (request: RequestInfo | URL) => cacheStore.get(createCacheKey(request))),
        } as unknown as Cache;

        const cachesOpen = vi.fn(async () => mockCache);
        const cachesKeys = vi.fn(async () => [] as string[]);
        const cachesDelete = vi.fn(async () => true);

        // @ts-expect-error - assign test doubles
        globalThis.caches = { open: cachesOpen, keys: cachesKeys, delete: cachesDelete } as unknown as CacheStorage;
        globalThis.fetch = vi.fn(async () => new Response('missing', { status: 404 }));
        globalThis.importScripts = vi.fn();

        const selfMock: ServiceWorkerGlobalScope = {
            addEventListener: (type: string, handler: EventListener) => listeners.set(type, handler),
            clients: { claim: vi.fn() } as unknown as Clients,
            location: { origin: 'http://localhost' } as unknown as WorkerLocation,
        } as ServiceWorkerGlobalScope;

        // @ts-expect-error - allow mutation for tests
        globalThis.self = selfMock;

        // Ensure relative requests can resolve during tests.
        // @ts-expect-error - partial location shape is sufficient here
        globalThis.location = { origin: 'http://localhost', href: 'http://localhost/' };

        await import('../frontend/public/service-worker.js');

        runInstall = (globalThis.self as any).__DS_SW_TEST?.runInstall;
        expect(runInstall).toBeTypeOf('function');
    });

    afterEach(() => {
        // @ts-expect-error - restore globals
        globalThis.self = originalSelf;
        // @ts-expect-error - restore globals
        globalThis.caches = originalCaches;
        globalThis.fetch = originalFetch;
        globalThis.importScripts = originalImportScripts;
        // @ts-expect-error - restore globals
        globalThis.location = originalLocation;
        runInstall = undefined;
    });

    it('continues installation when precache responses are not OK', async () => {
        const precacheUrls = ['/missing-one', '/still-missing'];
        const fetchMock = vi.fn(async () => new Response('not found', { status: 404 }));
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(runInstall?.(precacheUrls)).resolves.toBeUndefined();

        const requestedUrls = (fetchMock.mock.calls || []).map(([arg]) =>
            arg instanceof Request ? arg.url : String(arg)
        );
        precacheUrls.forEach((url) => {
            expect(requestedUrls.some((requested) => requested.includes(url))).toBe(true);
        });
    });

    it('skips over rejected fetches without failing install', async () => {
        let callCount = 0;
        const fetchMock = vi.fn(async () => {
            callCount += 1;
            if (callCount === 1) {
                throw new Error('network down');
            }
            return new Response('ok', { status: 200 });
        });
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(runInstall?.(['/unstable', '/stable'])).resolves.toBeUndefined();

        const requestedUrls = (fetchMock.mock.calls || []).map(([arg]) =>
            arg instanceof Request ? arg.url : String(arg)
        );
        expect(requestedUrls.some((url) => url.includes('/unstable'))).toBe(true);
        expect(requestedUrls.some((url) => url.includes('/stable'))).toBe(true);
    });
});
