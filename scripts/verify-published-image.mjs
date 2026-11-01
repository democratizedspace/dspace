import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { policy, validatePublishedIndex } from './maintenance-image.mjs';

export const fixed = Object.freeze({
  ...policy,
  owner: 'futuroptimist',
  version: 'v3.0.2+4790074',
  index:
    'sha256:5d16cde03df4cfe9a52341c26bb6167234d315f896d422af38383b760bebcfe0',
  platforms: Object.freeze({
    amd64:
      'sha256:8f4e093b5942a345a82936117c4088885e893290a6554e07751ec2040ad1a2c1',
    arm64:
      'sha256:c642d41faf84740177b1eca26654e7290ecfd46107cabeef8e5f3f5a67e7fd73',
  }),
});

export function guard(env, event, now = new Date()) {
  assert.equal(env.GITHUB_ACTIONS, 'true', 'GitHub runner only');
  assert.equal(env.RUNNER_ENVIRONMENT, 'github-hosted');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert.equal(env.GITHUB_REPOSITORY, fixed.repository);
  assert.equal(env.GITHUB_REF, `refs/heads/${fixed.branch}`);
  assert.equal(env.GITHUB_ACTOR, fixed.owner, 'Owner dispatch required');
  assert.equal(
    env.GITHUB_TRIGGERING_ACTOR,
    fixed.owner,
    'Owner rerun required'
  );
  assert.deepEqual(event.inputs || {}, {}, 'No image or other inputs allowed');
  const local = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (name) => local.find((p) => p.type === name).value;
  assert.ok(
    !['Sat', 'Sun'].includes(part('weekday')) && Number(part('hour')) >= 7,
    'Owner dispatch must wait until a weekday at or after 07:00 America/Los_Angeles'
  );
}

const command = (binary, args, cwd) =>
  execFileSync(binary, args, {
    cwd,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export function checkSource(run = command) {
  const git = (...args) => run('git', args, 'source');
  assert.equal(git('rev-parse', 'HEAD'), fixed.source);
  assert.equal(git('rev-parse', 'HEAD^{tree}'), fixed.tree);
  assert.equal(git('status', '--porcelain'), '');
  for (const path of ['package.json', 'frontend/package.json'])
    assert.equal(JSON.parse(git('show', `HEAD:${path}`)).version, '3.0.2');
  assert.equal(git('show', 'HEAD:.nvmrc').trim(), '24.22.1');
}

export async function registry(request = fetch) {
  const get = async (url, headers = {}, redirect = 'error') => {
    const response = await request(url, {
      headers,
      redirect,
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(
      response.status,
      200,
      'Registry read failed; no credential escalation'
    );
    return response;
  };
  const tokenResponse = await get(
    'https://ghcr.io/token?service=ghcr.io&scope=repository:democratizedspace/dspace:pull'
  );
  const { token } = await tokenResponse.json();
  assert.ok(typeof token === 'string' && token.length > 0);
  const read = async (kind, ref, expected) => {
    const response = await get(
      `https://ghcr.io/v2/${fixed.repository}/${kind}/${ref}`,
      {
        Authorization: `Bearer ${token}`,
        Accept:
          'application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json',
      },
      kind === 'blobs' ? 'follow' : 'error'
    );
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(
      `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      expected,
      'Registry content digest mismatch'
    );
    if (kind === 'manifests')
      assert.equal(response.headers.get('docker-content-digest'), expected);
    return JSON.parse(bytes);
  };
  const index = await read('manifests', `hotfix-${fixed.source}`, fixed.index);
  await read('manifests', fixed.index, fixed.index);
  assert.deepEqual(
    validatePublishedIndex(200, fixed.index, fixed.index, index),
    fixed.platforms
  );
  for (const [arch, digest] of Object.entries(fixed.platforms)) {
    const manifest = await read('manifests', digest, digest);
    assert.match(manifest.config.digest, /^sha256:[a-f0-9]{64}$/);
    const config = await read(
      'blobs',
      manifest.config.digest,
      manifest.config.digest
    );
    assert.equal(config.os, 'linux');
    assert.equal(config.architecture, arch);
    checkLabels(config.config.Labels);
    assert.ok(config.config.Env.includes('NODE_VERSION=24.22.1'));
  }
  return fixed.platforms;
}

export function checkLabels(labels) {
  assert.equal(labels['org.opencontainers.image.revision'], fixed.source);
  assert.equal(labels['org.opencontainers.image.version'], fixed.version);
  assert.equal(
    labels['org.opencontainers.image.source'],
    `https://github.com/${fixed.repository}`
  );
}

export const runtimeProbe = `const assert=require('node:assert/strict');
assert.equal(process.versions.node,'24.22.1');
assert.equal(JSON.parse(require('node:fs').readFileSync('/app/build_meta.json','utf8')).gitSha,'${fixed.source}');
require('canvas');`;

export const httpProbe = `const assert=require('node:assert/strict');
(async()=>{const deadline=Date.now()+90000;for(;;){try{
const health=await fetch('http://127.0.0.1:8080/healthz',{redirect:'error',signal:AbortSignal.timeout(2000)});
assert.equal(health.status,200);assert.equal((await health.json()).version,'${fixed.version}');
for(const path of ['/config.json','/','/docs/dCarbon']){
const r=await fetch('http://127.0.0.1:8080'+path,{redirect:'error',signal:AbortSignal.timeout(5000)});
assert.equal(r.status,200);await r.arrayBuffer();}return;
}catch(error){if(Date.now()>=deadline)throw error;await new Promise(r=>setTimeout(r,1000));}}})()
.catch(e=>{console.error(e.message);process.exitCode=1});`;

export function smoke(arch, run = command) {
  assert.ok(
    Object.hasOwn(fixed.platforms, arch),
    'Architecture not allowlisted'
  );
  const image = `${fixed.image}@${fixed.platforms[arch]}`;
  const docker = (...args) => run('docker', args);
  const platform = ['--platform', `linux/${arch}`];
  docker('pull', ...platform, image);
  const [inspection] = JSON.parse(docker('image', 'inspect', image));
  assert.equal(inspection.Os, 'linux');
  assert.equal(inspection.Architecture, arch);
  checkLabels(inspection.Config.Labels);
  const options = [
    '--rm',
    ...platform,
    '--network',
    'none',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--entrypoint',
    'node',
  ];
  docker('run', ...options, image, '-e', runtimeProbe);
  docker(
    'run',
    ...options,
    '-e',
    `EXPECTED_SHA=${fixed.source}`,
    '-v',
    `${resolve('source/scripts')}:/scripts:ro`,
    image,
    '/scripts/verify-build-sha.mjs',
    '/app/dist'
  );
  const name = `dspace-published-verification-${arch}`;
  try {
    docker(
      'run',
      '-d',
      ...platform,
      '--network',
      'none',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '--name',
      name,
      image
    );
    docker('exec', name, 'node', '-e', httpProbe);
  } finally {
    docker('rm', '-f', name);
  }
}

export async function verify({
  registryCheck = registry,
  sourceCheck = checkSource,
  smokeCheck = smoke,
  save = (receipt) =>
    writeFileSync(
      'published-image-verification-receipt.json',
      JSON.stringify(receipt, null, 2)
    ),
} = {}) {
  const receipt = {
    kind: 'existing-image-verification',
    source: fixed.source,
    tree: fixed.tree,
    index: fixed.index,
    workflowSha: process.env.GITHUB_SHA,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
    publishedByThisRun: false,
    verified: false,
    platforms: {},
  };
  try {
    sourceCheck();
    await registryCheck();
    receipt.registryVerified = true;
    for (const arch of Object.keys(fixed.platforms)) {
      smokeCheck(arch);
      receipt.platforms[arch] = {
        digest: fixed.platforms[arch],
        verified: true,
      };
    }
    receipt.verified = true;
  } catch (error) {
    receipt.error = error.message;
    throw error;
  } finally {
    receipt.completedAt = new Date().toISOString();
    save(receipt);
  }
  return receipt;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    assert.ok(
      process.argv.length === 2 ||
        (process.argv.length === 3 && process.argv[2] === '--guard-only')
    );
    guard(
      process.env,
      JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
    );
    if (process.argv[2] !== '--guard-only') await verify();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
