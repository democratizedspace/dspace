import { describe, expect, it } from 'vitest';
import { normalizeBuildIdentity } from '../frontend/src/utils/buildInfo.js';
import { GET as getBuildInfo } from '../frontend/src/pages/build-info.json';
import { GET as getBuildMeta } from '../frontend/src/pages/build-meta.json';

const revision = '0123456789abcdef0123456789abcdef01234567';
const base = {
  version: '3.1.0',
  gitSha: revision,
  shortRevision: '0123456',
  generatedAt: '2026-07-23T12:00:00.000Z',
};

describe('canonical runtime build identity', () => {
  it('normalizes the full and short revision and matching immutable image', () => {
    expect(
      normalizeBuildIdentity({
        ...base,
        image: 'ghcr.io/democratizedspace/dspace:main-0123456',
      })
    ).toEqual({
      version: '3.1.0',
      revision,
      shortRevision: '0123456',
      generatedAt: base.generatedAt,
      image: 'ghcr.io/democratizedspace/dspace:main-0123456',
    });
  });

  it.each([
    '',
    'unknown',
    'missing',
    'missing-sha',
    'dev-local',
    '0123456',
    `${revision}00`,
  ])(
    'rejects missing, placeholder, short, or malformed revision %s',
    (gitSha) =>
      expect(() => normalizeBuildIdentity({ ...base, gitSha })).toThrow(
        /revision/i
      )
  );

  it('rejects mismatched short revisions and movable or mismatched image tags', () => {
    expect(() =>
      normalizeBuildIdentity({ ...base, shortRevision: 'abcdef0' })
    ).toThrow(/Short/);
    for (const image of [
      'ghcr.io/democratizedspace/dspace:latest',
      'ghcr.io/democratizedspace/dspace:v3.1.0',
      'ghcr.io/democratizedspace/dspace:main-abcdef0',
    ])
      expect(() => normalizeBuildIdentity({ ...base, image })).toThrow(
        /immutable/
      );
  });

  it('serves the new endpoint and legacy compatible endpoint from one metadata resolver', async () => {
    const [info, legacy] = await Promise.all([getBuildInfo(), getBuildMeta()]);
    expect(info.status).toBe(200);
    expect(info.headers.get('cache-control')).toBe('no-store');
    const infoBody = await info.json();
    const legacyBody = await legacy.json();
    expect(infoBody).toEqual(legacyBody);
    expect(infoBody.revision).toMatch(/^[0-9a-f]{40}$/);
    expect(infoBody.shortRevision).toBe(infoBody.revision.slice(0, 7));
    expect(infoBody.gitSha).toBe(infoBody.revision);
  });
});
