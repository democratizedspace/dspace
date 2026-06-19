import { afterEach, describe, expect, test } from 'vitest';
import { buildRuntimeConfigResponse } from '../src/utils/runtimeEndpoints';

const readConfig = async () => {
    const response = buildRuntimeConfigResponse();
    return { response, body: await response.json() };
};

describe('/config.json runtime configuration', () => {
    afterEach(() => {
        delete process.env.DSPACE_TOKEN_PLACE_URL;
        delete process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL;
        delete process.env.DSPACE_FEATURE_FLAGS;
        delete process.env.DSPACE_OFFLINE_WORKER_ENABLED;
        delete process.env.DSPACE_TELEMETRY_ENABLED;
    });

    test('defaults to production token.place when runtime env is absent', async () => {
        const { body } = await readConfig();
        expect(body.tokenPlace).toEqual({
            url: 'https://token.place',
            model: 'gpt-5-chat-latest',
        });
    });

    test('exposes DSPACE_TOKEN_PLACE_URL with token.place URL normalization', async () => {
        process.env.DSPACE_TOKEN_PLACE_URL = 'https://staging.token.place/api/';
        const { body } = await readConfig();
        expect(body.tokenPlace.url).toBe('https://staging.token.place');
    });

    test('exposes DSPACE_TOKEN_PLACE_CHAT_MODEL', async () => {
        process.env.DSPACE_TOKEN_PLACE_CHAT_MODEL = 'staging-chat-model';
        const { body } = await readConfig();
        expect(body.tokenPlace.model).toBe('staging-chat-model');
    });

    test('keeps no-store cache control and existing runtime fields', async () => {
        process.env.DSPACE_FEATURE_FLAGS = 'beta-chat,offlineWorker.enabled=false';
        const { response, body } = await readConfig();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(body.offlineWorker.enabled).toBe(false);
        expect(body.telemetry.enabled).toBe(false);
        expect(body.featureFlags).toContain('beta-chat');
    });
});
