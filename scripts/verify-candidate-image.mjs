import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const repository = 'democratizedspace/dspace';
const image = `ghcr.io/${repository}`;
export const arches = ['amd64', 'arm64'];
const digest = /^sha256:[a-f0-9]{64}$(?![\s\S])/;
const sha = /^[a-f0-9]{40}$(?![\s\S])/;
const version = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$(?![\s\S])/;
const nodeVersion = /^\d+\.\d+\.\d+$(?![\s\S])/;
const number = /^\d{1,20}$(?![\s\S])/;
const schema = 'dspace-candidate-image-verification-v1';
const indexes = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
];
const manifests = [
  'application/vnd.oci.image.manifest.v1+json',
  'application/vnd.docker.distribution.manifest.v2+json',
];
const configs = [
  'application/vnd.oci.image.config.v1+json',
  'application/vnd.docker.container.image.v1+json',
];
const checkNames = [
  'source',
  'registry',
  'native',
  'runtime',
  'buildMetadata',
  'bundle',
  'canvas',
  'http',
  'cleanup',
];
export const receiptName = (arch) => `candidate-image-${arch}.json`;

class VerificationError extends Error {}
const requireEqual = (condition, code) => {
  if (!condition) throw new VerificationError(code);
};
const safeError = (error, fallback) =>
  error instanceof VerificationError ? error.message : fallback;

export function guard(env, { aggregate = false } = {}) {
  const required = {
    GITHUB_ACTIONS: 'true',
    RUNNER_ENVIRONMENT: 'github-hosted',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REPOSITORY: repository,
    GITHUB_REF: 'refs/heads/main',
    GITHUB_ACTOR: 'futuroptimist',
    GITHUB_TRIGGERING_ACTOR: 'futuroptimist',
  };
  for (const [key, value] of Object.entries(required)) {
    requireEqual(env[key] === value, 'DISPATCH_GUARD_FAILED');
  }
  const input = {
    sourceSha: env.DSPACE_SOURCE_SHA,
    indexDigest: env.DSPACE_IMAGE_DIGEST,
    workflowSha: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID,
    runAttempt: env.GITHUB_RUN_ATTEMPT,
  };
  requireEqual(
    sha.test(input.sourceSha) &&
      digest.test(input.indexDigest) &&
      sha.test(input.workflowSha) &&
      number.test(input.runId) &&
      number.test(input.runAttempt),
    'INVALID_INPUT'
  );
  if (!aggregate) {
    requireEqual(arches.includes(env.DSPACE_ARCH), 'INVALID_ARCHITECTURE');
    input.arch = env.DSPACE_ARCH;
  }
  return input;
}

function command(binary, args, timeout = 20_000) {
  return execFileSync(binary, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function reviewedSource(input, run = command) {
  try {
    const git = (...args) => run('git', args);
    requireEqual(
      git('rev-parse', 'HEAD') === input.workflowSha,
      'CHECKOUT_MISMATCH'
    );
    git('merge-base', '--is-ancestor', input.sourceSha, input.workflowSha);
    requireEqual(
      git('rev-parse', `${input.sourceSha}^{commit}`) === input.sourceSha,
      'SOURCE_IS_NOT_EXACT_COMMIT'
    );
    const read = (file) => git('show', `${input.sourceSha}:${file}`);
    const appVersion = JSON.parse(read('package.json')).version;
    const node = read('.nvmrc').trim();
    requireEqual(
      typeof appVersion === 'string' &&
        appVersion.length <= 64 &&
        version.test(appVersion) &&
        nodeVersion.test(node) &&
        JSON.parse(read('frontend/package.json')).version === appVersion,
      'SOURCE_METADATA_MISMATCH'
    );
    const tree = git('rev-parse', `${input.sourceSha}^{tree}`);
    requireEqual(sha.test(tree), 'SOURCE_TREE_INVALID');
    return {
      appVersion,
      node,
      tree,
      runtimeVersion: `v${appVersion}+${input.sourceSha.slice(0, 7)}`,
    };
  } catch (error) {
    throw new VerificationError(
      safeError(error, 'UNREVIEWED_OR_UNREADABLE_SOURCE')
    );
  }
}

async function readBytes(response, limit = 1024 * 1024) {
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, total);
      total += value.length;
      requireEqual(total <= limit, 'REGISTRY_RESPONSE_TOO_LARGE');
      chunks.push(value);
    }
  } finally {
    // Cancel asynchronously without extending the request's deadline.
    reader.cancel().catch(() => {});
  }
}

export function selectPlatforms(index) {
  requireEqual(
    index?.schemaVersion === 2 &&
      indexes.includes(index.mediaType) &&
      Array.isArray(index.manifests) &&
      index.manifests.length <= 20,
    'INVALID_INDEX'
  );
  const selected = {};
  const attestations = [];
  for (const entry of index.manifests) {
    requireEqual(
      digest.test(entry?.digest) && manifests.includes(entry.mediaType),
      'INVALID_DESCRIPTOR'
    );
    const { os, architecture, variant } = entry.platform ?? {};
    if (
      os === 'unknown' &&
      architecture === 'unknown' &&
      variant === undefined &&
      entry.annotations?.['vnd.docker.reference.type'] ===
        'attestation-manifest'
    ) {
      attestations.push(entry);
      continue;
    }
    requireEqual(
      os === 'linux' &&
        arches.includes(architecture) &&
        (variant === undefined ||
          (architecture === 'arm64' && variant === 'v8')) &&
        !Object.hasOwn(selected, architecture),
      'UNEXPECTED_OR_DUPLICATE_PLATFORM'
    );
    selected[architecture] = entry.digest;
  }
  requireEqual(
    arches.every((arch) => selected[arch]),
    'MISSING_PLATFORM'
  );
  requireEqual(selected.amd64 !== selected.arm64, 'DUPLICATE_PLATFORM_DIGEST');
  const seen = new Set(Object.values(selected));
  for (const entry of attestations) {
    requireEqual(
      !seen.has(entry.digest) &&
        Object.values(selected).includes(
          entry.annotations['vnd.docker.reference.digest']
        ),
      'INVALID_ATTESTATION_DESCRIPTOR'
    );
    seen.add(entry.digest);
  }
  return selected;
}

function labelsMatch(labels, sourceSha) {
  requireEqual(
    labels?.['org.opencontainers.image.source'] ===
      `https://github.com/${repository}` &&
      labels?.['org.opencontainers.image.revision'] === sourceSha,
    'IMAGE_SOURCE_MISMATCH'
  );
}

export async function verifyRegistry(input, meta, request = fetch) {
  try {
    const get = async (url, headers = {}, redirect = 'error') => {
      const response = await request(url, {
        method: 'GET',
        headers,
        redirect,
        signal: AbortSignal.timeout(30_000),
      });
      requireEqual(response.status === 200, 'REGISTRY_HTTP_FAILURE');
      return response;
    };
    const tokenURL = `https://ghcr.io/token?service=ghcr.io&scope=repository:${repository}:pull`;
    const { token } = JSON.parse(await readBytes(await get(tokenURL)));
    requireEqual(
      typeof token === 'string' &&
        /^[A-Za-z0-9._~+\/=-]{1,8192}$(?![\s\S])/.test(token),
      'REGISTRY_TOKEN_INVALID'
    );
    const read = async (kind, ref) => {
      requireEqual(digest.test(ref), 'INVALID_REGISTRY_DIGEST');
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: [...indexes, ...manifests].join(', '),
      };
      const response = await get(
        `https://ghcr.io/v2/${repository}/${kind}/${ref}`,
        headers,
        // GHCR MAY redirect blob downloads; Fetch strips Authorization cross-origin.
        kind === 'blobs' ? 'follow' : 'error'
      );
      const raw = await readBytes(response);
      requireEqual(
        `sha256:${createHash('sha256').update(raw).digest('hex')}` === ref,
        'REGISTRY_BODY_DIGEST_MISMATCH'
      );
      requireEqual(
        kind !== 'manifests' ||
          response.headers.get('docker-content-digest') === ref,
        'REGISTRY_HEADER_DIGEST_MISMATCH'
      );
      return JSON.parse(raw);
    };
    const platformDigests = selectPlatforms(
      await read('manifests', input.indexDigest)
    );
    const platformDigest = platformDigests[input.arch];
    const manifest = await read('manifests', platformDigest);
    requireEqual(
      manifest?.schemaVersion === 2 &&
        manifests.includes(manifest.mediaType) &&
        configs.includes(manifest.config?.mediaType) &&
        digest.test(manifest.config.digest) &&
        Array.isArray(manifest.layers) &&
        manifest.layers.length > 0 &&
        manifest.layers.every((layer) => digest.test(layer?.digest)),
      'INVALID_CHILD_MANIFEST'
    );
    const configDigest = manifest.config.digest;
    const config = await read('blobs', configDigest);
    requireEqual(
      config.os === 'linux' && config.architecture === input.arch,
      'REGISTRY_PLATFORM_MISMATCH'
    );
    labelsMatch(config.config?.Labels, input.sourceSha);
    const vars = config.config?.Env;
    requireEqual(
      Array.isArray(vars) &&
        vars
          .filter((v) => typeof v === 'string' && v.startsWith('NODE_VERSION='))
          .join() === `NODE_VERSION=${meta.node}` &&
        vars
          .filter(
            (v) => typeof v === 'string' && v.startsWith('DSPACE_VERSION=')
          )
          .join() === `DSPACE_VERSION=${meta.runtimeVersion}` &&
        (!config.config.Volumes ||
          Object.keys(config.config.Volumes).length === 0),
      'REGISTRY_RUNTIME_CONFIG_MISMATCH'
    );
    return { platformDigests, platformDigest, configDigest };
  } catch (error) {
    throw new VerificationError(
      safeError(error, 'REGISTRY_TRANSPORT_OR_PARSE_FAILURE')
    );
  }
}

export function verifyNativeImage(
  input,
  meta,
  proof,
  checks,
  {
    run = command,
    hostArch = process.arch,
    hostOS = process.platform,
    runnerArch = process.env.RUNNER_ARCH,
    name = `dspace-candidate-${randomUUID()}`,
  } = {}
) {
  const docker = (args, timeout) =>
    run('docker', ['--host=unix:///var/run/docker.sock', ...args], timeout);
  let cleanupRequired = false;
  let failure;
  let stage = 'NATIVE_ARCHITECTURE_MISMATCH';
  try {
    const nodeArch = { amd64: 'x64', arm64: 'arm64' }[input.arch];
    const actionArch = { amd64: 'X64', arm64: 'ARM64' }[input.arch];
    const daemon = JSON.parse(docker(['info', '--format', '{{json .}}']));
    requireEqual(
      hostOS === 'linux' &&
        hostArch === nodeArch &&
        runnerArch === actionArch &&
        daemon.OSType === 'linux' &&
        (input.arch === 'amd64'
          ? ['amd64', 'x86_64']
          : ['arm64', 'aarch64']
        ).includes(daemon.Architecture),
      stage
    );
    checks.native = true;
    stage = 'IMMUTABLE_PULL_FAILED';
    const immutable = `${image}@${proof.platformDigest}`;
    docker(['pull', '--platform', `linux/${input.arch}`, immutable], 240_000);
    stage = 'PULLED_IMAGE_MISMATCH';
    const [inspection] = JSON.parse(docker(['image', 'inspect', immutable]));
    requireEqual(
      inspection?.Id === proof.configDigest &&
        inspection.Os === 'linux' &&
        inspection.Architecture === input.arch &&
        inspection.RepoDigests?.includes(immutable),
      stage
    );
    labelsMatch(inspection.Config?.Labels, input.sourceSha);
    requireEqual(
      !inspection.Config?.Volumes ||
        Object.keys(inspection.Config.Volumes).length === 0,
      stage
    );

    const node = '/usr/local/bin/node';
    const probe = (code, timeout = 20_000, expected = 'ok') => {
      const actual = docker(['exec', name, node, '-e', code], timeout);
      requireEqual(actual === expected, stage);
    };
    const expected = JSON.stringify({
      ...meta,
      sourceSha: input.sourceSha,
      nodeArch,
    });
    const prefix = `const a=require('node:assert/strict');const e=${expected};`;
    stage = 'CONTAINER_START_FAILED';
    cleanupRequired = true;
    docker([
      'run',
      '--detach',
      '--pull=never',
      '--name',
      name,
      '--platform',
      `linux/${input.arch}`,
      '--network=none',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      '--user=1000:1000',
      '--read-only',
      '--tmpfs=/tmp:rw,noexec,nosuid,nodev,size=64m',
      '--memory=1g',
      '--memory-swap=1g',
      '--cpus=2',
      '--pids-limit=128',
      '--log-driver=none',
      '--no-healthcheck',
      '--workdir=/app',
      '--env=PORT=8080',
      '--env=HOST=127.0.0.1',
      '--env=NODE_OPTIONS=',
      '--env=LD_PRELOAD=',
      '--env=LD_LIBRARY_PATH=',
      '--entrypoint=/usr/bin/dumb-init',
      proof.configDigest,
      '--',
      node,
      '/app/entrypoint.mjs',
    ]);

    stage = 'RUNTIME_PROBE_FAILED';
    probe(
      prefix +
        `a.equal(process.versions.node,e.node);a.equal(process.platform,'linux');a.equal(process.arch,e.nodeArch);a.equal(process.getuid(),1000);a.equal(process.env.DSPACE_VERSION,e.runtimeVersion);a.equal(require('/app/package.json').version,e.appVersion);console.log('ok');`
    );
    checks.runtime = true;
    stage = 'BUILD_METADATA_PROBE_FAILED';
    probe(
      prefix +
        `const m=require('/app/build_meta.json');a.equal(m.gitSha,e.sourceSha);a.equal(m.revision,e.sourceSha);a.equal(m.shortRevision,e.sourceSha.slice(0,7));a.equal(m.version,e.appVersion);console.log('ok');`
    );
    checks.buildMetadata = true;
    stage = 'BUNDLE_PROBE_FAILED';
    // Reuse the current trusted verifier, not code checked out from the target source.
    const scanner = readFileSync(
      new URL('./verify-build-sha.mjs', import.meta.url),
      'utf8'
    ).replace(/^#![^\n]*\n/, '');
    const bundleProbe = `process.env.EXPECTED_SHA=${JSON.stringify(input.sourceSha)};process.env.VERIFY_BUILD_META_PATH='/app/build_meta.json';process.argv=['node','verify-build-sha.mjs','/app/dist'];\n${scanner}`;
    requireEqual(
      docker(
        ['exec', name, node, '--input-type=module', '-e', bundleProbe],
        60_000
      ) ===
        `Verified full build SHA ${input.sourceSha} in canonical metadata, server, and client output.`,
      stage
    );
    checks.bundle = true;
    stage = 'CANVAS_PROBE_FAILED';
    probe(
      `const a=require('node:assert/strict');const c=require('/app/node_modules/canvas').createCanvas(2,2);c.getContext('2d').fillRect(0,0,2,2);const b=c.toBuffer('image/png');a.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');console.log('ok');`
    );
    checks.canvas = true;
    stage = 'HTTP_PROBE_FAILED';
    probe(
      prefix +
        `
const boundedBody=async(r,limit)=>{
 const reader=r.body.getReader(); let size=0; const chunks=[];
 try {
  for(;;){const {done,value}=await reader.read();if(done)break;
    size+=value.length;a.ok(size<=limit);chunks.push(value);}
  return Buffer.concat(chunks,size).toString('utf8');
 } finally {reader.cancel().catch(()=>{});}
};
const get=(path)=>fetch('http://127.0.0.1:8080'+path,{redirect:'error',signal:AbortSignal.timeout(2_500)});
(async()=>{
  const deadline=Date.now()+60_000;
  for(;;){
    try {
      const r=await get('/healthz');
      a.equal(r.status,200);
      const m=JSON.parse(await boundedBody(r,65_536));
      a.equal(m.status,'ready');
      a.equal(m.version,e.runtimeVersion);
      a.equal(m.buildIdentity?.revision,e.sourceSha);
      break;
    } catch {
      if(Date.now()>=deadline)throw new Error('not healthy');
      await new Promise(r=>setTimeout(r,750));
    }
  }
  for(const path of ['/config.json','/']){
    const r=await get(path);a.equal(r.status,200);await boundedBody(r,2_097_152);
  }
  console.log('ok');
})().catch(()=>{process.exitCode=1;});`,
      75_000
    );
    checks.http = true;
  } catch (error) {
    failure = new VerificationError(safeError(error, stage));
  } finally {
    if (cleanupRequired) {
      try {
        docker(['rm', '--force', name]);
        checks.cleanup = true;
      } catch {
        checks.cleanup = false;
        failure ??= new VerificationError('CONTAINER_CLEANUP_FAILED');
      }
    }
  }
  if (failure) throw failure;
}

export async function verifyCandidate(
  input,
  {
    source = reviewedSource,
    registry = verifyRegistry,
    native = verifyNativeImage,
    save = (record) =>
      writeFileSync(
        receiptName(input.arch),
        JSON.stringify(record, null, 2) + '\n'
      ),
  } = {}
) {
  const receipt = {
    schema,
    ...input,
    image,
    publishedByThisRun: false,
    verified: false,
    checks: Object.fromEntries(checkNames.map((key) => [key, false])),
  };
  let failure;
  try {
    const meta = source(input);
    Object.assign(receipt, meta);
    receipt.checks.source = true;
    const proof = await registry(input, meta);
    Object.assign(receipt, proof);
    receipt.checks.registry = true;
    native(input, meta, proof, receipt.checks);
    requireEqual(
      checkNames.every((key) => receipt.checks[key] === true),
      'INCOMPLETE_VERIFICATION'
    );
    receipt.verified = true;
  } catch (error) {
    receipt.errorCode = safeError(error, 'VERIFICATION_FAILED');
    failure = new VerificationError(receipt.errorCode);
  } finally {
    receipt.completedAt = new Date().toISOString();
    save(receipt);
  }
  if (failure) throw failure;
  return receipt;
}

export function aggregateReceipts(input, records, expectedSource) {
  requireEqual(records.length === 2, 'INCORRECT_RECEIPT_COUNT');
  const platforms = {};
  let common;
  for (const record of records) {
    requireEqual(
      record?.schema === schema &&
        record.image === image &&
        record.publishedByThisRun === false &&
        record.verified === true &&
        record.errorCode === undefined &&
        arches.includes(record.arch) &&
        !Object.hasOwn(platforms, record.arch) &&
        Object.keys(input).every((key) => record[key] === input[key]) &&
        Object.keys(expectedSource).every(
          (key) => record[key] === expectedSource[key]
        ) &&
        sha.test(record.tree) &&
        typeof record.appVersion === 'string' &&
        record.appVersion.length <= 64 &&
        version.test(record.appVersion) &&
        nodeVersion.test(record.node) &&
        record.runtimeVersion ===
          `v${record.appVersion}+${input.sourceSha.slice(0, 7)}` &&
        typeof record.completedAt === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
          record.completedAt
        ) &&
        Object.keys(record.checks ?? {}).length === checkNames.length &&
        checkNames.every((key) => record.checks[key] === true) &&
        digest.test(record.configDigest) &&
        Object.keys(record.platformDigests ?? {}).length === arches.length &&
        arches.every((arch) => digest.test(record.platformDigests[arch])) &&
        record.platformDigests.amd64 !== record.platformDigests.arm64 &&
        record.platformDigest === record.platformDigests[record.arch],
      'INVALID_OR_MISMATCHED_RECEIPT'
    );
    const coordinates = {
      tree: record.tree,
      appVersion: record.appVersion,
      node: record.node,
      runtimeVersion: record.runtimeVersion,
      amd64: record.platformDigests.amd64,
      arm64: record.platformDigests.arm64,
    };
    requireEqual(
      !common ||
        Object.keys(common).every((key) => common[key] === coordinates[key]),
      'PLATFORM_RECEIPTS_DISAGREE'
    );
    common = coordinates;
    platforms[record.arch] = {
      digest: record.platformDigest,
      configDigest: record.configDigest,
    };
  }
  return {
    ...input,
    image,
    tree: common.tree,
    appVersion: common.appVersion,
    node: common.node,
    runtimeVersion: common.runtimeVersion,
    platforms,
    schema: 'dspace-candidate-image-summary-v1',
    publishedByThisRun: false,
    verified: true,
    completedAt: new Date().toISOString(),
  };
}

function readReceipts(dir, depth = 0) {
  requireEqual(depth <= 2, 'INVALID_RECEIPT_DIRECTORY');
  const entries = readdirSync(dir, { withFileTypes: true });
  requireEqual(entries.length <= 4, 'UNEXPECTED_RECEIPT_FILES');
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return readReceipts(path, depth + 1);
    requireEqual(
      entry.isFile() && arches.some((arch) => entry.name === receiptName(arch)),
      'UNEXPECTED_RECEIPT_FILES'
    );
    requireEqual(statSync(path).size <= 16_384, 'RECEIPT_TOO_LARGE');
    const record = JSON.parse(readFileSync(path, 'utf8'));
    requireEqual(
      entry.name === receiptName(record.arch),
      'RECEIPT_FILENAME_MISMATCH'
    );
    return record;
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [mode, dir, ...rest] = process.argv.slice(2);
    requireEqual(
      !mode ||
        (mode === '--guard-only' && !dir) ||
        (mode === '--aggregate' && dir && !rest.length),
      'INVALID_ARGUMENTS'
    );
    const input = guard(process.env, { aggregate: mode === '--aggregate' });
    if (mode === '--aggregate') {
      let summary;
      try {
        requireEqual(
          process.env.DSPACE_NATIVE_JOB_RESULT === 'success',
          'NATIVE_JOBS_FAILED'
        );
        const expectedSource = reviewedSource(input);
        summary = aggregateReceipts(input, readReceipts(dir), expectedSource);
      } catch (error) {
        summary = {
          ...input,
          image,
          schema: 'dspace-candidate-image-summary-v1',
          publishedByThisRun: false,
          verified: false,
          errorCode: safeError(error, 'RECEIPT_AGGREGATION_FAILED'),
          completedAt: new Date().toISOString(),
        };
      }
      writeFileSync(
        'candidate-image-summary.json',
        JSON.stringify(summary, null, 2) + '\n'
      );
      requireEqual(summary.verified, summary.errorCode);
    } else if (mode === '--guard-only') {
      reviewedSource(input);
    } else {
      await verifyCandidate(input);
    }
  } catch (error) {
    console.error(
      `Candidate verification failed: ${safeError(error, 'VERIFIER_EXECUTION_FAILED')}`
    );
    process.exitCode = 1;
  }
}
