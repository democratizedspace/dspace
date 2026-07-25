import { describe, expect, it } from 'vitest';
import {
  createManifest,
  validateManifest,
} from '../scripts/check-release-consistency.mjs';

const sha = 'a'.repeat(40);
const digest = `sha256:${'b'.repeat(64)}`;
const otherDigest = `sha256:${'c'.repeat(64)}`;
const local = {
  applicationVersion: '3.1.0',
  chartVersion: '4.2.0',
  sourceRevision: sha,
  imageTag: 'main-aaaaaaa',
};
const image = {
  indexDigest: digest,
  platforms: {
    amd64: { digest },
    arm64: { digest: otherDigest },
  },
};

describe('release consistency manifest', () => {
  it('emits a stable complete manifest with independently versioned chart coordinates', () => {
    const manifest = createManifest(local, image, { digest: otherDigest });
    expect(JSON.stringify(manifest, null, 2)).toMatchInlineSnapshot(`
      "{
        \"schemaVersion\": 1,
        \"app\": \"dspace\",
        \"applicationVersion\": \"3.1.0\",
        \"sourceRevision\": \"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",
        \"imageTag\": \"main-aaaaaaa\",
        \"imageDigest\": \"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",
        \"chartVersion\": \"4.2.0\",
        \"chartDigest\": \"sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\",
        \"platformDigests\": {
          \"linux/amd64\": \"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\",
          \"linux/arm64\": \"sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc\"
        },
        \"semanticImageTag\": \"v3.1.0\"
      }"
    `);
  });

  it.each([
    ['source revision', { sourceRevision: 'short' }],
    ['mutable image tag', { imageTag: 'main-latest' }],
    ['semantic tag', { semanticImageTag: 'v9.9.9' }],
    ['image digest', { imageDigest: 'malformed' }],
    ['chart digest', { chartDigest: 'malformed' }],
    ['required platform', { platformDigests: { 'linux/amd64': digest } }],
  ])('fails closed for a malformed %s', (_label, change) => {
    const manifest = {
      ...createManifest(local, image, { digest: otherDigest }),
      ...change,
    };
    expect(() => validateManifest(manifest)).toThrow(
      /malformed or inconsistent/
    );
  });
});
