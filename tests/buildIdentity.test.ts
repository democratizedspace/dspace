import { describe, expect, it } from 'vitest';
import { normalizeBuildIdentity } from '../frontend/src/utils/buildIdentity.js';

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
