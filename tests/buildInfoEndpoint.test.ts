import { beforeEach, describe, expect, it, vi } from 'vitest';

const SHA = '0123456789abcdef0123456789abcdef01234567';
let filePayload;

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(async () => JSON.stringify(filePayload)),
  },
}));
vi.mock('../frontend/src/utils/serverLogger', () => ({
  logServerError: vi.fn(),
}));

describe('runtime build identity endpoints', () => {
  beforeEach(() => {
    filePayload = {
      version: '3.1.0',
      revision: SHA,
      shortRevision: SHA.slice(0, 7),
      buildTimestamp: '2026-07-29T12:00:00Z',
      image: `ghcr.io/democratizedspace/dspace:main-${SHA.slice(0, 7)}`,
      gitSha: SHA,
      generatedAt: '2026-07-29T12:00:00Z',
      source: 'ci',
    };
  });

  it('returns the canonical identity without caching or internal paths', async () => {
    const { GET } = await import('../frontend/src/pages/build-info.json.ts');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      version: '3.1.0',
      revision: SHA,
      shortRevision: SHA.slice(0, 7),
      buildTimestamp: '2026-07-29T12:00:00Z',
      image: `ghcr.io/democratizedspace/dspace:main-${SHA.slice(0, 7)}`,
    });
  });

  it.each([false, 0])(
    'fails closed with a bounded error for supplied falsey image %j',
    async (image) => {
      filePayload.image = image;
      const { GET } = await import('../frontend/src/pages/build-info.json.ts');
      const response = await GET();
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: 'build_identity_unavailable',
      });
    }
  );

  it('fails closed with a bounded error for invalid production identity', async () => {
    filePayload.revision = filePayload.gitSha = 'missing';
    const { GET } = await import('../frontend/src/pages/build-info.json.ts');
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'build_identity_unavailable',
    });
  });

  it('preserves the legacy build-meta fields and status behavior', async () => {
    const { GET } = await import('../frontend/src/pages/build-meta.json.ts');
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      gitSha: SHA,
      generatedAt: filePayload.generatedAt,
      source: 'ci',
    });
    expect(body.resolvedFrom).toBeUndefined();
  });

  it('preserves legacy-only build-meta success while canonical build-info fails closed', async () => {
    filePayload = {
      gitSha: SHA,
      generatedAt: '2026-07-29T12:00:00Z',
      source: 'legacy-ci',
    };
    const buildMeta = await import('../frontend/src/pages/build-meta.json.ts');
    const legacyResponse = await buildMeta.GET();
    expect(legacyResponse.status).toBe(200);
    expect(await legacyResponse.json()).toEqual(filePayload);

    const buildInfo = await import('../frontend/src/pages/build-info.json.ts');
    const canonicalResponse = await buildInfo.GET();
    expect(canonicalResponse.status).toBe(503);
    expect(await canonicalResponse.json()).toEqual({
      error: 'build_identity_unavailable',
    });
  });

  it.each(['missing', 'dev-local'])(
    'keeps placeholder %s metadata private and unavailable',
    async (gitSha) => {
      filePayload.gitSha = gitSha;
      filePayload.revision = gitSha;
      const buildMeta =
        await import('../frontend/src/pages/build-meta.json.ts');
      const legacyResponse = await buildMeta.GET();
      const legacyBody = await legacyResponse.json();
      expect(legacyResponse.status).toBe(503);
      expect(legacyBody).toMatchObject({
        gitSha: 'missing',
        source: 'missing',
      });
      expect(legacyBody.resolvedFrom).toBeUndefined();

      const buildInfo =
        await import('../frontend/src/pages/build-info.json.ts');
      const canonicalResponse = await buildInfo.GET();
      expect(canonicalResponse.status).toBe(503);
      expect(await canonicalResponse.json()).toEqual({
        error: 'build_identity_unavailable',
      });
    }
  );
});
