/** @jest-environment node */
import { beforeEach, describe, it, expect, vi } from 'vitest';

const SHA = '0123456789abcdef0123456789abcdef01234567';
let buildMeta;

vi.mock('../src/generated/build_meta.json', () => ({
    get default() {
        return buildMeta;
    },
}));

beforeEach(() => {
    buildMeta = {
        version: '3.1.0',
        revision: SHA,
        shortRevision: SHA.slice(0, 7),
        buildTimestamp: '2026-07-29T12:00:00Z',
    };
});

const getProbes = async () => {
    vi.resetModules();
    const readiness = await import('../src/pages/healthz.ts');
    const liveness = await import('../src/pages/livez.ts');
    return { readiness, liveness };
};

describe('health probes', () => {
    it.each([
        ['canonical', () => buildMeta],
        ['malformed', () => ({ ...buildMeta, revision: 'missing' })],
    ])('keeps both probes available with %s metadata', async (_label, metadata) => {
        buildMeta = metadata();
        const { readiness, liveness } = await getProbes();
        const readinessResponse = await readiness.GET();
        const livenessResponse = await liveness.GET();
        const readinessBody = await readinessResponse.json();
        const livenessBody = await livenessResponse.json();

        expect(readinessResponse.status).toBe(200);
        expect(readinessBody.status).toBe('ready');
        expect(typeof readinessBody.timestamp).toBe('string');
        expect(typeof readinessBody.startedAt).toBe('string');
        expect(typeof readinessBody.version).toBe('string');
        expect(typeof readinessBody.env).toBe('string');
        expect(Array.isArray(readinessBody.features)).toBe(true);
        expect(livenessResponse.status).toBe(200);
        expect(livenessBody.status).toBe('alive');
        expect(typeof livenessBody.uptimeSeconds).toBe('number');
        expect(typeof livenessBody.startedAt).toBe('string');
        expect(typeof livenessBody.timestamp).toBe('string');
        expect(typeof livenessBody.version).toBe('string');
        expect(typeof livenessBody.env).toBe('string');
        expect(Array.isArray(livenessBody.features)).toBe(true);
        const expectedIdentity = _label === 'canonical' ? buildMeta : null;
        expect(readinessBody.buildIdentity).toEqual(expectedIdentity);
        expect(livenessBody.buildIdentity).toEqual(expectedIdentity);
        expect(readiness.prerender).toBe(false);
        expect(liveness.prerender).toBe(false);
    });
});
