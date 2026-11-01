import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';
import {
  fixed,
  guard,
  checkSource,
  registry,
  smoke,
  verify,
} from './verify-published-image.mjs';
import { validatePublishedIndex } from './maintenance-image.mjs';

const env = {
  GITHUB_ACTIONS: 'true',
  RUNNER_ENVIRONMENT: 'github-hosted',
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REPOSITORY: fixed.repository,
  GITHUB_REF: `refs/heads/${fixed.branch}`,
  GITHUB_ACTOR: fixed.owner,
  GITHUB_TRIGGERING_ACTOR: fixed.owner,
};
const monday = new Date('2026-11-02T15:00:00Z');
const labels = {
  'org.opencontainers.image.revision': fixed.source,
  'org.opencontainers.image.version': fixed.version,
  'org.opencontainers.image.source': `https://github.com/${fixed.repository}`,
};

test('manual owner/host/ref/input/time restrictions fail closed', () => {
  guard(env, {}, monday);
  for (const key of Object.keys(env))
    assert.throws(() => guard({ ...env, [key]: 'wrong' }, {}, monday));
  assert.throws(() => guard(env, { inputs: { image: 'other' } }, monday));
  for (const date of ['2026-11-01T20:00:00Z', '2026-11-02T14:59:00Z'])
    assert.throws(() => guard(env, {}, new Date(date)));
});

test('source checkout checks full revision, tree, clean files and versions', () => {
  const answers = [
    fixed.source,
    fixed.tree,
    '',
    '{"version":"3.0.2"}',
    '{"version":"3.0.2"}',
    '24.22.1',
  ];
  checkSource(() => answers.shift());
  assert.throws(() => checkSource(() => 'changed'));
});

test('index accepts attestations but rejects missing or duplicate architectures', () => {
  const manifests = Object.entries(fixed.platforms).map(
    ([architecture, digest]) => ({
      platform: { os: 'linux', architecture },
      digest,
    })
  );
  manifests.push({
    platform: { os: 'unknown', architecture: 'unknown' },
    digest: 'attestation',
  });
  assert.deepEqual(
    validatePublishedIndex(200, fixed.index, fixed.index, { manifests }),
    fixed.platforms
  );
  assert.throws(() =>
    validatePublishedIndex(200, fixed.index, fixed.index, {
      manifests: manifests.slice(1),
    })
  );
  assert.throws(() =>
    validatePublishedIndex(200, fixed.index, fixed.index, {
      manifests: [...manifests, manifests[0]],
    })
  );
});

test('registry rejects denied access and content drift despite a matching header', async () => {
  await assert.rejects(registry(async () => new Response('', { status: 403 })));
  let calls = 0;
  await assert.rejects(
    registry(async () =>
      ++calls === 1
        ? new Response('{"token":"fixture"}')
        : new Response('{"manifests":[]}', {
            headers: { 'docker-content-digest': fixed.index },
          })
    ),
    /content digest mismatch/
  );
});

test('mock Docker uses only immutable pulls/runs, verifies labels, and cleans failed probes', () => {
  for (const arch of Object.keys(fixed.platforms)) {
    const calls = [];
    const run = (binary, args) => {
      assert.equal(binary, 'docker');
      calls.push(args);
      if (args[0] === 'image')
        return JSON.stringify([
          { Os: 'linux', Architecture: arch, Config: { Labels: labels } },
        ]);
      if (args[0] === 'exec') throw new Error('HTTP failed');
      return '';
    };
    assert.throws(() => smoke(arch, run), /HTTP failed/);
    assert.deepEqual(calls.at(-1), [
      'rm',
      '-f',
      `dspace-published-verification-${arch}`,
    ]);
    assert.ok(
      calls.every((args) =>
        ['pull', 'image', 'run', 'exec', 'rm'].includes(args[0])
      )
    );
    assert.ok(
      calls
        .filter((args) => ['pull', 'run'].includes(args[0]))
        .every((args) =>
          args.includes(`${fixed.image}@${fixed.platforms[arch]}`)
        )
    );
    assert.ok(
      calls.some(
        (args) =>
          args.includes('/scripts/verify-build-sha.mjs') &&
          args.includes('/app/dist')
      )
    );
  }
  assert.throws(() => smoke('other', () => assert.fail('must not execute')));
});

test('standalone receipt never claims verification on partial or registry failure', async () => {
  let saved;
  const deps = {
    sourceCheck: () => {},
    registryCheck: async () => {},
    smokeCheck: () => {},
    save: (r) => {
      saved = structuredClone(r);
    },
  };
  await verify(deps);
  assert.equal(saved.verified, true);
  assert.equal(saved.publishedByThisRun, false);
  await assert.rejects(
    verify({
      ...deps,
      smokeCheck: (arch) => {
        if (arch === 'arm64') throw new Error('canvas failed');
      },
    })
  );
  assert.equal(saved.verified, false);
  assert.equal(saved.platforms.amd64.verified, true);
  assert.equal(saved.platforms.arm64, undefined);
  await assert.rejects(
    verify({
      ...deps,
      registryCheck: async () => {
        throw new Error('registry');
      },
    })
  );
  assert.deepEqual(saved.platforms, {});
});

test('existing bundle verifier behavior: valid fixture, missing SHA, forbidden marker', () => {
  const root = mkdtempSync(join(tmpdir(), 'dspace-sha-'));
  const dist = join(root, 'dist');
  mkdirSync(dist);
  const run = () =>
    execFileSync(process.execPath, ['scripts/verify-build-sha.mjs', dist], {
      env: { ...process.env, EXPECTED_SHA: fixed.source },
      stdio: 'pipe',
    });
  try {
    writeFileSync(join(dist, 'app.js'), `const sha='${fixed.source}';`);
    run();
    writeFileSync(join(dist, 'app.js'), 'missing');
    assert.throws(run);
    writeFileSync(join(dist, 'app.js'), `${fixed.source} v3:unknown`);
    assert.throws(run);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('workflow is manual, read-only, fixed source and guard precedes QEMU', () => {
  const workflow = parse(
    readFileSync('.github/workflows/verify-published-image.yml', 'utf8')
  );
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.deepEqual(workflow.permissions, {
    contents: 'read',
    packages: 'read',
  });
  const steps = workflow.jobs.verify.steps;
  assert.ok(
    steps.findIndex((s) => s.run?.endsWith('--guard-only')) <
      steps.findIndex((s) => s.uses?.startsWith('docker/setup-qemu'))
  );
  assert.equal(
    steps.find((s) => s.with?.path === 'source').with.ref,
    fixed.source
  );
  assert.ok(
    steps
      .filter((s) => s.uses?.startsWith('actions/checkout'))
      .every((s) => s.with['persist-credentials'] === false)
  );
  assert.ok(
    !JSON.stringify(workflow).match(
      /build-push|login-action|secrets\.|packages:write|claude/i
    )
  );
});
