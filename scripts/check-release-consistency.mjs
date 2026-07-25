#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  assertTagAbsent,
  inspectChart,
  inspectImage,
} from './ghcr-manifest.mjs';

export const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
export const SHA = /^[0-9a-f]{40}$/;
export const DIGEST = /^sha256:[0-9a-f]{64}$/;
const BRANCHES = new Set(['main', 'v3']);
const fail = (message) => {
  throw new Error(message);
};
const valid = (value, regex, label) =>
  typeof value === 'string' && regex.test(value)
    ? value
    : fail(`Invalid ${label}`);
const json = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return fail(`Malformed JSON: ${file}`);
  }
};
const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export function readLocalCoordinates(root = '.') {
  const pkg = json(`${root}/package.json`),
    frontend = json(`${root}/frontend/package.json`),
    lock = json(`${root}/package-lock.json`);
  const chartText = readFileSync(`${root}/charts/dspace/Chart.yaml`, 'utf8');
  const scalar = (key) => {
    const matches = [
      ...chartText.matchAll(
        new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)["']?\\s*(?:#.*)?$`, 'gm')
      ),
    ];
    return matches.length === 1
      ? matches[0][1]
      : fail(`Missing or ambiguous Chart.yaml ${key}`);
  };
  const documented = readFileSync(`${root}/docs/apps/dspace.version`, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));
  const applicationVersion = valid(pkg.version, SEMVER, 'root package version');
  for (const [label, value] of [
    ['frontend package version', frontend.version],
    ['package-lock version', lock.version],
    ['package-lock root version', lock.packages?.['']?.version],
    ['chart appVersion', scalar('appVersion')],
  ]) {
    valid(value, SEMVER, label);
    if (value !== applicationVersion)
      fail(`${label} does not equal application version`);
  }
  const chartVersion = valid(scalar('version'), SEMVER, 'chart version');
  if (documented.length !== 1 || documented[0] !== chartVersion)
    fail('docs/apps/dspace.version does not equal chart version');
  return { applicationVersion, chartVersion };
}

export function validateSource({
  releaseTag,
  chartTag,
  sourceRevision,
  branch,
  fullRelease = true,
}) {
  valid(sourceRevision, SHA, 'source revision');
  if (!BRANCHES.has(branch)) fail('Unsupported release branch');
  if (fullRelease) {
    const releaseCommit = git('rev-parse', `${releaseTag}^{commit}`);
    const chartCommit = git('rev-parse', `${chartTag}^{commit}`);
    if (releaseCommit !== sourceRevision || chartCommit !== sourceRevision)
      fail('Release tags do not peel to the approved source revision');
    try {
      execFileSync(
        'git',
        ['merge-base', '--is-ancestor', sourceRevision, `origin/${branch}`],
        { stdio: 'ignore' }
      );
    } catch {
      fail(`Approved commit is not reachable from origin/${branch}`);
    }
  }
}

export function immutableImageTag(branch, revision) {
  if (!BRANCHES.has(branch)) fail('Unsupported release branch');
  valid(revision, SHA, 'source revision');
  const tag = `${branch}-${revision.slice(0, 7)}`;
  if (!/^(main|v3)-[0-9a-f]{7}$/.test(tag))
    fail('Mutable or malformed deployment image tag');
  return tag;
}

export function validateEvidence({
  coordinates,
  sourceRevision,
  branch,
  image,
  chart,
  semanticDigest,
}) {
  const imageTag = immutableImageTag(branch, sourceRevision);
  valid(image?.indexDigest, DIGEST, 'image digest');
  for (const arch of ['amd64', 'arm64']) {
    valid(image?.platforms?.[arch]?.digest, DIGEST, `linux/${arch} digest`);
    if (image.platforms[arch].revision !== sourceRevision)
      fail(`linux/${arch} source revision mismatch`);
  }
  valid(chart?.digest, DIGEST, 'chart digest');
  const labels =
    chart.config?.config?.Labels || chart.config?.annotations || chart.config;
  if (
    String(
      labels?.['org.opencontainers.image.version'] ?? labels?.version ?? ''
    ) !== coordinates.applicationVersion
  )
    fail('Chart appVersion mismatch');
  if (
    String(labels?.['org.opencontainers.image.revision'] ?? '') !==
    sourceRevision
  )
    fail('Chart source revision mismatch');
  if (
    String(
      labels?.['org.opencontainers.image.chart.version'] ??
        chart.config?.chartVersion ??
        ''
    ) !== coordinates.chartVersion
  )
    fail('Chart version mismatch');
  if (semanticDigest !== undefined && semanticDigest !== image.indexDigest)
    fail('Semantic and immutable image digests differ');
  return {
    schemaVersion: 1,
    app: 'dspace',
    applicationVersion: coordinates.applicationVersion,
    sourceRevision,
    imageTag,
    imageDigest: image.indexDigest,
    platformDigests: {
      'linux/amd64': image.platforms.amd64.digest,
      'linux/arm64': image.platforms.arm64.digest,
    },
    semanticTag: `v${coordinates.applicationVersion}`,
    chartVersion: coordinates.chartVersion,
    chartDigest: chart.digest,
  };
}

export function writeManifest(file, manifest) {
  validateManifest(manifest);
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}
export function validateManifest(m) {
  if (m?.schemaVersion !== 1 || m?.app !== 'dspace')
    fail('Invalid release manifest schema');
  valid(m.applicationVersion, SEMVER, 'manifest applicationVersion');
  valid(m.chartVersion, SEMVER, 'manifest chartVersion');
  valid(m.sourceRevision, SHA, 'manifest sourceRevision');
  valid(m.imageDigest, DIGEST, 'manifest imageDigest');
  valid(m.chartDigest, DIGEST, 'manifest chartDigest');
  valid(m.platformDigests?.['linux/amd64'], DIGEST, 'manifest linux/amd64 digest');
  valid(m.platformDigests?.['linux/arm64'], DIGEST, 'manifest linux/arm64 digest');
  if (m.semanticTag !== `v${m.applicationVersion}`) fail('Invalid manifest semanticTag');
  if (
    m.imageTag !==
    immutableImageTag(
      m.imageTag.startsWith('main-') ? 'main' : 'v3',
      m.sourceRevision
    )
  )
    fail('Invalid manifest imageTag');
  return m;
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || !argv[i + 1] || out[argv[i].slice(2)])
      fail('Invalid or duplicate arguments');
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}
const allowedArguments = {
  local: ['root', 'release-tag', 'chart-tag', 'revision', 'branch'],
  'chart-local': ['root', 'tag', 'revision'],
  'check-absent': ['repo', 'tag'],
  'verify-chart': ['tag', 'application-version', 'chart-version', 'revision', 'digest'],
  full: ['root', 'release-tag', 'chart-tag', 'revision', 'branch', 'semantic-state', 'output'],
  'validate-manifest': ['file'],
};
export async function run(argv = process.argv.slice(2), deps = {}) {
  if (argv.length === 1 && argv[0] === '--verify-local-fixtures') {
    const sha = '0123456789abcdef0123456789abcdef01234567',
      digest = `sha256:${'a'.repeat(64)}`,
      chartDigest = `sha256:${'b'.repeat(64)}`;
    const manifest = validateEvidence({
      coordinates: { applicationVersion: '3.1.0', chartVersion: '4.0.0' },
      sourceRevision: sha,
      branch: 'main',
      image: {
        indexDigest: digest,
        platforms: {
          amd64: { digest, revision: sha },
          arm64: { digest, revision: sha },
        },
      },
      chart: {
        digest: chartDigest,
        config: {
          version: '3.1.0',
          chartVersion: '4.0.0',
          'org.opencontainers.image.revision': sha,
        },
      },
    });
    validateManifest(manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  const [command, ...rest] = argv,
    o = args(rest),
    credentials = {
      username: process.env.GHCR_GUARD_USERNAME,
      password: process.env.GHCR_GUARD_PASSWORD, // scan-secrets: ignore (environment reference, not a literal secret)
    };
  if (!allowedArguments[command]) fail('Unknown command');
  for (const key of Object.keys(o)) {
    if (!allowedArguments[command].includes(key)) fail(`Unknown argument: --${key}`);
  }
  if (command === 'local') {
    const c = readLocalCoordinates(o.root || '.');
    const sha = valid(o.revision, SHA, 'source revision');
    if (
      o['release-tag'] !== `v${c.applicationVersion}` ||
      o['chart-tag'] !== `chart-v${c.chartVersion}`
    )
      fail('Release tag/version mismatch');
    validateSource({
      releaseTag: o['release-tag'],
      chartTag: o['chart-tag'],
      sourceRevision: sha,
      branch: o.branch,
    });
    process.stdout.write(
      `${JSON.stringify({ ...c, imageTag: immutableImageTag(o.branch, sha) })}\n`
    );
    return;
  }
  if (command === 'chart-local') {
    const c = readLocalCoordinates(o.root || '.');
    const sha = valid(o.revision, SHA, 'source revision');
    if (
      o.tag !== `chart-v${c.chartVersion}` ||
      git('rev-parse', `${o.tag}^{commit}`) !== sha ||
      git('rev-parse', 'HEAD') !== sha
    )
      fail('Chart tag/version/source mismatch');
    process.stdout.write(`${JSON.stringify({ ...c, sourceRevision: sha })}\n`);
    return;
  }
  if (command === 'check-absent')
    return (deps.assertTagAbsent || assertTagAbsent)({
      owner: 'democratizedspace',
      repo: o.repo,
      tag: o.tag,
      ...credentials,
    });
  if (command === 'verify-chart') {
    const chart = await (deps.inspectChart || inspectChart)({
      owner: 'democratizedspace',
      repo: 'charts/dspace',
      tag: o.tag,
      ...credentials,
    });
    const labels = chart.config?.annotations || chart.config;
    valid(o.revision, SHA, 'source revision');
    valid(o.digest, DIGEST, 'reported chart digest');
    if (
      chart.digest !== o.digest ||
      chart.config?.chartVersion !== o['chart-version'] ||
      labels?.['org.opencontainers.image.version'] !==
        o['application-version'] ||
      labels?.['org.opencontainers.image.revision'] !== o.revision
    )
      fail('Published chart coordinate or provenance mismatch');
    process.stdout.write(`${JSON.stringify(chart)}\n`);
    return chart;
  }
  if (command === 'full') {
    const c = readLocalCoordinates(o.root || '.');
    const sha = valid(o.revision, SHA, 'source revision');
    if (
      o['release-tag'] !== `v${c.applicationVersion}` ||
      o['chart-tag'] !== `chart-v${c.chartVersion}`
    )
      fail('Release tag/version mismatch');
    validateSource({
      releaseTag: o['release-tag'],
      chartTag: o['chart-tag'],
      sourceRevision: sha,
      branch: o.branch,
    });
    const image = await (deps.inspectImage || inspectImage)({
      owner: 'democratizedspace',
      repo: 'dspace',
      tag: immutableImageTag(o.branch, sha),
      ...credentials,
    });
    const chart = await (deps.inspectChart || inspectChart)({
      owner: 'democratizedspace',
      repo: 'charts/dspace',
      tag: c.chartVersion,
      ...credentials,
    });
    if (!['absent', 'present'].includes(o['semantic-state'])) fail('Invalid semantic state');
    let semanticDigest;
    if (o['semantic-state'] === 'present')
      semanticDigest = (
        await (deps.inspectImage || inspectImage)({
          owner: 'democratizedspace',
          repo: 'dspace',
          tag: `v${c.applicationVersion}`,
          ...credentials,
        })
      ).indexDigest;
    else
      await (deps.assertTagAbsent || assertTagAbsent)({
        owner: 'democratizedspace',
        repo: 'dspace',
        tag: `v${c.applicationVersion}`,
        ...credentials,
      });
    const manifest = validateEvidence({
      coordinates: c,
      sourceRevision: sha,
      branch: o.branch,
      image,
      chart,
      semanticDigest,
    });
    if (o.output) writeManifest(o.output, manifest);
    process.stdout.write(`${JSON.stringify(manifest)}\n`);
    return manifest;
  }
  if (command === 'validate-manifest') return validateManifest(json(o.file));
  fail(
    'Usage: check-release-consistency.mjs <local|check-absent|full|validate-manifest> ...'
  );
}
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`)
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
