import { describe, expect, it } from 'vitest';
import { GET as getBuildInfo } from '../frontend/src/pages/build-info.json.ts';
import { GET as getBuildMeta } from '../frontend/src/pages/build-meta.json.ts';
import { buildRuntimeBuildMetaResponse } from '../frontend/src/utils/buildMetaServer.js';

describe('runtime build identity endpoints', () => {
    it('serves canonical identity without caching', async () => {
        const response = await getBuildInfo();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(body.revision).toMatch(/^[0-9a-f]{40}$/);
        expect(body.shortRevision).toBe(body.revision.slice(0, 7));
        expect(body.version).toBe('3.1.0');
        expect(Date.parse(body.builtAt)).not.toBeNaN();
    });

  it('keeps build-meta compatibility as a canonical superset', async () => {
        const response = await getBuildMeta();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.gitSha).toBe(body.revision);
        expect(body.generatedAt).toBe(body.builtAt);
        expect(body.source).toBeTruthy();
  });

  it('fails closed without exposing invalid identity details', async () => {
    const response = await buildRuntimeBuildMetaResponse('/build-info.json', async () => ({
      version: '3.1.0',
      gitSha: 'missing-sha',
      generatedAt: new Date().toISOString(),
      source: 'env:SECRET_INTERNAL_SOURCE',
      resolvedFrom: '/internal/path',
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'build_identity_unavailable' });
  });
});
