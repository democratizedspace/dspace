/** @jest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import '../vitest.setup';

let loadHandlers;
let serviceWorker;
let originalLocation;
let consoleWarnSpy;
let consoleInfoSpy;

const mockFetchResponse = (data, ok = true, status = 200) =>
    Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(data),
    });

async function dispatchLoad() {
    for (const handler of loadHandlers) {
        await handler(new Event('load'));
    }
}

describe('registerOfflineWorker', () => {
    beforeEach(async () => {
        loadHandlers = [];

        process.env.DSPACE_OFFLINE_WORKER_ENABLED = 'true';
        process.env.DSPACE_OFFLINE_WORKER_DISABLED = 'false';

        vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
            if (event === 'load') {
                loadHandlers.push(handler);
            }
        });

        vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

        originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                href: 'http://localhost/',
                reload: vi.fn(),
            },
        });

        serviceWorker = {
            register: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            controller: {},
        };

        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: serviceWorker,
        });

        global.fetch = vi.fn();
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        loadHandlers = [];
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
        delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
        delete process.env.DSPACE_OFFLINE_WORKER_DISABLED;
    });

    it('registers service worker when enabled and triggers waiting update', async () => {
        const waitingWorker = { postMessage: vi.fn() };
        const controllerChangeHandlers = [];

        serviceWorker.addEventListener.mockImplementation((event, handler, options) => {
            if (event === 'controllerchange') {
                controllerChangeHandlers.push({ handler, options });
            }
        });

        serviceWorker.register.mockResolvedValue({ waiting: waitingWorker });
        fetch.mockImplementation(() => mockFetchResponse({ offlineWorker: { enabled: true } }));

        const { registerOfflineWorker } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        registerOfflineWorker();
        await dispatchLoad();

        expect(serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
        expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        expect(controllerChangeHandlers).toHaveLength(1);
        expect(controllerChangeHandlers[0].options).toEqual({ once: true });

        controllerChangeHandlers[0].handler();

        expect(serviceWorker.removeEventListener).toHaveBeenCalledWith(
            'controllerchange',
            controllerChangeHandlers[0].handler
        );
        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('registers service worker when installing worker reaches installed state', async () => {
        const waitingWorker = { postMessage: vi.fn() };
        const installingWorker = { addEventListener: vi.fn(), state: 'installing' };
        const controllerChangeHandlers = [];

        serviceWorker.addEventListener.mockImplementation((event, handler, options) => {
            if (event === 'controllerchange') {
                controllerChangeHandlers.push({ handler, options });
            }
        });

        const registration = {
            installing: installingWorker,
            waiting: waitingWorker,
        };

        serviceWorker.register.mockResolvedValue(registration);
        fetch.mockImplementation(() => mockFetchResponse({ offlineWorker: { enabled: true } }));

        const { registerOfflineWorker } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        registerOfflineWorker();
        await dispatchLoad();

        expect(installingWorker.addEventListener).toHaveBeenCalledWith(
            'statechange',
            expect.any(Function),
            { once: true }
        );

        const handler = installingWorker.addEventListener.mock.calls[0][1];
        installingWorker.state = 'installed';
        handler();

        expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        expect(controllerChangeHandlers[0].options).toEqual({ once: true });
        controllerChangeHandlers[0].handler();
        expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it('reloads once when a stylesheet 404 occurs under SW control', async () => {
        fetch.mockResolvedValue({ status: 404 });
        serviceWorker.controller = {};

        const reload = vi.fn();
        const { installStylesheet404Recovery } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        installStylesheet404Recovery({ reload });

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/_astro/app.css';
        document.body.appendChild(link);

        link.dispatchEvent(new Event('error', { bubbles: true }));

        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

        link.dispatchEvent(new Event('error', { bubbles: true }));

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('skips registration when offline worker disabled via config', async () => {
        fetch.mockImplementation(() => mockFetchResponse({ offlineWorker: { enabled: false } }));

        const { registerOfflineWorker } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        registerOfflineWorker();
        await dispatchLoad();

        expect(serviceWorker.register).not.toHaveBeenCalled();
        expect(consoleInfoSpy).toHaveBeenCalledWith('Offline worker disabled via runtime config.');
    });

    it('skips registration when disabled via environment', async () => {
        process.env.DSPACE_OFFLINE_WORKER_DISABLED = 'true';
        fetch.mockImplementation(() => mockFetchResponse({ offlineWorker: { enabled: true } }));

        const { registerOfflineWorker } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        registerOfflineWorker();
        await dispatchLoad();

        expect(serviceWorker.register).not.toHaveBeenCalled();
    });

    it('logs warning when service worker registration fails', async () => {
        fetch.mockImplementation(() => mockFetchResponse({ offlineWorker: {} }));
        serviceWorker.register.mockRejectedValue(new Error('Registration failed'));

        const { registerOfflineWorker } = await import(
            '../src/scripts/offlineWorkerRegistration.js'
        );

        registerOfflineWorker();
        await dispatchLoad();

        await vi.waitFor(() => {
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Service worker registration failed:',
                expect.any(Error)
            );
        });
    });
});
