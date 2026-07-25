#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';
import {
  assertTagAbsent,
  describeManifest,
  inspectChart,
  inspectImage,
} from './ghcr-manifest.mjs';

export const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
export const SHA = /^[0-9a-f]{40}$/;
export const DIGEST = /^sha256:[0-9a-f]{64}$/;
const required = (ok, message) => {
  if (!ok) throw new Error(message);
};
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

export function validateLocalCoordinates(input) {
  const {
    applicationVersion,
    frontendVersion,
    lockfileVersion,
    chartVersion,
    chartAppVersion,
    releaseTag,
    chartTag,
    sourceRevision,
    releaseTagRevision,
    chartTagRevision,
    branch,
    imageTag,
  } = input;
  for (const [name, value] of [
    ['application version', applicationVersion],
    ['frontend version', frontendVersion],
    ['lockfile version', lockfileVersion],
    ['chart version', chartVersion],
    ['chart appVersion', chartAppVersion],
  ])
    required(SEMVER.test(value), `${name} must be strict bare X.Y.Z SemVer`);
  required(
    applicationVersion === frontendVersion &&
      applicationVersion === lockfileVersion,
    'Root, frontend, and lockfile application versions must agree'
  );
  required(
    chartAppVersion === applicationVersion,
    'Chart appVersion must equal application version'
  );
  required(
    releaseTag === `v${applicationVersion}`,
    'Release tag does not match application version'
  );
  required(
    chartTag === `chart-v${chartVersion}`,
    'Chart tag does not match chart version'
  );
  required(
    SHA.test(sourceRevision),
    'Approved source revision must be a full 40-character SHA'
  );
  required(
    releaseTagRevision === sourceRevision,
    'Release tag does not peel to approved source revision'
  );
  required(
    chartTagRevision === sourceRevision,
    'Chart tag does not peel to approved source revision'
  );
  required(
    branch === 'main' || branch === 'v3',
    'Source must be reachable from main or v3'
  );
  required(
    imageTag === `${branch}-${sourceRevision.slice(0, 7)}`,
    'Deployment image tag must be the derived immutable branch-SHA tag'
  );
  return input;
}

export function validateImage(image, sourceRevision) {
  required(
    DIGEST.test(image?.indexDigest || ''),
    'Immutable image index digest is invalid'
  );
  for (const arch of ['amd64', 'arm64']) {
    required(
      image?.platforms?.[arch],
      `Image is missing required platform linux/${arch}`
    );
    required(
      image.platforms[arch].revision === sourceRevision,
      `linux/${arch} image revision label does not match approved source revision`
    );
    required(
      DIGEST.test(image.platforms[arch].manifestDigest || ''),
      `linux/${arch} manifest digest is invalid`
    );
  }
  return image;
}

export function validateChartArtifact(chart, expected) {
  required(
    chart && chart.present !== false,
    'Expected chart artifact is missing'
  );
  required(
    chart.version === expected.chartVersion,
    'Published chart version mismatch'
  );
  required(
    chart.appVersion === expected.applicationVersion,
    'Published chart appVersion mismatch'
  );
  required(
    chart.revision === expected.sourceRevision,
    'Published chart source revision mismatch'
  );
  required(
    DIGEST.test(chart.digest || ''),
    'Published chart digest is invalid'
  );
  return chart;
}

export function createReleaseManifest({ coordinates, image, chart }) {
  validateLocalCoordinates(coordinates);
  validateImage(image, coordinates.sourceRevision);
  validateChartArtifact(chart, coordinates);
  return {
    schemaVersion: 1,
    app: 'dspace',
    applicationVersion: coordinates.applicationVersion,
    sourceRevision: coordinates.sourceRevision,
    imageTag: coordinates.imageTag,
    imageDigest: image.indexDigest,
    platformDigests: {
      'linux/amd64': image.platforms.amd64.manifestDigest,
      'linux/arm64': image.platforms.arm64.manifestDigest,
    },
    semanticImageTag: coordinates.releaseTag,
    chartVersion: coordinates.chartVersion,
    chartDigest: chart.digest,
  };
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}
function loadLocal() {
  const root = json('package.json'),
    frontend = json('frontend/package.json'),
    lock = json('package-lock.json');
  const chart = parseYaml(readFileSync('charts/dspace/Chart.yaml', 'utf8'));
  const sourceRevision =
    process.env.SOURCE_REVISION || git('rev-parse', 'HEAD');
  const branch = process.env.SOURCE_BRANCH || '';
  const releaseTag = process.env.RELEASE_TAG || '';
  const chartTag = process.env.CHART_TAG || `chart-v${chart.version}`;
  return validateLocalCoordinates({
    applicationVersion: root.version,
    frontendVersion: frontend.version,
    lockfileVersion: lock.packages?.['']?.version || lock.version,
    chartVersion: String(chart.version),
    chartAppVersion: String(chart.appVersion),
    releaseTag,
    chartTag,
    sourceRevision,
    releaseTagRevision: git('rev-parse', `${releaseTag}^{commit}`),
    chartTagRevision: git('rev-parse', `${chartTag}^{commit}`),
    branch,
    imageTag: `${branch}-${sourceRevision.slice(0, 7)}`,
  });
}

export function verifyLocalFixtures() {
  const sha = 'a'.repeat(40),
    digest = `sha256:${'b'.repeat(64)}`;
  const coordinates = {
    applicationVersion: '3.1.0',
    frontendVersion: '3.1.0',
    lockfileVersion: '3.1.0',
    chartVersion: '4.0.0',
    chartAppVersion: '3.1.0',
    releaseTag: 'v3.1.0',
    chartTag: 'chart-v4.0.0',
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
  const chart = {
    version: '4.0.0',
    appVersion: '3.1.0',
    revision: sha,
    digest,
  };
  const first = JSON.stringify(
    createReleaseManifest({ coordinates, image, chart })
  );
  required(
    first ===
      JSON.stringify(createReleaseManifest({ coordinates, image, chart })),
    'Manifest output is not deterministic'
  );
  console.log('Local release-consistency fixtures passed.');
}

async function main(argv) {
  if (argv.length === 1 && argv[0] === '--verify-local-fixtures')
    return verifyLocalFixtures();
  const mode = argv[0];
  if (mode === 'chart-candidate' && argv.length === 1) {
    const root = json('package.json');
    const frontend = json('frontend/package.json');
    const lock = json('package-lock.json');
    const chart = parseYaml(readFileSync('charts/dspace/Chart.yaml', 'utf8'));
    const version = String(chart.version);
    required(
      SEMVER.test(version) && version !== '3.0.1',
      'Chart version is invalid or tombstoned'
    );
    required(
      SEMVER.test(String(chart.appVersion)),
      'Chart appVersion must be strict bare SemVer'
    );
    required(
      root.version === frontend.version &&
        root.version === (lock.packages?.['']?.version || lock.version) &&
        root.version === String(chart.appVersion),
      'Application metadata and chart appVersion must agree'
    );
    required(
      readFileSync('docs/apps/dspace.version', 'utf8').trim() === version,
      'Chart version and docs/apps/dspace.version must agree'
    );
    required(
      process.env.CHART_TAG === `chart-v${version}`,
      'Chart tag does not match chart version'
    );
    required(
      process.env.SOURCE_REVISION ===
        git('rev-parse', `${process.env.CHART_TAG}^{commit}`),
      'Chart tag does not peel to approved source revision'
    );
    console.log('Chart release candidate coordinates are consistent.');
    return;
  }
  if (mode === 'chart-published' && argv.length === 1) {
    const root = json('package.json');
    const chartYaml = parseYaml(
      readFileSync('charts/dspace/Chart.yaml', 'utf8')
    );
    const credentials = {
      owner: 'democratizedspace',
      username: process.env.GHCR_GUARD_USERNAME,
      password: process.env.GHCR_GUARD_PASSWORD, // scan-secrets: ignore (environment credential plumbing)
    };
    const chart = validateChartArtifact(
      await inspectChart({
        ...credentials,
        repo: 'charts/dspace',
        tag: String(chartYaml.version),
      }),
      {
        chartVersion: String(chartYaml.version),
        applicationVersion: root.version,
        sourceRevision: process.env.SOURCE_REVISION,
      }
    );
    required(
      chart.digest === process.env.EXPECTED_CHART_DIGEST,
      'Published chart digest does not match helm push evidence'
    );
    console.log(`Verified published chart ${chart.version}@${chart.digest}.`);
    return;
  }
  required(
    ['pre-semantic', 'post-semantic'].includes(mode) && argv.length === 1,
    'Usage: check-release-consistency.mjs --verify-local-fixtures | <pre-semantic|post-semantic>'
  );
  const coordinates = loadLocal();
  const credentials = {
    owner: 'democratizedspace',
    username: process.env.GHCR_GUARD_USERNAME,
    password: process.env.GHCR_GUARD_PASSWORD, // scan-secrets: ignore (environment credential plumbing)
  };
  const image = validateImage(
    await inspectImage({
      ...credentials,
      repo: 'dspace',
      tag: coordinates.imageTag,
    }),
    coordinates.sourceRevision
  );
  const chart = validateChartArtifact(
    await inspectChart({
      ...credentials,
      repo: 'charts/dspace',
      tag: coordinates.chartVersion,
    }),
    coordinates
  );
  if (mode === 'pre-semantic') {
    await assertTagAbsent({
      ...credentials,
      repo: 'dspace',
      tag: coordinates.releaseTag,
    });
    return;
  }
  const semantic = await describeManifest({
    ...credentials,
    repo: 'dspace',
    tag: coordinates.releaseTag,
  });
  required(
    semantic.indexDigest === image.indexDigest,
    'Semantic and immutable image index digests differ'
  );
  const manifest = createReleaseManifest({ coordinates, image, chart });
  const output =
    process.env.RELEASE_MANIFEST_PATH ||
    `dspace-release-v${coordinates.applicationVersion}.json`;
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Validated and wrote ${output}`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`)
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
