#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertTagAbsent,
  inspectChart,
  inspectImage,
} from './ghcr-manifest.mjs';

const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const IMAGE_TAG = /^(main|v3)-([0-9a-f]{7})$/;
const MODES = new Set([
  '--verify-local',
  '--verify-chart-local',
  '--verify-local-fixtures',
  '--pre-semantic',
  '--verify-image',
  '--verify-chart',
  '--emit-manifest',
  '--validate-manifest',
]);

function fail(message) {
  throw new Error(message);
}
function strict(value, pattern, label) {
  if (typeof value !== 'string' || !pattern.test(value))
    fail(`${label} is missing or malformed`);
  return value;
}
function json(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(`${path} is missing or malformed JSON`);
  }
}
function yamlScalar(text, key) {
  const matches = [
    ...text.matchAll(
      new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)["']?\\s*(?:#.*)?$`, 'gm')
    ),
  ];
  if (matches.length !== 1) fail(`Chart.yaml ${key} is missing or ambiguous`);
  return matches[0][1];
}
function oneLine(path) {
  const lines = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));
  if (lines.length !== 1 || lines[0].trim() !== lines[0])
    fail(`${path} must contain exactly one bare value`);
  return lines[0];
}
function git(root, ...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function readLocalCoordinates(root = process.cwd()) {
  const path = (name) => resolve(root, name);
  const rootPackage = json(path('package.json'));
  const frontendPackage = json(path('frontend/package.json'));
  const lock = json(path('package-lock.json'));
  const chartText = readFileSync(path('charts/dspace/Chart.yaml'), 'utf8');
  const applicationVersion = strict(
    rootPackage.version,
    SEMVER,
    'root package version'
  );
  for (const [label, value] of [
    ['frontend package version', frontendPackage.version],
    ['lockfile version', lock.version],
    ['lockfile root version', lock.packages?.['']?.version],
    ['chart appVersion', yamlScalar(chartText, 'appVersion')],
  ]) {
    strict(value, SEMVER, label);
    if (value !== applicationVersion)
      fail(`${label} does not equal application version ${applicationVersion}`);
  }
  const chartVersion = strict(
    yamlScalar(chartText, 'version'),
    SEMVER,
    'chart version'
  );
  const documented = strict(
    oneLine(path('docs/apps/dspace.version')),
    SEMVER,
    'documented chart version'
  );
  if (documented !== chartVersion)
    fail('documented chart version does not equal Chart.yaml version');
  return { applicationVersion, chartVersion };
}

export function validateReleaseSource({
  root = process.cwd(),
  releaseTag,
  chartTag,
  sourceRevision,
  branch,
  full = true,
}) {
  strict(
    releaseTag,
    /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/,
    'release tag'
  );
  strict(sourceRevision, SHA, 'source revision');
  if (!['main', 'v3'].includes(branch))
    fail('source branch must be main or v3');
  const local = readLocalCoordinates(root);
  if (releaseTag !== `v${local.applicationVersion}`)
    fail('release tag does not equal application version');
  if (git(root, 'rev-parse', 'HEAD') !== sourceRevision)
    fail('checked-out commit does not equal approved source revision');
  if (git(root, 'rev-parse', `${releaseTag}^{commit}`) !== sourceRevision)
    fail('release tag does not peel to approved source revision');
  try {
    git(
      root,
      'merge-base',
      '--is-ancestor',
      sourceRevision,
      `origin/${branch}`
    );
  } catch {
    fail(`approved source is not reachable from origin/${branch}`);
  }
  if (full) {
    if (chartTag !== `chart-v${local.chartVersion}`)
      fail('chart release tag does not equal approved chart version');
    if (git(root, 'rev-parse', `${chartTag}^{commit}`) !== sourceRevision)
      fail('chart release tag does not peel to approved source revision');
  }
  return {
    ...local,
    sourceRevision,
    branch,
    releaseTag,
    chartTag,
    imageTag: `${branch}-${sourceRevision.slice(0, 7)}`,
  };
}

export function validateImageTag(tag, revision) {
  const match = strict(tag, IMAGE_TAG, 'immutable deployment image tag');
  if (match.slice(-7) !== revision.slice(0, 7))
    fail('immutable deployment image tag does not match source revision');
  return tag;
}

export function releaseManifest(input) {
  const manifest = {
    schemaVersion: 1,
    app: 'dspace',
    applicationVersion: strict(
      input.applicationVersion,
      SEMVER,
      'applicationVersion'
    ),
    sourceRevision: strict(input.sourceRevision, SHA, 'sourceRevision'),
    imageTag: validateImageTag(input.imageTag, input.sourceRevision),
    imageDigest: strict(input.imageDigest, DIGEST, 'imageDigest'),
    chartVersion: strict(input.chartVersion, SEMVER, 'chartVersion'),
    chartDigest: strict(input.chartDigest, DIGEST, 'chartDigest'),
  };
  if (input.semanticTag !== `v${manifest.applicationVersion}`)
    fail('semanticTag does not match applicationVersion');
  manifest.semanticTag = input.semanticTag;
  return manifest;
}

export function assertExpectedDigest(actual, expected, message) {
  if (expected && actual !== expected) fail(message);
}

function env(name) {
  return (
    process.env[name] || fail(`Missing required environment variable ${name}`)
  );
}
function credentials() {
  return {
    username: env('GHCR_GUARD_USERNAME'),
    password: env('GHCR_GUARD_PASSWORD'),
  };
}
function registryBase() {
  return { owner: 'democratizedspace', ...credentials() };
}
function output(values) {
  const lines =
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT)
    writeFileSync(process.env.GITHUB_OUTPUT, lines, { flag: 'a' });
  else process.stdout.write(lines);
}

export async function run(mode) {
  if (!MODES.has(mode)) fail(`Unknown mode ${mode || '(missing)'}`);
  if (mode === '--verify-local-fixtures') {
    const revision = '0123456789abcdef0123456789abcdef01234567';
    const value = releaseManifest({
      applicationVersion: '3.1.1',
      sourceRevision: revision,
      imageTag: 'main-0123456',
      imageDigest: `sha256:${'1'.repeat(64)}`,
      chartVersion: '4.2.0',
      chartDigest: `sha256:${'2'.repeat(64)}`,
      semanticTag: 'v3.1.1',
    });
    const expected =
      '{"schemaVersion":1,"app":"dspace","applicationVersion":"3.1.1",' +
      '"sourceRevision":"0123456789abcdef0123456789abcdef01234567",' +
      '"imageTag":"main-0123456","imageDigest":"sha256:' +
      '1111111111111111111111111111111111111111111111111111111111111111",' +
      '"chartVersion":"4.2.0","chartDigest":"sha256:' +
      '2222222222222222222222222222222222222222222222222222222222222222",' +
      '"semanticTag":"v3.1.1"}';
    if (JSON.stringify(value) !== expected)
      fail('fixture manifest is not deterministic');
    if (JSON.stringify(releaseManifest(JSON.parse(expected))) !== expected)
      fail('fixture manifest emit/validate round trip is not deterministic');
    console.log('Release consistency fixtures passed (network-free).');
    return;
  }
  if (mode === '--verify-local') {
    const result = validateReleaseSource({
      releaseTag: env('RELEASE_TAG'),
      chartTag: env('CHART_TAG'),
      sourceRevision: env('SOURCE_SHA'),
      branch: env('SOURCE_BRANCH'),
      full: process.env.FULL_RELEASE !== 'false',
    });
    output(result);
    return;
  }
  if (mode === '--verify-chart-local') {
    const local = readLocalCoordinates();
    if (env('CHART_TAG') !== `chart-v${local.chartVersion}`)
      fail('chart release tag does not equal chart version');
    if (local.chartVersion === '3.0.1')
      fail('chart version 3.0.1 is permanently tombstoned');
    output(local);
    return;
  }
  if (mode === '--pre-semantic') {
    await assertTagAbsent({
      ...registryBase(),
      repo: 'dspace',
      tag: env('SEMANTIC_TAG'),
    });
    return;
  }
  if (mode === '--verify-image') {
    const evidence = await inspectImage({
      ...registryBase(),
      repo: 'dspace',
      tag: env('IMAGE_TAG'),
      revision: env('SOURCE_SHA'),
    });
    assertExpectedDigest(
      evidence.indexDigest,
      process.env.EXPECTED_IMAGE_DIGEST,
      'semantic and immutable image index digests differ'
    );
    output(evidence);
    return;
  }
  if (mode === '--verify-chart') {
    const evidence = await inspectChart({
      ...registryBase(),
      repo: 'charts/dspace',
      tag: env('CHART_VERSION'),
      version: env('CHART_VERSION'),
      appVersion: env('APPLICATION_VERSION'),
      revision: env('SOURCE_SHA'),
    });
    assertExpectedDigest(
      evidence.digest,
      process.env.EXPECTED_CHART_DIGEST,
      'published chart digest does not equal the push result'
    );
    output({ chartDigest: evidence.digest });
    return;
  }
  if (mode === '--emit-manifest') {
    const manifest = releaseManifest({
      applicationVersion: env('APPLICATION_VERSION'),
      sourceRevision: env('SOURCE_SHA'),
      imageTag: env('IMAGE_TAG'),
      imageDigest: env('IMAGE_DIGEST'),
      chartVersion: env('CHART_VERSION'),
      chartDigest: env('CHART_DIGEST'),
      semanticTag: env('SEMANTIC_TAG'),
    });
    writeFileSync(
      env('RELEASE_MANIFEST_PATH'),
      `${JSON.stringify(manifest, null, 2)}\n`
    );
    return;
  }
  const path = env('RELEASE_MANIFEST_PATH');
  const parsed = json(path);
  if (JSON.stringify(parsed) !== JSON.stringify(releaseManifest(parsed)))
    fail('release manifest has unknown, missing, or non-canonical fields');
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length !== 3) {
    console.error('Usage: check-release-consistency.mjs <mode>');
    process.exit(2);
  }
  run(process.argv[2]).catch((error) => {
    console.error(error?.message || String(error));
    process.exit(1);
  });
}
