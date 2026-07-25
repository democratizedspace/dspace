import { describe, expect, it } from 'vitest';
import {
  immutableImageTag,
  validateEvidence,
  validateManifest,
} from '../scripts/check-release-consistency.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';
const digest = (letter: string) => `sha256:${letter.repeat(64)}`;
const coordinates = { applicationVersion: '3.1.0', chartVersion: '4.2.0' };
const image = {
  indexDigest: digest('a'),
  platforms: {
    amd64: { digest: digest('b'), revision },
    arm64: { digest: digest('c'), revision },
  },
};
const chart = {
  digest: digest('d'),
  config: {
    version: '3.1.0',
    chartVersion: '4.2.0',
    'org.opencontainers.image.revision': revision,
  },
};

describe('release consistency policy', () => {
  it('emits stable complete coordinates with independently versioned chart', () => {
    const manifest = validateEvidence({
      coordinates,
      sourceRevision: revision,
      branch: 'main',
      image,
      chart,
      semanticDigest: digest('a'),
    });
    expect(validateManifest(manifest)).toEqual(manifest);
    expect(manifest.imageTag).toBe('main-0123456');
    expect(manifest.imageDigest).toBe(digest('a'));
    expect(manifest.chartVersion).toBe('4.2.0');
    expect(manifest.chartDigest).toBe(digest('d'));
  });

  it.each([
    [
      'wrong amd64 revision',
      {
        ...image,
        platforms: {
          ...image.platforms,
          amd64: { ...image.platforms.amd64, revision: 'f'.repeat(40) },
        },
      },
      chart,
      digest('a'),
    ],
    [
      'missing arm64',
      { ...image, platforms: { amd64: image.platforms.amd64 } },
      chart,
      digest('a'),
    ],
    ['semantic mismatch', image, chart, digest('e')],
    [
      'wrong chart appVersion',
      image,
      { ...chart, config: { ...chart.config, version: '9.9.9' } },
      digest('a'),
    ],
    [
      'wrong chart version',
      image,
      { ...chart, config: { ...chart.config, chartVersion: '9.9.9' } },
      digest('a'),
    ],
    [
      'wrong chart revision',
      image,
      {
        ...chart,
        config: {
          ...chart.config,
          'org.opencontainers.image.revision': 'f'.repeat(40),
        },
      },
      digest('a'),
    ],
    [
      'malformed chart digest',
      image,
      { ...chart, digest: 'latest' },
      digest('a'),
    ],
  ])(
    'fails closed for %s',
    (_name, candidateImage, candidateChart, semanticDigest) => {
      expect(() =>
        validateEvidence({
          coordinates,
          sourceRevision: revision,
          branch: 'main',
          image: candidateImage as any,
          chart: candidateChart as any,
          semanticDigest,
        })
      ).toThrow();
    }
  );

  it.each(['main-latest', 'v3.1.0', 'main-deadbee-extra', 'feature-deadbee'])(
    'rejects mutable or malformed deployment coordinate %s',
    (tag) => expect(tag).not.toBe(immutableImageTag('main', revision))
  );
});
