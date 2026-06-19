import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GET as getRuntimeConfig } from '../frontend/src/pages/config.json.ts';
import { GET as getHealthz } from '../frontend/src/pages/healthz.ts';
import { GET as getLivez } from '../frontend/src/pages/livez.ts';

const ORIGINAL_FLAGS = process.env.DSPACE_FEATURE_FLAGS;
const ORIGINAL_OFFLINE = process.env.DSPACE_OFFLINE_WORKER_ENABLED;
const ORIGINAL_TELEMETRY = process.env.DSPACE_TELEMETRY_ENABLED;
const ORIGINAL_VERSION = process.env.DSPACE_VERSION;
const ORIGINAL_TOKEN_PLACE_URL = process.env.DSPACE_TOKEN_PLACE_URL;
const ORIGINAL_TOKEN_PLACE_MODEL = process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;

describe('runtime endpoints', () => {
    beforeEach(() => {
        delete process.env.DSPACE_FEATURE_FLAGS;
        delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
        delete process.env.DSPACE_TELEMETRY_ENABLED;
        delete process.env.DSPACE_VERSION;
        delete process.env.DSPACE_TOKEN_PLACE_URL;
        delete process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
    });

    afterEach(() => {
        if (ORIGINAL_FLAGS === undefined) {
            delete process.env.DSPACE_FEATURE_FLAGS;
        } else {
            process.env.DSPACE_FEATURE_FLAGS = ORIGINAL_FLAGS;
        }

        if (ORIGINAL_OFFLINE === undefined) {
            delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
        } else {
            process.env.DSPACE_OFFLINE_WORKER_ENABLED = ORIGINAL_OFFLINE;
        }

        if (ORIGINAL_TELEMETRY === undefined) {
            delete process.env.DSPACE_TELEMETRY_ENABLED;
        } else {
            process.env.DSPACE_TELEMETRY_ENABLED = ORIGINAL_TELEMETRY;
        }

        if (ORIGINAL_VERSION === undefined) {
            delete process.env.DSPACE_VERSION;
            delete process.env.DSPACE_TOKEN_PLACE_URL;
            delete process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
        } else {
            process.env.DSPACE_VERSION = ORIGINAL_VERSION;
        }
    });

    it('reports production token.place defaults when runtime env is absent', async () => {
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.tokenPlace).toEqual({
            url: 'https://token.place',
            model: 'gpt-5-chat-latest',
        });
    });

    it('reports the deployment token.place runtime URL', async () => {
        process.env.DSPACE_TOKEN_PLACE_URL = 'https://staging.token.place/api/';
        const response = await getRuntimeConfig();
        const body = await response.json();
        expect(body.tokenPlace?.url).toBe('https://staging.token.place');
        expect(body.tokenPlace?.url).not.toBe('https://token.place');
    });

    it('reports the deployment token.place runtime model', async () => {
        process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL = 'staging-chat-model';
        const response = await getRuntimeConfig();
        const body = await response.json();
        expect(body.tokenPlace?.model).toBe('staging-chat-model');
    });

    it('enables the offline worker by default', async () => {
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
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

    it('honors the explicit offline worker env override', async () => {
        process.env.DSPACE_OFFLINE_WORKER_ENABLED = '0';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.offlineWorker?.enabled).toBe(false);
    });

    it('disables telemetry collection by default', async () => {
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.telemetry?.enabled).toBe(false);
    });

    it('enables telemetry when the feature flag is opted in', async () => {
        process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=true';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.telemetry?.enabled).toBe(true);
        expect(body.featureFlags).toContain('telemetry.enabled=true');
    });

    it('disables telemetry when the feature flag is explicitly opted out', async () => {
        process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=false';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.telemetry?.enabled).toBe(false);
        expect(body.featureFlags).toContain('telemetry.enabled=false');
    });

    it('honors the explicit telemetry env override', async () => {
        process.env.DSPACE_TELEMETRY_ENABLED = '1';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.telemetry?.enabled).toBe(true);
    });

    it('prefers the telemetry env override over the feature flag', async () => {
        process.env.DSPACE_FEATURE_FLAGS = 'telemetry.enabled=true';
        process.env.DSPACE_TELEMETRY_ENABLED = '0';
        const response = await getRuntimeConfig();
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.telemetry?.enabled).toBe(false);
        expect(body.featureFlags).toContain('telemetry.enabled=true');
    });

    it('marks runtime config responses as non-cacheable', async () => {
        const response = await getRuntimeConfig();
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('returns ok health and liveness payloads', async () => {
        process.env.DSPACE_VERSION = 'test-version';

        const healthResponse = await getHealthz();
        const liveResponse = await getLivez();

        for (const res of [healthResponse, liveResponse]) {
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.status === 'ready' || body.status === 'alive').toBe(true);
            expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
            expect(body.version).toBe('test-version');
            expect(body.features).toStrictEqual([]);
        }
    });
});
