import { describe, expect, it } from 'vitest';
import {
  createReleaseManifest,
  validateChartArtifact,
  validateImage,
  validateLocalCoordinates,
} from '../scripts/check-release-consistency.mjs';

const sha = 'a'.repeat(40);
const digest = `sha256:${'b'.repeat(64)}`;
const coordinates = {
  applicationVersion: '3.1.0',
  frontendVersion: '3.1.0',
  lockfileVersion: '3.1.0',
  chartVersion: '4.2.0',
  chartAppVersion: '3.1.0',
  releaseTag: 'v3.1.0',
  chartTag: 'chart-v4.2.0',
  sourceRevision: sha,
  releaseTagRevision: sha,
  chartTagRevision: sha,
  branch: 'main',
  imageTag: 'main-aaaaaaa',
};
const image = {
  indexDigest: digest,
  platforms: {
    amd64: { revision: sha, manifestDigest: digest },
    arm64: { revision: sha, manifestDigest: digest },
  },
};
const chart = { version: '4.2.0', appVersion: '3.1.0', revision: sha, digest };

describe('release consistency policy', () => {
  it('accepts independently versioned coordinates and emits stable required fields', () => {
    const manifest = createReleaseManifest({ coordinates, image, chart });
    expect(manifest).toMatchObject({
      applicationVersion: '3.1.0',
      chartVersion: '4.2.0',
      sourceRevision: sha,
      imageTag: 'main-aaaaaaa',
      imageDigest: digest,
      chartDigest: digest,
    });
    expect(JSON.stringify(manifest)).toBe(
      JSON.stringify(createReleaseManifest({ coordinates, image, chart }))
    );
  });
  it.each([
    ['frontendVersion', '3.1.1'],
    ['lockfileVersion', '3.1.1'],
    ['chartAppVersion', '3.1.1'],
    ['releaseTagRevision', 'c'.repeat(40)],
    ['chartTagRevision', 'c'.repeat(40)],
    ['imageTag', 'main-latest'],
    ['imageTag', 'v3.1.0'],
    ['imageTag', 'bad tag'],
  ])('rejects mismatched %s', (key, value) =>
    expect(() =>
      validateLocalCoordinates({ ...coordinates, [key]: value })
    ).toThrow()
  );
  it('rejects a missing platform and a wrong revision label', () => {
    expect(() =>
      validateImage(
        { ...image, platforms: { amd64: image.platforms.amd64 } },
        sha
      )
    ).toThrow(/arm64/);
    expect(() =>
      validateImage(
        {
          ...image,
          platforms: {
            ...image.platforms,
            arm64: { ...image.platforms.arm64, revision: 'c'.repeat(40) },
          },
        },
        sha
      )
    ).toThrow(/arm64/);
  });
  it.each([
    [{ present: false }, /missing/],
    [{ ...chart, version: '9.0.0' }, /version/],
    [{ ...chart, appVersion: '9.0.0' }, /appVersion/],
    [{ ...chart, revision: 'c'.repeat(40) }, /revision/],
    [{ ...chart, digest: 'latest' }, /digest/],
  ])('rejects invalid chart evidence', (candidate, message) =>
    expect(() => validateChartArtifact(candidate as any, coordinates)).toThrow(
      message
    )
  );
});
