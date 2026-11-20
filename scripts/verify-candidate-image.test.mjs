import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  aggregateReceipts,
  guard,
  reviewedSource,
  selectPlatforms,
  verifyCandidate,
  verifyNativeImage,
  verifyRegistry,
} from './verify-candidate-image.mjs';

const hex = (c) => c.repeat(40);
const digest = (c) => `sha256:${c.repeat(64)}`;
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
const env = {
  GITHUB_ACTIONS: 'true',
  RUNNER_ENVIRONMENT: 'github-hosted',
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REPOSITORY: 'democratizedspace/dspace',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_ACTOR: 'futuroptimist',
  GITHUB_TRIGGERING_ACTOR: 'futuroptimist',
  GITHUB_SHA: hex('a'),
  GITHUB_RUN_ID: '123456',
  GITHUB_RUN_ATTEMPT: '1',
  DSPACE_SOURCE_SHA: hex('b'),
  DSPACE_IMAGE_DIGEST: digest('c'),
  DSPACE_ARCH: 'amd64',
};
const meta = {
  appVersion: '3.1.0',
  node: '24.22.3',
  tree: hex('d'),
  runtimeVersion: 'v3.1.0+bbbbbbb',
};
const source = guard(env);
const indexType = 'application/vnd.oci.image.index.v1+json';
const manifestType = 'application/vnd.oci.image.manifest.v1+json';
const configType = 'application/vnd.oci.image.config.v1+json';
const descriptor = (arch, value = digest(arch === 'amd64' ? '1' : '2')) => ({
  digest: value,
  mediaType: manifestType,
  platform: { os: 'linux', architecture: arch },
});
const labels = {
  'org.opencontainers.image.source':
    'https://github.com/democratizedspace/dspace',
  'org.opencontainers.image.revision': source.sourceSha,
};
const proof = {
  platformDigests: { amd64: digest('1'), arm64: digest('2') },
  platformDigest: digest('1'),
  configDigest: digest('3'),
};

test('dispatch guard rejects every changed trust rule and unsafe or noncanonical input', () => {
  for (const key of [
    'GITHUB_ACTIONS',
    'RUNNER_ENVIRONMENT',
    'GITHUB_EVENT_NAME',
    'GITHUB_REPOSITORY',
    'GITHUB_REF',
    'GITHUB_ACTOR',
    'GITHUB_TRIGGERING_ACTOR',
  ])
    assert.throws(
      () => guard({ ...env, [key]: 'unexpected' }),
      /DISPATCH_GUARD_FAILED/
    );
  for (const [key, value] of [
    ['DSPACE_SOURCE_SHA', 'HEAD~1'],
    ['DSPACE_SOURCE_SHA', source.sourceSha + '\n'],
    ['DSPACE_IMAGE_DIGEST', 'latest'],
    ['DSPACE_IMAGE_DIGEST', source.indexDigest + '\n'],
    ['DSPACE_IMAGE_DIGEST', 'ghcr.io/example/bad@' + source.indexDigest],
    ['DSPACE_IMAGE_DIGEST', '$(whoami)'],
    ['GITHUB_SHA', 'HEAD'],
    ['GITHUB_RUN_ID', 'bad'],
    ['GITHUB_RUN_ATTEMPT', '1\n'],
  ])
    assert.throws(() => guard({ ...env, [key]: value }), /INVALID_INPUT/);
  assert.throws(
    () => guard({ ...env, DSPACE_ARCH: 'arm' }),
    /INVALID_ARCHITECTURE/
  );
});

test('reviewed-source metadata is read only from exact trusted history', () => {
  const calls = [];
  const run = (cmd, args) => {
    assert.equal(cmd, 'git');
    calls.push(args);
    if (args[0] === 'merge-base') return '';
    if (args[1] === 'HEAD') return env.GITHUB_SHA;
    if (args[1] === `${source.sourceSha}^{commit}`) return source.sourceSha;
    if (args[0] === 'rev-parse') return meta.tree;
    return args[1].endsWith('.nvmrc')
      ? meta.node
      : JSON.stringify({ version: meta.appVersion });
  };
  assert.deepEqual(reviewedSource(source, run), meta);
  assert.throws(
    () =>
      reviewedSource(source, (cmd, args) =>
        args[1]?.endsWith('^{commit}') ? hex('f') : run(cmd, args)
      ),
    /SOURCE_IS_NOT_EXACT_COMMIT/
  );
  assert.deepEqual(calls[1], [
    'merge-base',
    '--is-ancestor',
    source.sourceSha,
    source.workflowSha,
  ]);
  assert.ok(
    calls
      .filter(([cmd]) => cmd === 'show')
      .every((args) => args[1].startsWith(source.sourceSha + ':'))
  );
  assert.throws(
    () => reviewedSource(source, () => hex('f')),
    /CHECKOUT_MISMATCH/
  );
  assert.throws(
    () =>
      reviewedSource(source, (cmd, args) => {
        if (args[0] === 'merge-base') throw Error('private detail');
        return run(cmd, args);
      }),
    /^Error: UNREVIEWED_OR_UNREADABLE_SOURCE$/
  );
});

test('index admits exactly two Linux architectures plus recognized attestations', () => {
  const index = { mediaType: indexType, schemaVersion: 2 };
  const amd = descriptor('amd64');
  const arm = descriptor('arm64');
  const att = {
    mediaType: manifestType,
    digest: digest('e'),
    platform: { os: 'unknown', architecture: 'unknown' },
    annotations: {
      'vnd.docker.reference.type': 'attestation-manifest',
      'vnd.docker.reference.digest': amd.digest,
    },
  };
  assert.deepEqual(
    selectPlatforms({ ...index, manifests: [amd, arm, att] }),
    proof.platformDigests
  );
  for (const manifestList of [
    [amd],
    [amd, arm, arm],
    [amd, arm, { ...att, annotations: {} }],
    [
      amd,
      arm,
      {
        ...att,
        annotations: {
          ...att.annotations,
          'vnd.docker.reference.digest': digest('f'),
        },
      },
    ],
    [amd, descriptor('arm64', amd.digest)],
    [amd, arm, descriptor('386')],
    [amd, { ...arm, digest: 'latest' }],
  ])
    assert.throws(() => selectPlatforms({ ...index, manifests: manifestList }));
});

function registryFixture({ configPatch, childPatch } = {}) {
  const documents = new Map();
  const put = (object) => {
    const body = JSON.stringify(object);
    const key = 'sha256:' + createHash('sha256').update(body).digest('hex');
    documents.set(key, body);
    return key;
  };
  const configDigest = put({
    os: 'linux',
    architecture: 'amd64',
    config: {
      Labels: labels,
      Env: [
        `NODE_VERSION=${meta.node}`,
        `DSPACE_VERSION=${meta.runtimeVersion}`,
      ],
    },
    ...configPatch,
  });
  const platformDigest = put({
    schemaVersion: 2,
    mediaType: manifestType,
    config: { digest: configDigest, mediaType: configType },
    layers: [{ digest: digest('f') }],
    ...childPatch,
  });
  const indexDigest = put({
    schemaVersion: 2,
    mediaType: indexType,
    manifests: [descriptor('amd64', platformDigest), descriptor('arm64')],
  });
  const urls = [];
  const request = async (url, options) => {
    urls.push(url);
    assert.equal(new URL(url).origin, 'https://ghcr.io');
    assert.equal(options.method, 'GET');
    if (url.includes('/token?')) {
      assert.equal(
        new URL(url).searchParams.get('scope'),
        'repository:democratizedspace/dspace:pull'
      );
      assert.equal(options.headers.Authorization, undefined);
      return new Response(JSON.stringify({ token: 'only-fixture-token' }));
    }
    assert.equal(options.headers.Authorization, 'Bearer only-fixture-token');
    const key = url.split('/').at(-1);
    assert.ok(documents.has(key));
    return new Response(documents.get(key), {
      headers: { 'docker-content-digest': key },
    });
  };
  return {
    request,
    urls,
    configDigest,
    platformDigest,
    indexDigest,
    input: { ...source, indexDigest },
  };
}

test('registry hashes immutable index, independent child, and config bytes with anonymous pull scope', async () => {
  const f = registryFixture();
  assert.deepEqual(await verifyRegistry(f.input, meta, f.request), {
    platformDigests: { amd64: f.platformDigest, arm64: digest('2') },
    platformDigest: f.platformDigest,
    configDigest: f.configDigest,
  });
  assert.deepEqual(
    f.urls.slice(1).map((url) => url.split('/').at(-1)),
    [f.indexDigest, f.platformDigest, f.configDigest]
  );
});

test('registry denies body/header tampering, malformed/foreign metadata, and transport leaks', async () => {
  const f = registryFixture();
  for (const [replace, error] of [
    [() => new Response('{}'), 'REGISTRY_BODY_DIGEST_MISMATCH'],
    [
      async (response) => new Response(await response.text()),
      'REGISTRY_HEADER_DIGEST_MISMATCH',
    ],
    [
      () => new Response('token which must never leak', { status: 403 }),
      'REGISTRY_HTTP_FAILURE',
    ],
    [
      () => {
        throw Error('PRIVATE SIGNED URL');
      },
      'REGISTRY_TRANSPORT_OR_PARSE_FAILURE',
    ],
  ]) {
    await assert.rejects(
      verifyRegistry(f.input, meta, async (url, options) => {
        const response = await f.request(url, options);
        return url.endsWith(f.indexDigest) ? replace(response) : response;
      }),
      new RegExp(`^Error: ${error}$`)
    );
  }
  for (const [options, error] of [
    [{ configPatch: { architecture: 'arm64' } }, 'REGISTRY_PLATFORM_MISMATCH'],
    [{ configPatch: { config: { Labels: {} } } }, 'IMAGE_SOURCE_MISMATCH'],
    [
      { configPatch: { config: { Labels: labels, Env: [] } } },
      'REGISTRY_RUNTIME_CONFIG_MISMATCH',
    ],
    [{ childPatch: { layers: [] } }, 'INVALID_CHILD_MANIFEST'],
  ]) {
    const bad = registryFixture(options);
    await assert.rejects(
      verifyRegistry(bad.input, meta, bad.request),
      new RegExp(error)
    );
  }
});

function mockDocker({
  fail,
  arch = 'amd64',
  architecture = arch === 'arm64' ? 'aarch64' : 'x86_64',
  hostArch = arch === 'arm64' ? 'arm64' : 'x64',
  runnerArch = arch === 'arm64' ? 'ARM64' : 'X64',
  platformProof = proof,
  configId = platformProof.configDigest,
} = {}) {
  const steps = [];
  const run = (name, [host, cmd, ...args], timeout) => {
    assert.equal(name, 'docker');
    assert.equal(host, '--host=unix:///var/run/docker.sock');
    steps.push({ cmd, args, timeout });
    if (fail?.(cmd, args))
      throw Error('untrusted stdout stderr token or signed URL');
    if (cmd === 'info')
      return JSON.stringify({ OSType: 'linux', Architecture: architecture });
    if (cmd === 'image')
      return JSON.stringify([
        {
          Id: configId,
          Os: 'linux',
          Architecture: arch,
          RepoDigests: [
            `ghcr.io/democratizedspace/dspace@${platformProof.platformDigest}`,
          ],
          Config: { Labels: labels },
        },
      ]);
    if (cmd === 'exec') {
      return args.includes('--input-type=module')
        ? `Verified full build SHA ${source.sourceSha} in canonical metadata, server, and client output.`
        : 'ok';
    }
    return '';
  };
  return {
    steps,
    options: {
      run,
      hostArch,
      hostOS: 'linux',
      runnerArch,
      name: 'isolated',
    },
  };
}

test('native runner uses only verified immutable child and constrained local container', () => {
  const d = mockDocker();
  const checks = {};
  verifyNativeImage(source, meta, proof, checks, d.options);
  assert.deepEqual(Object.keys(checks), [
    'native',
    'runtime',
    'buildMetadata',
    'bundle',
    'canvas',
    'http',
    'cleanup',
  ]);
  assert.ok(Object.values(checks).every(Boolean));
  const pull = d.steps.find(({ cmd }) => cmd === 'pull');
  assert.equal(
    pull.args.at(-1),
    `ghcr.io/democratizedspace/dspace@${proof.platformDigest}`
  );
  assert.equal(pull.timeout, 240_000);
  const start = d.steps.find(({ cmd }) => cmd === 'run').args;
  for (const flag of [
    '--network=none',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--user=1000:1000',
    '--read-only',
    '--pull=never',
    '--no-healthcheck',
    '--log-driver=none',
    proof.configDigest,
  ])
    assert.ok(start.includes(flag), flag);
  assert.ok(!start.some((arg) => /privileged|--mount|-v$|publish/.test(arg)));
  const http = d.steps.find(
    ({ cmd, args }) => cmd === 'exec' && args.at(-1).includes('/healthz')
  );
  assert.ok(http.args.at(-1).includes('http://127.0.0.1:8080'));
  assert.equal(http.timeout, 75000);
  assert.equal(d.steps.at(-1).cmd, 'rm');
  for (const { args } of d.steps.filter(({ cmd }) => cmd === 'exec')) {
    const module = args.includes('--input-type=module');
    const syntax = spawnSync(
      process.execPath,
      ['--check', '--input-type=' + (module ? 'module' : 'commonjs')],
      {
        input: args.at(-1),
        encoding: 'utf8',
      }
    );
    assert.equal(syntax.status, 0, syntax.stderr);
  }
});

test('native ARM64 verifies its own immutable child and rejects an x64 runner', () => {
  const input = { ...source, arch: 'arm64' };
  const platformProof = {
    ...proof,
    platformDigest: proof.platformDigests.arm64,
    configDigest: digest('4'),
  };
  const d = mockDocker({ arch: 'arm64', platformProof });
  const checks = {};
  verifyNativeImage(input, meta, platformProof, checks, d.options);
  const pull = d.steps.find(({ cmd }) => cmd === 'pull');
  assert.deepEqual(pull.args, [
    '--platform',
    'linux/arm64',
    `ghcr.io/democratizedspace/dspace@${platformProof.platformDigest}`,
  ]);
  const start = d.steps.find(({ cmd }) => cmd === 'run').args;
  assert.equal(start[start.indexOf('--platform') + 1], 'linux/arm64');
  assert.ok(start.includes(platformProof.configDigest));
  assert.ok(Object.values(checks).every(Boolean));
  const wrongRunner = mockDocker({
    arch: 'arm64',
    platformProof,
    runnerArch: 'X64',
  });
  assert.throws(
    () =>
      verifyNativeImage(input, meta, platformProof, {}, wrongRunner.options),
    /NATIVE_ARCHITECTURE_MISMATCH/
  );
  assert.deepEqual(
    wrongRunner.steps.map(({ cmd }) => cmd),
    ['info']
  );
});

test('each probe fails closed at its own stage and cleans up', () => {
  const cases = [
    ['RUNTIME_PROBE_FAILED', 'process.versions.node', 'runtime'],
    [
      'BUILD_METADATA_PROBE_FAILED',
      "require('/app/build_meta.json')",
      'buildMetadata',
    ],
    ['BUNDLE_PROBE_FAILED', '--input-type=module', 'bundle'],
    ['CANVAS_PROBE_FAILED', 'createCanvas(2,2)', 'canvas'],
    ['HTTP_PROBE_FAILED', '/healthz', 'http'],
  ];
  for (const [code, marker, stage] of cases) {
    const d = mockDocker({
      fail: (cmd, args) =>
        cmd === 'exec' &&
        (args.includes(marker) || args.at(-1).includes(marker)),
    });
    const checks = {};
    assert.throws(
      () => verifyNativeImage(source, meta, proof, checks, d.options),
      new RegExp(`^Error: ${code}$`)
    );
    assert.equal(checks[stage], undefined);
    assert.equal(checks.cleanup, true);
    assert.equal(d.steps.at(-1).cmd, 'rm');
    assert.equal(
      d.steps.filter(({ cmd }) => cmd === 'exec').length,
      cases.findIndex((x) => x[0] === code) + 1
    );
  }
});

test('native mismatches never execute, errors sanitize and clean up without false receipts', () => {
  for (const [opts, message] of [
    [{ architecture: 'arm64' }, 'NATIVE_ARCHITECTURE_MISMATCH'],
    [{ configId: digest('f') }, 'PULLED_IMAGE_MISMATCH'],
    [{ fail: (cmd) => cmd === 'run' }, 'CONTAINER_START_FAILED'],
    [{ fail: (cmd) => cmd === 'exec' }, 'RUNTIME_PROBE_FAILED'],
    [{ fail: (cmd) => cmd === 'rm' }, 'CONTAINER_CLEANUP_FAILED'],
  ]) {
    const d = mockDocker(opts);
    assert.throws(
      () => verifyNativeImage(source, meta, proof, {}, d.options),
      new RegExp(`^Error: ${message}$`)
    );
    if (opts.fail) assert.equal(d.steps.at(-1).cmd, 'rm');
    else assert.ok(!d.steps.some(({ cmd }) => cmd === 'run'));
  }
});

for (const [earlierFailure, errorCode] of [
  ['run', 'CONTAINER_START_FAILED'],
  ['exec', 'RUNTIME_PROBE_FAILED'],
  [null, 'CONTAINER_CLEANUP_FAILED'],
]) {
  test(`receipt reports ${errorCode} when cleanup fails`, async () => {
    const d = mockDocker({
      fail: (cmd) => cmd === 'rm' || cmd === earlierFailure,
    });
    let receipt;
    await assert.rejects(
      verifyCandidate(source, {
        source: () => meta,
        registry: () => proof,
        native: (input, metadata, platform, checks) =>
          verifyNativeImage(input, metadata, platform, checks, d.options),
        save: (record) => {
          receipt = record;
        },
      }),
      new RegExp(`^Error: ${errorCode}$`)
    );
    assert.equal(receipt.verified, false);
    assert.equal(receipt.errorCode, errorCode);
    assert.equal(receipt.checks.cleanup, false);
    assert.equal(receipt.checks.http, earlierFailure === null);
    assert.equal(d.steps.at(-1).cmd, 'rm');
  });
}

test('aggregate fails closed on incomplete, duplicate, mismatched and cross-attempt receipts', async () => {
  const save = () => {};
  const options = {
    source: () => meta,
    registry: (input) => ({
      ...proof,
      platformDigest: proof.platformDigests[input.arch],
    }),
    native: (_input, _meta, _proof, checks) => {
      for (const name of checkNames) checks[name] = true;
    },
    save,
  };
  const amd = await verifyCandidate(source, options);
  const arm = await verifyCandidate(
    { ...source, arch: 'arm64' },
    {
      ...options,
      registry: () => ({
        ...proof,
        platformDigest: proof.platformDigests.arm64,
        configDigest: digest('4'),
      }),
    }
  );
  const input = guard(env, { aggregate: true });
  assert.equal(aggregateReceipts(input, [amd, arm], meta).verified, true);
  assert.throws(
    () => aggregateReceipts(input, [amd, arm], { ...meta, tree: hex('e') }),
    /INVALID_OR_MISMATCHED_RECEIPT/
  );
  for (const records of [
    [amd],
    [amd, amd],
    [amd, { ...arm, verified: false }],
    [amd, { ...arm, runAttempt: '2' }],
    [amd, { ...arm, checks: { ...arm.checks, bundle: false } }],
    [
      amd,
      {
        ...arm,
        platformDigests: { ...arm.platformDigests, amd64: digest('e') },
      },
    ],
    [amd, { ...arm, tree: hex('e') }],
  ])
    assert.throws(() => aggregateReceipts(input, records, meta));
});

test('failure receipt records only validated identity, progress and fixed error code', async () => {
  let receipt;
  await assert.rejects(
    verifyCandidate(source, {
      source: () => meta,
      registry: () => {
        throw Error('private registry token');
      },
      save: (record) => {
        receipt = record;
      },
    }),
    /^Error: VERIFICATION_FAILED$/
  );
  assert.equal(receipt.verified, false);
  assert.equal(receipt.checks.source, true);
  assert.equal(receipt.checks.registry, false);
  assert.equal(receipt.errorCode, 'VERIFICATION_FAILED');
  assert.doesNotMatch(JSON.stringify(receipt), /private|token/);
});
