import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { prepareCoordinates } from './prepare-staging-coordinates.mjs';

const repository = 'https://github.com/democratizedspace/dspace';
const revision = '1'.repeat(40);
const tree = '2'.repeat(40);
const other = '9'.repeat(40);
const unknown = `sha256:${'7'.repeat(64)}`;
const appVersion = '3.1.0';
const chartVersion = '3.9.9'; // Synthetic fixture, never a claim of real availability.
const node = '24.22.3';
const runtimeVersion = 'v3.1.0+1111111';
const manifestType = 'application/vnd.oci.image.manifest.v1+json';
const indexType = 'application/vnd.oci.image.index.v1+json';
const helmContentType = 'application/vnd.cncf.helm.chart.content.v1.tar+gzip';
const source = () => ({ appVersion, chartVersion, node, runtimeVersion, tree });

function fixture({
  imageRevision = revision,
  imageRepository = repository,
  imageRuntime = runtimeVersion,
  armConfigArch = 'arm64',
  missingArm = false,
  duplicateArm = false,
  chartRevision = revision,
  chartApp = appVersion,
  chartManifestRevision = revision,
  chartManifestVersion = chartVersion,
  chartConfigVersion = appVersion,
  chartContentType = helmContentType,
  chartManifestMediaType = undefined,
  extraChartLayerType,
} = {}) {
  const inventory = new Map();
  const save = (value) => {
    const bytes = Buffer.from(JSON.stringify(value) + '\n');
    const ref = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
    inventory.set(ref, bytes);
    return ref;
  };
  const platforms = {};
  const descriptors = ['amd64', 'arm64'].map((arch) => {
    const configDigest = save({
      os: 'linux',
      architecture: arch === 'arm64' ? armConfigArch : arch,
      variant: arch === 'arm64' ? 'v8' : undefined,
      config: {
        Labels: {
          'org.opencontainers.image.source': imageRepository,
          'org.opencontainers.image.revision': imageRevision,
        },
        Env: [`NODE_VERSION=${node}`, `DSPACE_VERSION=${imageRuntime}`],
      },
    });
    const digest = save({
      schemaVersion: 2,
      mediaType: manifestType,
      config: {
        mediaType: 'application/vnd.oci.image.config.v1+json',
        digest: configDigest,
      },
      layers: [{ digest: unknown }],
    });
    platforms[`linux/${arch}`] = { digest, configDigest };
    return {
      mediaType: manifestType,
      digest,
      platform: { os: 'linux', architecture: arch },
    };
  });
  if (missingArm) descriptors.pop();
  if (duplicateArm) descriptors.push(descriptors[1]);
  const imageDigest = save({
    schemaVersion: 2,
    mediaType: indexType,
    manifests: descriptors,
  });
  const chartConfig = save({
    name: 'dspace',
    version: chartVersion,
    appVersion: chartApp,
    annotations: {
      'org.opencontainers.image.source': repository,
      'org.opencontainers.image.revision': chartRevision,
      'org.opencontainers.image.version': chartConfigVersion,
    },
  });
  const chartDigest = save({
    schemaVersion: 2,
    ...(chartManifestMediaType !== undefined && {
      mediaType: chartManifestMediaType,
    }),
    config: {
      mediaType: 'application/vnd.cncf.helm.config.v1+json',
      digest: chartConfig,
    },
    layers: [
      ...(extraChartLayerType
        ? [
            {
              mediaType: extraChartLayerType,
              digest: `sha256:${'8'.repeat(64)}`,
              size: 29,
            },
          ]
        : []),
      { mediaType: chartContentType, digest: unknown, size: 1024 },
    ],
    annotations: {
      'org.opencontainers.image.source': repository,
      'org.opencontainers.image.revision': chartManifestRevision,
      ...(chartManifestVersion !== null && {
        'org.opencontainers.image.version': chartManifestVersion,
      }),
    },
  });
  const approval = {
    schema: 'dspace-staging-coordinate-approval-v1',
    environment: 'staging',
    approvalRef: 'synthetic-fixture-123',
    sourceRevision: revision,
    applicationVersion: appVersion,
    imageDigest,
    chartVersion,
    chartDigest,
  };
  return { inventory, approval, platforms, chartConfig };
}

const run = ({ inventory, approval }, reviewed = source) =>
  prepareCoordinates(approval, (ref) => inventory.get(ref), reviewed);

test('correlates both exact platforms and chart metadata, with no publication or deployment authority', async () => {
  const setup = fixture();
  assert.deepEqual(await run(setup), {
    schema: 'dspace-staging-coordinates-v1',
    environment: 'staging',
    app: 'dspace',
    sourceRevision: revision,
    sourceTree: tree,
    applicationVersion: appVersion,
    image: {
      repository: 'ghcr.io/democratizedspace/dspace',
      digest: setup.approval.imageDigest,
      platforms: setup.platforms,
    },
    chart: {
      repository: 'oci://ghcr.io/democratizedspace/charts/dspace',
      version: chartVersion,
      digest: setup.approval.chartDigest,
      contentDigest: unknown,
    },
    approvalRef: 'synthetic-fixture-123',
    evidenceType: 'offline-oci-metadata-correlation',
    deploymentAuthorized: false,
  });
});

test('accepts ORAS manifest with omitted body mediaType and provenance before chart content', async () => {
  const setup = fixture({
    extraChartLayerType: 'application/vnd.cncf.helm.chart.provenance.v1.prov',
  });
  const published = JSON.parse(setup.inventory.get(setup.approval.chartDigest));
  assert.equal(Object.hasOwn(published, 'mediaType'), false);
  assert.equal(
    published.layers[0].mediaType,
    'application/vnd.cncf.helm.chart.provenance.v1.prov'
  );
  assert.equal((await run(setup)).chart.contentDigest, unknown);
});

test('accepts explicit OCI manifest body mediaType', async () => {
  assert.equal(
    (await run(fixture({ chartManifestMediaType: manifestType }))).chart
      .contentDigest,
    unknown
  );
});

for (const [label, patch] of [
  ['production cannot consume this input', { environment: 'prod' }],
  ['semantic alias is not accepted', { semanticTag: 'v3.1.0' }],
  [
    'production authorization cannot be smuggled into coordinates',
    { deploymentAuthorized: true },
  ],
  ['missing approval reference', { approvalRef: undefined }],
  ['release manifest schema cannot be reused', { schema: 2 }],
  ['another application version', { applicationVersion: '3.1.1' }],
]) {
  test(label, async () => {
    const setup = fixture();
    Object.assign(setup.approval, patch);
    await assert.rejects(run(setup), /INVALID_STAGING_COORDINATE_APPROVAL/);
  });
}

test('rejects a git-reviewed chart mismatch before reading OCI metadata', async () => {
  await assert.rejects(
    run(fixture(), () => ({ ...source(), chartVersion: '3.1.3' })),
    /CHECKED_SOURCE_COORDINATES_MISMATCH/
  );
});

for (const [label, modify, error] of [
  [
    'missing required metadata',
    (s) => s.inventory.delete(s.chartConfig),
    /INVALID_OCI_METADATA_SIZE/,
  ],
  [
    'forged raw image bytes',
    (s) => s.inventory.set(s.approval.imageDigest, Buffer.from('{}')),
    /OCI_METADATA_DIGEST_MISMATCH/,
  ],
  [
    'image digest disagrees with independent approval',
    (s) => {
      s.approval.imageDigest = s.approval.chartDigest;
    },
    /INVALID_INDEX/,
  ],
  [
    'Helm archive digest cannot stand in for manifest digest',
    (s) => {
      s.approval.chartDigest = unknown;
    },
    /INVALID_OCI_METADATA_SIZE/,
  ],
  [
    'changed bytes under approved Helm digest',
    (s) => s.inventory.set(s.approval.chartDigest, Buffer.from('{}')),
    /OCI_METADATA_DIGEST_MISMATCH/,
  ],
]) {
  test(label, async () => {
    const setup = fixture();
    modify(setup);
    await assert.rejects(run(setup), error);
  });
}

for (const [label, options, error] of [
  ['wrong image source SHA', { imageRevision: other }, /IMAGE_SOURCE_MISMATCH/],
  [
    'wrong image repository',
    { imageRepository: 'https://github.com/other/project' },
    /IMAGE_SOURCE_MISMATCH/,
  ],
  [
    'wrong image runtime version',
    { imageRuntime: 'v3.0.2' },
    /REGISTRY_RUNTIME_CONFIG_MISMATCH/,
  ],
  [
    'index repeats an architecture',
    { duplicateArm: true },
    /UNEXPECTED_OR_DUPLICATE_PLATFORM/,
  ],
  ['index omits ARM64', { missingArm: true }, /MISSING_PLATFORM/],
  [
    'cross-platform config',
    { armConfigArch: 'amd64' },
    /REGISTRY_PLATFORM_MISMATCH/,
  ],
  [
    'wrong chart commit despite good image',
    { chartRevision: other },
    /CHART_PROVENANCE_MISMATCH/,
  ],
  [
    'published chart appVersion is stale',
    { chartApp: '3.0.2' },
    /CHART_COORDINATES_MISMATCH/,
  ],
  [
    'manifest cannot disagree with chart config source',
    { chartManifestRevision: other },
    /CHART_PROVENANCE_MISMATCH/,
  ],
  [
    'Helm manifest annotation must be the chart version, not appVersion',
    { chartManifestVersion: appVersion },
    /CHART_VERSION_ANNOTATIONS_MISMATCH/,
  ],
  [
    'rejects an arbitrary manifest version annotation',
    { chartManifestVersion: '9.9.9' },
    /CHART_VERSION_ANNOTATIONS_MISMATCH/,
  ],
  [
    'DSPACE config annotation must be appVersion, not chart version',
    { chartConfigVersion: chartVersion },
    /CHART_VERSION_ANNOTATIONS_MISMATCH/,
  ],
  [
    'rejects missing canonical manifest version annotation',
    { chartManifestVersion: null },
    /CHART_VERSION_ANNOTATIONS_MISMATCH/,
  ],
  [
    'rejects explicit incorrect Helm manifest body mediaType',
    { chartManifestMediaType: indexType },
    /INVALID_HELM_OCI_MANIFEST/,
  ],
  [
    'rejects two chart archive layers',
    { extraChartLayerType: helmContentType },
    /INVALID_HELM_OCI_MANIFEST/,
  ],
  [
    'unexpected chart layer media type',
    { chartContentType: manifestType },
    /INVALID_HELM_OCI_MANIFEST/,
  ],
]) {
  test(label, async () => {
    await assert.rejects(run(fixture(options)), error);
  });
}

test('CLI fails with no receipt on invalid input; offline program has no network/command to publish', () => {
  const file = new URL('./prepare-staging-coordinates.mjs', import.meta.url);
  const result = spawnSync(process.execPath, [file.pathname], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  const code = readFileSync(file, 'utf8');
  assert.doesNotMatch(
    code,
    /fetch\s*\(|https?\.request|helm\s+push|semanticTag|assertTagAbsent/
  );
});
