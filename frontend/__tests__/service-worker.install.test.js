/* eslint-disable global-require */

describe('service worker install', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        delete global.caches;
        delete global.importScripts;
        delete global.self;
        jest.resetModules();
        jest.restoreAllMocks();
    });

    function setupEnvironment() {
        const listeners = {};

        global.importScripts = jest.fn();
        global.fetch = jest.fn().mockRejectedValue(new Error('network failure'));

        const cache = {
            put: jest.fn(),
            match: jest.fn().mockResolvedValue(undefined),
        };

        global.caches = {
            open: jest.fn().mockResolvedValue(cache),
            keys: jest.fn().mockResolvedValue([]),
            delete: jest.fn().mockResolvedValue(true),
            match: jest.fn().mockResolvedValue(undefined),
        };

        global.self = {
            addEventListener: (type, handler) => {
                listeners[type] = handler;
            },
            skipWaiting: jest.fn().mockResolvedValue(undefined),
            clients: { claim: jest.fn().mockResolvedValue(undefined) },
            location: { origin: 'https://example.com' },
        };

        return listeners;
    }

    test('install completes even when precache fetches fail', async () => {
        const listeners = setupEnvironment();

        jest.isolateModules(() => {
            require('../public/service-worker.js');
        });

        const waitUntilPromises = [];
        listeners.install({
            waitUntil: (promise) => {
                waitUntilPromises.push(promise);
            },
        });

        expect(waitUntilPromises.length).toBeGreaterThan(0);
        await Promise.all(waitUntilPromises);

        expect(global.fetch).toHaveBeenCalled();
    });
});
