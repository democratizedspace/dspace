// cspell:ignore unstub

import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UIResponsiveness from '../svelte/UIResponsiveness.svelte';

const legacyTiming = Object.getOwnPropertyDescriptor(window.performance, 'timing');

describe('UI responsiveness timer', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        if (legacyTiming) {
            Object.defineProperty(window.performance, 'timing', legacyTiming);
        } else {
            Reflect.deleteProperty(window.performance, 'timing');
        }
    });

    it('uses the navigation time origin when the homepage marker is missing', async () => {
        vi.stubGlobal('dspaceStart', undefined);
        vi.spyOn(window.performance, 'now').mockReturnValue(842);
        Object.defineProperty(window.performance, 'timing', {
            configurable: true,
            value: { navigationStart: 1_700_000_000_000 },
        });

        const metric = await render(UIResponsiveness).findByTestId('hydration-time');

        expect(metric).toHaveAttribute('data-hydrated', 'true');
        expect(metric).toHaveTextContent(/^Hydration time: 842 ms$/);
    });

    it('honors the relative homepage marker when available', async () => {
        vi.stubGlobal('dspaceStart', 800);
        vi.spyOn(window.performance, 'now').mockReturnValue(842);

        const metric = await render(UIResponsiveness).findByTestId('hydration-time');

        expect(metric).toHaveTextContent(/^Hydration time: 42 ms$/);
    });
});
