import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// @ts-expect-error Allow importing the Astro endpoint with its `.ts` extension for testing
import { GET as getRuntimeConfig } from '../frontend/src/pages/config.json.ts';

describe('runtime config service', () => {
    const originalEnv = process.env.DSPACE_FEATURE_FLAGS;

    beforeEach(() => {
        delete process.env.DSPACE_FEATURE_FLAGS;
    });

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.DSPACE_FEATURE_FLAGS;
        } else {
            process.env.DSPACE_FEATURE_FLAGS = originalEnv;
        }
    });

    it('enables the offline worker by default', async () => {
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        const body = await response.json();
        expect(body.offlineWorker?.enabled).toBe(true);
    });

    it('disables the offline worker when the flag is set to false', async () => {
        process.env.DSPACE_FEATURE_FLAGS = 'offlineWorker.enabled=false';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.offlineWorker?.enabled).toBe(false);
        expect(body.featureFlags).toContain('offlineWorker.enabled=false');
    });
});
