/** @jest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import '../vitest.setup';

import { setupStylesheetRecovery } from '../src/scripts/stylesheetRecovery.js';

let originalLocation;
let removeListener;

function dispatchStylesheetError(href = 'http://localhost/_astro/main.css') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    const event = new Event('error', { bubbles: true });
    link.dispatchEvent(event);
}

describe('setupStylesheetRecovery', () => {
    beforeEach(() => {
        sessionStorage.clear();
        originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, reload: vi.fn() },
        });

        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { controller: {} },
        });

        global.fetch = vi.fn();
    });

    afterEach(() => {
        sessionStorage.clear();
        if (removeListener) {
            removeListener();
        }
        vi.restoreAllMocks();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
        removeListener = undefined;
    });

    it('reloads once when a stylesheet returns 404 shortly after load under SW control', async () => {
        fetch.mockResolvedValue({ status: 404 });

        removeListener = setupStylesheetRecovery({ errorWindowMs: 1_000 });
        dispatchStylesheetError();

        expect(fetch).toHaveBeenCalled();
        await vi.waitFor(() => {
            expect(window.location.reload).toHaveBeenCalledTimes(1);
        });
        expect(sessionStorage.getItem('dspace-stylesheet-reloaded')).toBe('1');

        window.location.reload.mockClear();
        dispatchStylesheetError();
        expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('does not reload when there is no controlling service worker', () => {
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {},
        });

        fetch.mockResolvedValue({ status: 404 });

        removeListener = setupStylesheetRecovery();
        dispatchStylesheetError();

        expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('ignores non-404 stylesheet errors', async () => {
        fetch.mockResolvedValue({ status: 200 });

        removeListener = setupStylesheetRecovery();
        dispatchStylesheetError();

        await vi.waitFor(() => {
            expect(window.location.reload).not.toHaveBeenCalled();
        });
    });
});
