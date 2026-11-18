import test from 'node:test';
import { EventEmitter } from 'node:events';
import { attach } from './run-container-chat-smoke.mjs';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  nativePlatform,
  containerArgs,
  validProof,
  runContainer,
} from './run-container-chat-smoke.mjs';
import { parseAndValidateArgs } from './run-remote-chat-smoke.mjs';

const revision = 'a'.repeat(40);
test('attach timeout and signals remove container, kill client, detach listeners', async () => {
  for (const [signal, expected] of [
    [undefined, 124],
    ['SIGTERM', 143],
    ['SIGINT', 130],
  ]) {
    const signals = new EventEmitter();
    const child = new EventEmitter();
    const calls = [];
    child.kill = (value) => {
      calls.push(value);
      queueMicrotask(() => child.emit('close', null));
    };
    const pending = attach('unique-test-name', signal ? 10000 : 10, {
      signals,
      spawnImpl: () => child,
      dockerImpl: (args) => calls.push(args),
    });
    if (signal) signals.emit(signal);
    assert.equal(await pending, expected);
    assert.deepEqual(calls, [['rm', '--force', 'unique-test-name'], 'SIGKILL']);
    assert.equal(signals.listenerCount('SIGTERM'), 0);
    assert.equal(signals.listenerCount('SIGINT'), 0);
  }
});
const argv = [
  '--base-url',
  'https://staging.example.org',
  '--expected-version',
  '3.1.0',
  '--expected-revision',
  'b'.repeat(40),
  '--expected-provider',
  'openai',
];
const env = {
  DSPACE_SMOKE_IMAGE: 'smoke:local',
  DSPACE_EXPECTED_PROVIDER_CONFIG_CONTRACT: 'chat-default-provider-v1',
};
const proof = () => ({
  schemaVersion: 1,
  journey: '/chat',
  passed: true,
  executedAt: Math.floor(Date.now() / 1000),
  runnerRevision: revision,
  transport: 'intercepted',
  mutationEnabled: false,
});

function mock({
  code = 0,
  marker = proof(),
  fail,
  arch = 'arm64',
  attached = code,
} = {}) {
  const calls = [];
  return {
    calls,
    attach: async () => attached,
    docker: (args) => {
      calls.push(args);
      if (args[0] === fail) throw new Error(`missing ${fail}`);
      if (args[0] === 'info')
        return JSON.stringify({ OSType: 'linux', Architecture: 'aarch64' });
      if (args[0] === 'image')
        return JSON.stringify([
          {
            Id: `sha256:${'c'.repeat(64)}`,
            Os: 'linux',
            Architecture: arch,
            Config: {
              Labels: { 'org.opencontainers.image.revision': revision },
            },
          },
        ]);
      if (args[0] === 'inspect')
        return JSON.stringify({ Running: false, ExitCode: code });
      if (args[0] === 'cp') {
        if (!marker) throw new Error('missing result');
        writeFileSync(args[2], JSON.stringify(marker));
      }
      return '';
    },
  };
}

test('native amd64 and arm64 only; never emulates or accepts ARM32', () => {
  for (const [daemon, arch] of [
    ['x86_64', 'amd64'],
    ['aarch64', 'arm64'],
  ]) {
    assert.equal(
      nativePlatform(
        { OSType: 'linux', Architecture: daemon },
        { Os: 'linux', Architecture: arch }
      ),
      `linux/${arch}`
    );
  }
  assert.throws(() =>
    nativePlatform({ OSType: 'linux', Architecture: 'armv7l' }, {})
  );
  assert.throws(() =>
    nativePlatform({ OSType: 'windows', Architecture: 'amd64' }, {})
  );
  assert.throws(() =>
    nativePlatform(
      { OSType: 'linux', Architecture: 'arm64' },
      { Os: 'linux', Architecture: 'amd64' }
    )
  );
});

test('strict parser retains contracts and argv values without shell evaluation', () => {
  assert.throws(() => parseAndValidateArgs(argv, {}), /missing required/);
  assert.throws(
    () => parseAndValidateArgs([...argv, '--privileged'], env),
    /unknown flag/
  );
  const options = parseAndValidateArgs(argv, env);
  const args = containerArgs(options, revision);
  assert.ok(args.includes('chat-default-provider-v1'));
  assert.ok(args.includes('b'.repeat(40)));
  assert.throws(
    () =>
      containerArgs({ ...options, runnerRevision: 'd'.repeat(40) }, revision),
    /provenance/
  );
  assert.throws(
    () =>
      containerArgs(
        { ...options, baseURL: 'http://staging.example.org' },
        revision
      ),
    /HTTPS/
  );
  assert.throws(() => containerArgs(options, ''), /revision label/);
});

test('successful fresh proof; no env or mounts, immutable image, cleanup', async () => {
  const io = mock();
  assert.equal(
    await runContainer(
      argv,
      {
        ...env,
        OPENAI_API_KEY: 'secret',
        NODE_OPTIONS: '--bad',
        DSPACE_REMOTE_CHAT_SMOKE_FAULT: 'submission',
      },
      io
    ),
    0
  );
  const create = io.calls.find(([command]) => command === 'create');
  assert.ok(create.includes('--pull=never'));
  assert.ok(create.includes(`sha256:${'c'.repeat(64)}`));
  assert.ok(
    !create.some((value) =>
      /secret|--bad|--env|--volume|--mount|--privileged/.test(value)
    )
  );
  assert.equal(io.calls.at(-1)[0], 'rm');
});

test('failure, missing browser proof and false success propagate', async () => {
  for (const [settings, expected] of [
    [{ code: 7, marker: { ...proof(), passed: false } }, 7],
    [{ code: 1, marker: null }, 1],
    [{ code: 0, marker: null }, 1],
    [{ marker: { ...proof(), executedAt: 1 } }, 1],
    [{ marker: { ...proof(), runnerRevision: 'd'.repeat(40) } }, 1],
    [{ marker: { ...proof(), mutationEnabled: true } }, 1],
    [{ attached: 124 }, 124],
    [{ attached: 143 }, 143],
    [{ attached: 130 }, 130],
  ]) {
    const io = mock(settings);
    assert.equal(await runContainer(argv, env, io), expected);
    assert.equal(io.calls.at(-1)[0], 'rm');
  }
});

test('missing runtime/image fails, and create failure still cleans up', async () => {
  for (const fail of ['info', 'image', 'create']) {
    const io = mock({ fail });
    await assert.rejects(
      runContainer(argv, env, io),
      new RegExp(`missing ${fail}`)
    );
    if (fail === 'create') assert.equal(io.calls.at(-1)[0], 'rm');
  }
});

test('host proof is cleared on failure and atomically published on completion', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'smoke-test-'));
  const file = join(directory, 'result.json');
  const args = [...argv, '--result-file', file, '--runner-revision', revision];
  try {
    await writeFile(file, JSON.stringify(proof()));
    await assert.rejects(runContainer(args, env, mock({ fail: 'info' })));
    await assert.rejects(readFile(file), { code: 'ENOENT' });
    assert.equal(await runContainer(args, env, mock()), 0);
    assert.ok(
      validProof(JSON.parse(await readFile(file, 'utf8')), revision, 0, 0)
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
