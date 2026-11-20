import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants, closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  reviewedSource,
  verifyImageDescriptorGraph,
} from './verify-candidate-image.mjs';

const digest = /^sha256:[a-f0-9]{64}$(?![\s\S])/;
const sha = /^[a-f0-9]{40}$(?![\s\S])/;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$(?![\s\S])/;
const sourceRepository = 'https://github.com/democratizedspace/dspace';

function requireThat(condition, reason) {
  if (!condition) throw new Error(reason);
}

function exact(value, keys) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function pattern(value, regex) {
  return typeof value === 'string' && regex.test(value);
}

export function checkApproval(input) {
  const keys = [
    'schema',
    'environment',
    'approvalRef',
    'sourceRevision',
    'applicationVersion',
    'imageDigest',
    'chartVersion',
    'chartDigest',
  ];
  requireThat(
    exact(input, keys) &&
      input.schema === 'dspace-staging-coordinate-approval-v1' &&
      input.environment === 'staging' &&
      pattern(input.approvalRef, /^[A-Za-z0-9_-]{1,128}$(?![\s\S])/) &&
      pattern(input.sourceRevision, sha) &&
      input.applicationVersion === '3.1.0' &&
      pattern(input.imageDigest, digest) &&
      pattern(input.chartVersion, semver) &&
      pattern(input.chartDigest, digest),
    'INVALID_STAGING_COORDINATE_APPROVAL'
  );
}

function git(...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
  }).trim();
}

function reviewedCommit(revision) {
  const checkout = git('rev-parse', 'HEAD');
  const source = reviewedSource(
    { workflowSha: checkout, sourceSha: revision },
    (_, args) => git(...args)
  );
  const chart = git('show', `${revision}:charts/dspace/Chart.yaml`);
  const readScalar = (key) => {
    const matches = [
      ...chart.matchAll(
        new RegExp(`^${key}:[ \\t]*["']?([0-9.]+)["']?[ \\t]*$`, 'gm')
      ),
    ];
    requireThat(matches.length === 1, 'INVALID_REVIEWED_CHART');
    return matches[0][1];
  };
  const chartVersion = readScalar('version');
  const documentedVersion = git('show', `${revision}:docs/apps/dspace.version`)
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));
  const lock = JSON.parse(git('show', `${revision}:package-lock.json`));
  requireThat(
    readScalar('appVersion') === source.appVersion &&
      lock.version === source.appVersion &&
      lock.packages?.['']?.version === source.appVersion &&
      documentedVersion.length === 1 &&
      documentedVersion[0] === chartVersion,
    'REVIEWED_APP_OR_CHART_VERSION_MISMATCH'
  );
  return { ...source, chartVersion };
}

function checkedObject(read, ref) {
  requireThat(pattern(ref, digest), 'INVALID_OCI_DESCRIPTOR');
  const bytes = read(ref);
  requireThat(
    Buffer.isBuffer(bytes) && bytes.length <= 1024 * 1024,
    'INVALID_OCI_METADATA_SIZE'
  );
  requireThat(
    `sha256:${createHash('sha256').update(bytes).digest('hex')}` === ref,
    'OCI_METADATA_DIGEST_MISMATCH'
  );
  const value = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  );
  requireThat(
    value && typeof value === 'object' && !Array.isArray(value),
    'INVALID_OCI_METADATA_OBJECT'
  );
  return value;
}

function verifyChart(input, read) {
  const manifest = checkedObject(read, input.chartDigest);
  const chartMediaType = 'application/vnd.cncf.helm.chart.content.v1.tar+gzip';
  const provenanceMediaType =
    'application/vnd.cncf.helm.chart.provenance.v1.prov';
  requireThat(
    manifest.schemaVersion === 2 &&
      // Helm's ORAS writer sets the external descriptor media type but omits
      // the optional mediaType field in the raw manifest body.
      (!Object.hasOwn(manifest, 'mediaType') ||
        manifest.mediaType === 'application/vnd.oci.image.manifest.v1+json') &&
      manifest.config?.mediaType ===
        'application/vnd.cncf.helm.config.v1+json' &&
      Array.isArray(manifest.layers) &&
      (manifest.layers.length === 1 || manifest.layers.length === 2) &&
      manifest.layers.every(
        (layer) =>
          [chartMediaType, provenanceMediaType].includes(layer?.mediaType) &&
          pattern(layer.digest, digest) &&
          Number.isSafeInteger(layer.size) &&
          layer.size > 0
      ),
    'INVALID_HELM_OCI_MANIFEST'
  );
  const contentLayers = manifest.layers.filter(
    (layer) => layer.mediaType === chartMediaType
  );
  requireThat(contentLayers.length === 1, 'INVALID_HELM_OCI_MANIFEST');
  const config = checkedObject(read, manifest.config.digest);
  requireThat(
    config.name === 'dspace' &&
      config.version === input.chartVersion &&
      config.appVersion === input.applicationVersion,
    'CHART_COORDINATES_MISMATCH'
  );
  for (const [key, expected] of [
    ['org.opencontainers.image.source', sourceRepository],
    ['org.opencontainers.image.revision', input.sourceRevision],
  ]) {
    requireThat(
      config.annotations?.[key] === expected &&
        (!Object.hasOwn(manifest.annotations ?? {}, key) ||
          manifest.annotations[key] === expected),
      'CHART_PROVENANCE_MISMATCH'
    );
  }
  // Helm 3.12.3 sets the manifest annotation from Chart.yaml version,
  // while the project's staged Chart.yaml sets the config annotation to appVersion.
  const versionKey = 'org.opencontainers.image.version';
  requireThat(
    config.annotations?.[versionKey] === input.applicationVersion &&
      manifest.annotations?.[versionKey] === input.chartVersion,
    'CHART_VERSION_ANNOTATIONS_MISMATCH'
  );
  return { contentDigest: contentLayers[0].digest };
}

export async function prepareCoordinates(input, read, source = reviewedCommit) {
  checkApproval(input);
  const reviewed = source(input.sourceRevision);
  requireThat(
    reviewed.appVersion === input.applicationVersion &&
      reviewed.chartVersion === input.chartVersion,
    'CHECKED_SOURCE_COORDINATES_MISMATCH'
  );
  const readJson = (_, ref) => checkedObject(read, ref);
  const platforms = {};
  for (const arch of ['amd64', 'arm64']) {
    const { platformDigest, configDigest } = await verifyImageDescriptorGraph(
      { arch, sourceSha: input.sourceRevision, indexDigest: input.imageDigest },
      reviewed,
      readJson
    );
    platforms[`linux/${arch}`] = { digest: platformDigest, configDigest };
  }
  const chart = verifyChart(input, read);
  return {
    schema: 'dspace-staging-coordinates-v1',
    environment: 'staging',
    app: 'dspace',
    sourceRevision: input.sourceRevision,
    sourceTree: reviewed.tree,
    applicationVersion: input.applicationVersion,
    image: {
      repository: 'ghcr.io/democratizedspace/dspace',
      digest: input.imageDigest,
      platforms,
    },
    chart: {
      repository: 'oci://ghcr.io/democratizedspace/charts/dspace',
      version: input.chartVersion,
      digest: input.chartDigest,
      ...chart,
    },
    approvalRef: input.approvalRef,
    evidenceType: 'offline-oci-metadata-correlation',
    deploymentAuthorized: false,
  };
}

function readFile(path, limit) {
  const fd = openSync(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK
  );
  try {
    const metadata = fstatSync(fd);
    requireThat(
      metadata.isFile() && metadata.size <= limit,
      'INVALID_INPUT_FILE'
    );
    const bytes = Buffer.alloc(limit + 1);
    let offset = 0;
    while (offset <= limit) {
      const length = readSync(fd, bytes, offset, bytes.length - offset);
      if (length === 0) break;
      offset += length;
    }
    requireThat(
      offset <= limit && offset === metadata.size,
      'INVALID_INPUT_FILE_SIZE'
    );
    return bytes.subarray(0, offset);
  } finally {
    closeSync(fd);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [approvalFile, metadataDirectory, ...extra] = process.argv.slice(2);
    requireThat(
      approvalFile && metadataDirectory && !extra.length,
      'USAGE: prepare-staging-coordinates.mjs APPROVAL_JSON OCI_METADATA_DIRECTORY'
    );
    const approval = JSON.parse(readFile(approvalFile, 8192).toString('utf8'));
    const receipt = await prepareCoordinates(approval, (ref) =>
      readFile(join(metadataDirectory, ref.slice(7)), 1024 * 1024)
    );
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  } catch {
    // Avoid printing arbitrary approval metadata, local paths, or file content.
    console.error(
      'Staging coordinate preparation failed: check usage, approval, reviewed source and exact OCI metadata files.'
    );
    process.exitCode = 1;
  }
}
