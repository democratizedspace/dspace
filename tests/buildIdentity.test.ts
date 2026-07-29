import { describe, expect, it } from 'vitest';
import {
    isPlaceholderRevision,
    normalizeBuildIdentity,
} from '../frontend/src/utils/buildIdentity.js';
import { buildRuntimeBuildMetaResponse } from '../frontend/src/utils/buildMetaServer.js';
import { GET as getBuildInfo } from '../frontend/src/pages/build-info.json.ts';
import { GET as getBuildMeta } from '../frontend/src/pages/build-meta.json.ts';

const revision = '0123456789abcdef0123456789abcdef01234567';
const meta = {
    applicationVersion: '3.1.0',
    gitSha: revision,
    generatedAt: '2026-07-29T12:34:56.000Z',
    source: 'ci',
};

describe('canonical build identity', () => {
    it('normalizes legacy metadata and derives the short revision', () => {
        expect(normalizeBuildIdentity(meta)).toEqual({
            applicationVersion: '3.1.0',
            revision,
            shortRevision: '0123456',
            builtAt: '2026-07-29T12:34:56.000Z',
        });
    });

    it.each(['', 'unknown', 'missing', 'missing-sha', 'dev-local', '0123456', 'g'.repeat(40)])(
        'rejects missing, placeholder, short, or malformed revision %s',
        (gitSha) => expect(() => normalizeBuildIdentity({ ...meta, gitSha })).toThrow(/revision/)
    );

    it('accepts only a matching immutable branch-SHA image coordinate', () => {
        expect(
            normalizeBuildIdentity({
                ...meta,
                image: 'ghcr.io/democratizedspace/dspace:main-0123456',
            }).image
        ).toBe('ghcr.io/democratizedspace/dspace:main-0123456');
        for (const image of [
            'ghcr.io/democratizedspace/dspace:main-latest',
            'ghcr.io/democratizedspace/dspace:v3.1.0',
            'ghcr.io/democratizedspace/dspace:main-fffffff',
            'registry.example/dspace:main-0123456',
        ]) {
            expect(() => normalizeBuildIdentity({ ...meta, image })).toThrow(/immutable/);
        }
    });

    it('recognizes all reserved local/missing placeholders', () => {
        expect(
            ['unknown', 'missing', 'missing-sha', 'dev-local'].every(isPlaceholderRevision)
        ).toBe(true);
    });
});

describe('build identity endpoints', () => {
    it('serves generated canonical metadata through both route handlers', async () => {
        const info = await getBuildInfo();
        const compatible = await getBuildMeta();
        expect(info.status).toBe(200);
        expect(compatible.status).toBe(200);
        const identity = await info.json();
        expect(identity.revision).toMatch(/^[0-9a-f]{40}$/);
        expect(await compatible.json()).toMatchObject({
            gitSha: identity.revision,
            revision: identity.revision,
        });
    });

    it('returns the canonical uncached identity and a compatible build-meta superset', async () => {
        const resolver = async () => meta;
        const identity = await buildRuntimeBuildMetaResponse({
            compatibility: false,
            resolver,
        });
        expect(identity.status).toBe(200);
        expect(identity.headers.get('cache-control')).toBe('no-store');
        expect(await identity.json()).toMatchObject({
            revision,
            shortRevision: '0123456',
        });

        const compatible = await buildRuntimeBuildMetaResponse({ resolver });
        expect(await compatible.json()).toMatchObject({
            gitSha: revision,
            source: 'ci',
            revision,
        });
    });

    it('fails closed without exposing resolver details', async () => {
        const response = await buildRuntimeBuildMetaResponse({
            compatibility: false,
            resolver: async () => ({
                ...meta,
                gitSha: 'missing',
                resolvedFrom: '/secret/path',
            }),
        });
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({
            error: 'build_identity_unavailable',
        });
    });
});
