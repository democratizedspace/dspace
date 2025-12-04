import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const swPath = path.resolve(__dirname, '../frontend/public/service-worker.js');

function runServiceWorker(source: string, fetchImpl: typeof fetch) {
    const listeners: Record<string, (event: any) => void> = {};
    const waitUntilPromises: Promise<unknown>[] = [];
    const cachePut = vi.fn(async () => {});
    const cachesMock = {
        open: vi.fn(async () => ({
            put: cachePut,
            match: vi.fn(async () => undefined),
        })),
        keys: vi.fn(async () => []),
        delete: vi.fn(async () => true),
    };

    const context: any = {
        self: null,
        caches: cachesMock,
        fetch: fetchImpl,
        Request,
        Response,
        URL,
        console: { warn: () => {}, log: () => {} },
        importScripts: () => {},
    };

    context.self = context;
    context.addEventListener = (type: string, handler: (event: any) => void) => {
        listeners[type] = handler;
    };
    context.self.addEventListener = context.addEventListener;
    context.self.skipWaiting = vi.fn(async () => {});
    context.self.clients = { claim: vi.fn(async () => {}) };
    context.self.location = new URL('https://example.com');

    vm.runInNewContext(source, context, { filename: 'service-worker.js' });

    return { listeners, waitUntilPromises, cachePut };
}

describe('service worker install resilience', () => {
    it('resolves install even when precache entries return errors', async () => {
        const swSource = readFileSync(swPath, 'utf8').replace(
            'const PRECACHE_URLS = [];',
            "const PRECACHE_URLS = ['/missing-page'];"
        );
        const fetchMock = vi.fn(async () => new Response('missing', { status: 404 }));

        const { listeners, waitUntilPromises, cachePut } = runServiceWorker(swSource, fetchMock as any);

        await listeners.install({
            waitUntil: (promise: Promise<unknown>) => {
                waitUntilPromises.push(Promise.resolve(promise));
            },
        });

        await expect(Promise.all(waitUntilPromises)).resolves.toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
        expect(cachePut).not.toHaveBeenCalled();
    });
});
