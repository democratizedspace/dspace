import { describe, expect, it } from 'vitest';
import { normalizeBuildIdentity } from '../frontend/src/utils/buildIdentity.js';
import { assertBuildMetaComplete } from '../scripts/write-build-meta.mjs';

const SHA = '0123456789abcdef0123456789abcdef01234567';
const valid = {
  version: '3.1.0',
  revision: SHA,
  shortRevision: SHA.slice(0, 7),
  buildTimestamp: '2026-07-29T12:00:00Z',
};

describe('canonical public build identity', () => {
  it('normalizes the full identity and derives the short revision', () => {
    expect(
      normalizeBuildIdentity({ ...valid, shortRevision: undefined })
    ).toEqual(valid);
  });

  it('accepts semantic versions with both prerelease and build metadata', () => {
    expect(
      normalizeBuildIdentity({ ...valid, version: '3.2.0-rc.1+build.7' })
        .version
    ).toBe('3.2.0-rc.1+build.7');
  });

  it.each([
    '',
    'unknown',
    'missing',
    'missing-sha',
    'dev-local',
    'abc1234',
    `${SHA}0`,
  ])('rejects invalid revision %j', (revision) =>
    expect(() => normalizeBuildIdentity({ ...valid, revision })).toThrow()
  );

  it('rejects mismatched short revisions and request-like timestamps', () => {
    expect(() =>
      normalizeBuildIdentity({ ...valid, shortRevision: 'fffffff' })
    ).toThrow();
    expect(() =>
      normalizeBuildIdentity({ ...valid, buildTimestamp: '' })
    ).toThrow();
    expect(() =>
      normalizeBuildIdentity({
        ...valid,
        buildTimestamp: '2026-02-31T00:00:00Z',
      })
    ).toThrow('buildTimestamp must be an ISO UTC timestamp');
  });

  it('rejects disagreement between supplied full revisions', () => {
    expect(() =>
      normalizeBuildIdentity({ ...valid, gitSha: 'f'.repeat(40) })
    ).toThrow('gitSha does not agree with revision');
  });

  it('isolates explicit dev-local metadata from canonical and production identities', () => {
    const local = {
      gitSha: 'dev-local',
      source: 'local',
      generatedAt: '2026-07-29T12:00:00Z',
    };
    expect(() => assertBuildMetaComplete(local)).not.toThrow();
    expect(() => normalizeBuildIdentity(local)).toThrow();
    expect(() => assertBuildMetaComplete(local, { production: true })).toThrow(
      'gitSha is not set'
    );
  });

  it('accepts only an agreeing immutable branch-SHA image coordinate', () => {
    const image = `ghcr.io/democratizedspace/dspace:main-${SHA.slice(0, 7)}`;
    expect(normalizeBuildIdentity({ ...valid, image }).image).toBe(image);
    for (const movable of [
      'ghcr.io/democratizedspace/dspace:latest',
      'ghcr.io/democratizedspace/dspace:main-latest',
      'ghcr.io/democratizedspace/dspace:v3.1.0',
      'ghcr.io/democratizedspace/dspace:main-fffffff',
    ]) {
      expect(() =>
        normalizeBuildIdentity({ ...valid, image: movable })
      ).toThrow();
    }
  });
});
