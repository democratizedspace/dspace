#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import {
  inspectArtifact,
  inspectImage,
  assertTagAbsent,
} from './ghcr-manifest.mjs';

const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const BRANCHES = new Set(['main', 'v3']);
const allowed = new Set([
  'mode',
  'release-tag',
  'chart-tag',
  'source-sha',
  'source-branch',
  'image-tag',
  'manifest',
  'owner',
  'image-repo',
  'chart-repo',
]);
const fail = (message) => {
  throw new Error(message);
};
const json = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fail(`Missing or malformed coordinate file: ${path}`);
  }
};
const scalar = (path, key) => {
  const matches = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) =>
      line.match(new RegExp(`^${key}:\\s*["']?([^"'#\\s]+)["']?\\s*(?:#.*)?$`))
    )
    .filter(Boolean);
  if (matches.length !== 1) fail(`${path} must contain exactly one ${key}`);
  return matches[0][1];
};
const strictVersion = (value, label) => {
  if (!SEMVER.test(value || ''))
    fail(`${label} must be strict bare X.Y.Z SemVer`);
  return value;
};
const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export function readCoordinates(root = '.') {
  const rootPackage = json(`${root}/package.json`),
    frontend = json(`${root}/frontend/package.json`),
    lock = json(`${root}/package-lock.json`);
  const applicationVersion = strictVersion(
    rootPackage.version,
    'root package version'
  );
  for (const [label, value] of [
    ['frontend package version', frontend.version],
    ['package-lock version', lock.version],
    ['package-lock root version', lock.packages?.['']?.version],
    [
      'Chart.yaml appVersion',
      scalar(`${root}/charts/dspace/Chart.yaml`, 'appVersion'),
    ],
  ]) {
    strictVersion(value, label);
    if (value !== applicationVersion)
      fail(`${label} does not equal application version ${applicationVersion}`);
  }
  const chartVersion = strictVersion(
    scalar(`${root}/charts/dspace/Chart.yaml`, 'version'),
    'chart version'
  );
  const documented = readFileSync(`${root}/docs/apps/dspace.version`, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));
  if (
    documented.length !== 1 ||
    strictVersion(documented[0], 'documented chart version') !== chartVersion
  )
    fail('docs/apps/dspace.version does not equal chart version');
  return { applicationVersion, chartVersion };
}

export function validateLocal(options, gitImpl = git) {
  const coordinates = readCoordinates();
  const { sourceSha, sourceBranch, releaseTag, chartTag, imageTag } = options;
  if (!SHA.test(sourceSha || ''))
    fail('source revision must be a 40-character lowercase SHA');
  if (!BRANCHES.has(sourceBranch)) fail('source branch must be main or v3');
  if (releaseTag !== `v${coordinates.applicationVersion}`)
    fail('release tag does not match application version');
  if (gitImpl('rev-parse', `${releaseTag}^{commit}`) !== sourceSha)
    fail('release tag does not peel to approved source revision');
  gitImpl('merge-base', '--is-ancestor', sourceSha, `origin/${sourceBranch}`);
  if (chartTag && chartTag !== `chart-v${coordinates.chartVersion}`)
    fail('chart tag does not match chart version');
  if (chartTag && gitImpl('rev-parse', `${chartTag}^{commit}`) !== sourceSha)
    fail('chart tag does not peel to approved source revision');
  const expectedImageTag = `${sourceBranch}-${sourceSha.slice(0, 7)}`;
  if (
    imageTag !== expectedImageTag ||
    imageTag.endsWith('-latest') ||
    imageTag.startsWith('v')
  )
    fail(`deployment image tag must be ${expectedImageTag}`);
  return { ...coordinates, sourceRevision: sourceSha, sourceBranch, imageTag };
}

export function createManifest(local, image, chart) {
  const manifest = {
    schemaVersion: 1,
    app: 'dspace',
    applicationVersion: local.applicationVersion,
    sourceRevision: local.sourceRevision,
    imageTag: local.imageTag,
    imageDigest: image.indexDigest,
    chartVersion: local.chartVersion,
    chartDigest: chart.digest,
    platformDigests: {
      'linux/amd64': image.platforms.amd64.digest,
      'linux/arm64': image.platforms.arm64.digest,
    },
    semanticImageTag: `v${local.applicationVersion}`,
  };
  validateManifest(manifest);
  return manifest;
}
export function validateManifest(m) {
  if (
    m?.schemaVersion !== 1 ||
    m?.app !== 'dspace' ||
    !SEMVER.test(m.applicationVersion || '') ||
    !SHA.test(m.sourceRevision || '') ||
    !DIGEST.test(m.imageDigest || '') ||
    !SEMVER.test(m.chartVersion || '') ||
    !DIGEST.test(m.chartDigest || '') ||
    m.imageTag !==
      `${m.sourceBranch || m.imageTag.split('-')[0]}-${m.sourceRevision.slice(0, 7)}` ||
    m.semanticImageTag !== `v${m.applicationVersion}` ||
    !DIGEST.test(m.platformDigests?.['linux/amd64'] || '') ||
    !DIGEST.test(m.platformDigests?.['linux/arm64'] || '')
  )
    fail('release manifest is malformed or inconsistent');
  return m;
}
function parse(argv) {
  if (argv.length === 1 && argv[0] === '--verify-local-fixtures')
    return { fixtures: true };
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.slice(2),
      value = argv[i + 1];
    if (!argv[i]?.startsWith('--') || !allowed.has(key) || !value || out[key])
      fail(`Invalid argument: ${argv[i] || '<missing>'}`);
    out[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  if (
    ![
      'local',
      'pre-semantic',
      'final',
      'validate-manifest',
      'chart-pre',
      'chart-post',
    ].includes(out.mode)
  )
    fail(
      'mode must be local, chart-pre, chart-post, pre-semantic, final, or validate-manifest'
    );
  return out;
}
const creds = () => {
  const username = process.env.GHCR_GUARD_USERNAME,
    password = process.env.GHCR_GUARD_PASSWORD; // scan-secrets: ignore (environment credential, never logged)
  if (!username || !password)
    fail('GHCR credentials must be supplied through environment variables');
  return { username, password };
};
export async function main(
  argv = process.argv.slice(2),
  adapters = { inspectImage, inspectArtifact, assertTagAbsent }
) {
  const o = parse(argv);
  if (o.fixtures) {
    const a = 'a'.repeat(40),
      d = 'sha256:' + 'b'.repeat(64);
    const m = createManifest(
      {
        applicationVersion: '1.2.3',
        chartVersion: '4.5.6',
        sourceRevision: a,
        imageTag: 'main-aaaaaaa',
      },
      {
        indexDigest: d,
        platforms: { amd64: { digest: d }, arm64: { digest: d } },
      },
      { digest: d }
    );
    validateManifest(JSON.parse(JSON.stringify(m)));
    console.log('Local release-consistency fixtures passed.');
    return;
  }
  if (o.mode === 'validate-manifest') {
    validateManifest(json(o.manifest));
    console.log('Release manifest is valid.');
    return;
  }
  if (o.mode === 'chart-pre' || o.mode === 'chart-post') {
    const c = readCoordinates();
    if (!SHA.test(o.sourceSha || ''))
      fail('source revision must be a 40-character lowercase SHA');
    if (
      o.chartTag !== `chart-v${c.chartVersion}` ||
      git('rev-parse', `${o.chartTag}^{commit}`) !== o.sourceSha ||
      git('rev-parse', 'HEAD') !== o.sourceSha
    )
      fail('chart tag/source coordinates do not match');
    emit({ ...c, sourceRevision: o.sourceSha });
    if (o.mode === 'chart-pre') return c;
    const auth = creds(),
      artifact = await adapters.inspectArtifact({
        owner: o.owner || 'democratizedspace',
        repo: o.chartRepo || 'charts/dspace',
        tag: c.chartVersion,
        ...auth,
      });
    if (
      artifact.config?.version !== c.chartVersion ||
      String(artifact.config?.appVersion) !== c.applicationVersion ||
      artifact.config?.annotations?.['org.opencontainers.image.revision'] !==
        o.sourceSha ||
      !DIGEST.test(artifact.digest || '')
    )
      fail(
        'published chart coordinates or provenance do not match approved release'
      );
    emit({ ...c, sourceRevision: o.sourceSha, chartDigest: artifact.digest });
    return artifact;
  }
  const local = validateLocal(o);
  if (o.mode === 'local') {
    emit(local);
    return local;
  }
  const auth = creds(),
    common = {
      owner: o.owner || 'democratizedspace',
      username: auth.username,
      password: auth.password, // scan-secrets: ignore (environment credential plumbing)
    };
  const image = await adapters.inspectImage({
    ...common,
    repo: o.imageRepo || 'dspace',
    tag: local.imageTag,
  });
  for (const arch of ['amd64', 'arm64'])
    if (image.platforms[arch].revision !== local.sourceRevision)
      fail(
        `linux/${arch} image revision does not equal approved source revision`
      );
  if (o.mode === 'pre-semantic') {
    const chart = await adapters.inspectArtifact({
      ...common,
      repo: o.chartRepo || 'charts/dspace',
      tag: local.chartVersion,
    });
    if (
      chart.config?.version !== local.chartVersion ||
      String(chart.config?.appVersion) !== local.applicationVersion ||
      chart.config?.annotations?.['org.opencontainers.image.revision'] !==
        local.sourceRevision ||
      !DIGEST.test(chart.digest || '')
    )
      fail(
        'published chart coordinates or provenance do not match approved release'
      );
    await adapters.assertTagAbsent({
      ...common,
      repo: o.imageRepo || 'dspace',
      tag: `v${local.applicationVersion}`,
    });
    emit({
      ...local,
      imageDigest: image.indexDigest,
      chartDigest: chart.digest,
      amd64Digest: image.platforms.amd64.digest,
      arm64Digest: image.platforms.arm64.digest,
    });
    return { local, image, chart };
  }
  const semantic = await adapters.inspectImage({
    ...common,
    repo: o.imageRepo || 'dspace',
    tag: `v${local.applicationVersion}`,
  });
  if (semantic.indexDigest !== image.indexDigest)
    fail('semantic and immutable image index digests differ');
  const chart = await adapters.inspectArtifact({
    ...common,
    repo: o.chartRepo || 'charts/dspace',
    tag: local.chartVersion,
  });
  const c = chart.config;
  if (
    c.version !== local.chartVersion ||
    String(c.appVersion) !== local.applicationVersion ||
    c.annotations?.['org.opencontainers.image.revision'] !==
      local.sourceRevision ||
    !DIGEST.test(chart.digest || '')
  )
    fail(
      'published chart coordinates or provenance do not match approved release'
    );
  const manifest = createManifest(local, image, chart);
  writeFileSync(
    o.manifest || 'dspace-release-manifest.json',
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  emit(manifest);
  return manifest;
}
function emit(values) {
  const flat = {
    application_version: values.applicationVersion,
    chart_version: values.chartVersion,
    chart_tag: values.chartVersion && `chart-v${values.chartVersion}`,
    source_sha: values.sourceRevision,
    source_branch: values.sourceBranch,
    image_tag: values.imageTag,
    image_digest: values.imageDigest,
    chart_digest: values.chartDigest,
    amd64_digest: values.amd64Digest || values.platformDigests?.['linux/amd64'],
    arm64_digest: values.arm64Digest || values.platformDigests?.['linux/arm64'],
  };
  const entries = Object.entries(flat).filter(([, v]) => v);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      entries.map(([k, v]) => `${k}=${v}`).join('\n') + '\n'
    );
  else console.log(JSON.stringify(values, null, 2));
}
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`)
  main().catch((error) => {
    console.error(error?.message || 'release consistency check failed');
    process.exit(1);
  });
