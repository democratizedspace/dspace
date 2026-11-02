// This contract is restricted to one published immutable image, not a rollout approval.
import { createHash } from 'node:crypto';
import artifactBundle from './fixtures/hotfix-302-oci-proof.json' with { type: 'json' };

export const hotfix302 = Object.freeze({
  version: '3.0.2',
  revision: '47900748f61e1ef38c6289fc697f7a070f7fa3c9',
  imageDigest:
    'sha256:5d16cde03df4cfe9a52341c26bb6167234d315f896d422af38383b760bebcfe0',
  imageVersionLabel: 'v3.0.2+4790074',
  identityContract: 'hotfix-build-meta-oci-v1',
  providerConfigContract: 'hotfix-openai-config-v1',
  provider: 'openai',
});
export const artifactProofPrefix = 'DSPACE_ARTIFACT_VERSION_PROOF ';

function fail() {
  throw new Error('identity: invalid exact-hotfix artifact/version proof');
}

function decode(raw, digest) {
  if (typeof raw !== 'string' || raw.length > 256 * 1024) fail();
  const bytes = Buffer.from(raw, 'base64');
  if (bytes.toString('base64') !== raw) fail();
  if (`sha256:${createHash('sha256').update(bytes).digest('hex')}` !== digest)
    fail();
  return JSON.parse(bytes.toString('utf8'));
}

export function verifyHotfixArtifact(options, bundle = artifactBundle) {
  if (
    options.expectedVersion !== hotfix302.version ||
    options.expectedRevision !== hotfix302.revision ||
    options.expectedImageDigest !== hotfix302.imageDigest ||
    options.expectedProvider !== hotfix302.provider ||
    options.identityContract !== hotfix302.identityContract ||
    options.providerConfigContract !== hotfix302.providerConfigContract
  )
    fail();
  const index = decode(bundle.index, hotfix302.imageDigest);
  const descriptors = index.manifests.filter(
    (entry) =>
      entry.platform?.os === 'linux' &&
      ['amd64', 'arm64'].includes(entry.platform?.architecture)
  );
  if (descriptors.length !== 2 || bundle.platforms?.length !== 2) fail();
  const architectures = new Set();
  let observedVersionLabel;
  for (let i = 0; i < descriptors.length; i += 1) {
    const descriptor = descriptors[i];
    architectures.add(descriptor.platform.architecture);
    const manifest = decode(bundle.platforms[i].manifest, descriptor.digest);
    const config = decode(bundle.platforms[i].config, manifest.config.digest);
    const labels = config.config?.Labels;
    observedVersionLabel = labels?.['org.opencontainers.image.version'];
    if (
      config.architecture !== descriptor.platform.architecture ||
      config.os !== 'linux' ||
      labels?.['org.opencontainers.image.revision'] !== hotfix302.revision ||
      labels?.['org.opencontainers.image.source'] !==
        'https://github.com/democratizedspace/dspace' ||
      labels?.['org.opencontainers.image.version'] !==
        hotfix302.imageVersionLabel
    )
      fail();
  }
  if (architectures.size !== 2) fail();
  // Extract the application release from the authenticated OCI label, never from runtime env.
  const applicationVersion = observedVersionLabel.match(
    /^v(3\.0\.2)\+4790074$/
  )?.[1];
  if (applicationVersion !== options.expectedVersion) fail();
  return {
    method: 'sha256-index-platform-config-version-label',
    applicationVersion,
    sourceRevision: hotfix302.revision,
    imageDigest: hotfix302.imageDigest,
    imageVersionLabel: observedVersionLabel,
  };
}

export function validateHotfixRuntime(meta, health, options) {
  const proof = verifyHotfixArtifact(options);
  if (
    !meta ||
    Object.keys(meta).sort().join(',') !== 'generatedAt,gitSha,source' ||
    meta.gitSha !== proof.sourceRevision ||
    typeof meta.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(meta.generatedAt)) ||
    typeof meta.source !== 'string' ||
    !meta.source.trim()
  )
    fail();
  // Health version is a configuration-consistency guard, NOT the artifact version proof.
  if (
    health?.status !== 'ready' ||
    health.version !== proof.imageVersionLabel
  ) {
    throw new Error('identity: hotfix health version configuration drift');
  }
  return proof;
}
