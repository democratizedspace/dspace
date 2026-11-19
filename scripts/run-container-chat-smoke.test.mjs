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
import {
  parseAndValidateArgs,
  publishResult,
} from './run-remote-chat-smoke.mjs';

const revision = 'a'.repeat(40);
test('Docker ETIMEDOUT at the overall deadline maps to 124 across command phases', async () => {
  for (const phase of ['info', 'image', 'create', 'inspect', 'cp']) {
    let clock = 0;
    const io = mock();
    const invoke = io.docker;
    const failure = Object.assign(new Error('spawnSync docker ETIMEDOUT'), {
      code: 'ETIMEDOUT',
    });
    io.docker = (args, budget) => {
      if (args[0] === phase) {
        assert.equal(budget, 5000);
        clock += budget;
        throw failure;
      }
      return invoke(args);
    };
    const result = runContainer(
      argv,
      { ...env, DSPACE_SMOKE_TIMEOUT_MS: '5000' },
      io,
      () => clock
    );
    if (phase === 'cp') assert.equal(await result, 124);
    else
      await assert.rejects(
        result,
        (error) => error === failure && error.exitCode === 124
      );
    if (!['info', 'image'].includes(phase))
      assert.equal(io.calls.at(-1)[0], 'rm');
  }
});

test('shorter command timeouts and genuine command failures retain their original classification', async () => {
  for (const phase of ['info', 'inspect', 'cp']) {
    for (const [errorCode, elapsed] of [
      ['ETIMEDOUT', 10000],
      ['EACCES', 240000],
    ]) {
      let clock = 0;
      const io = mock();
      const invoke = io.docker;
      const failure = Object.assign(new Error(`docker ${errorCode}`), {
        code: errorCode,
      });
      io.docker = (args, budget) => {
        if (args[0] === phase) {
          assert.equal(budget, 10000);
          clock += elapsed;
          throw failure;
        }
        return invoke(args);
      };
      const result = runContainer(argv, env, io, () => clock);
      if (phase === 'cp') assert.equal(await result, 1);
      else
        await assert.rejects(
          result,
          (error) => error === failure && error.exitCode === undefined
        );
      assert.equal(failure.exitCode, undefined);
    }
  }
});

test('cancellation takes precedence over a simultaneous deadline-exhausting command timeout', async () => {
  let clock = 0;
  const signals = new EventEmitter();
  const io = mock();
  const invoke = io.docker;
  io.docker = (args, budget) => {
    if (args[0] === 'inspect') {
      clock += budget;
      signals.emit('SIGTERM');
      throw Object.assign(new Error('docker ETIMEDOUT'), { code: 'ETIMEDOUT' });
    }
    return invoke(args);
  };
  assert.equal(
    await runContainer(
      argv,
      { ...env, DSPACE_SMOKE_TIMEOUT_MS: '5000' },
      io,
      () => clock,
      signals
    ),
    143
  );
  assert.equal(io.calls.at(-1)[0], 'rm');
  assert.equal(signals.listenerCount('SIGTERM'), 0);
});

test('proof-copy deadline preserves a nonzero smoke exit and never reuses a stale result', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'smoke-timeout-test-'));
  const resultFile = join(directory, 'result.json');
  let clock = 0;
  const io = mock({ code: 7 });
  const invoke = io.docker;
  io.docker = (args, budget) => {
    if (args[0] === 'cp') {
      clock += budget;
      throw Object.assign(new Error('docker ETIMEDOUT'), { code: 'ETIMEDOUT' });
    }
    return invoke(args);
  };
  try {
    await writeFile(resultFile, JSON.stringify(proof()));
    const args = [
      ...argv,
      '--result-file',
      resultFile,
      '--runner-revision',
      revision,
    ];
    assert.equal(
      await runContainer(
        args,
        { ...env, DSPACE_SMOKE_TIMEOUT_MS: '5000' },
        io,
        () => clock
      ),
      7
    );
    await assert.rejects(readFile(resultFile), { code: 'ENOENT' });
    assert.equal(io.calls.at(-1)[0], 'rm');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('cancellation after attach, during publication and cleanup removes all results', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'smoke-cancel-test-'));
  const result = join(directory, 'result.json');
  try {
    for (const stage of ['inspect', 'cp', 'publish', 'rm']) {
      for (const [signal, code] of [
        ['SIGINT', 130],
        ['SIGTERM', 143],
      ]) {
        const signals = new EventEmitter();
        const io = mock();
        const invoke = io.docker;
        let copiedFile;
        io.docker = (args, budget) => {
          if (args[0] === 'cp') copiedFile = args[2];
          if (args[0] === 'rm') {
            assert.equal(
              signals.listenerCount(signal),
              1,
              'handler survives through cleanup'
            );
            assert.equal(budget, 10000);
          }
          const value = invoke(args);
          if (args[0] === stage) signals.emit(signal);
          return value;
        };
        io.publishResult = async (...args) => {
          await publishResult(...args);
          if (stage === 'publish') signals.emit(signal);
        };
        const args = [
          ...argv,
          '--result-file',
          result,
          '--runner-revision',
          revision,
        ];
        assert.equal(await runContainer(args, env, io, () => 0, signals), code);
        assert.equal(io.calls.at(-1)[0], 'rm');
        await assert.rejects(readFile(result), { code: 'ENOENT' });
        if (copiedFile)
          await assert.rejects(readFile(copiedFile), { code: 'ENOENT' });
        assert.equal(signals.listenerCount('SIGINT'), 0);
        assert.equal(signals.listenerCount('SIGTERM'), 0);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('lifecycle forwards cancellation to active attach and still performs final cleanup', async () => {
  const signals = new EventEmitter();
  const child = new EventEmitter();
  const io = mock();
  let killed;
  child.kill = (signal) => {
    killed = signal;
    queueMicrotask(() => child.emit('close', null));
  };
  io.attach = (name, timeout, options) => {
    const pending = attach(name, timeout, {
      ...options,
      spawnImpl: () => child,
    });
    queueMicrotask(() => signals.emit('SIGTERM'));
    return pending;
  };
  assert.equal(await runContainer(argv, env, io, () => 0, signals), 143);
  assert.equal(killed, 'SIGKILL');
  assert.equal(io.calls.at(-1)[0], 'rm');
  assert.equal(signals.listenerCount('SIGTERM'), 0);
});

test('unexpected attach client signal/null exit never becomes success', async () => {
  const child = new EventEmitter();
  const signals = new EventEmitter();
  const pending = attach('test', 10000, { spawnImpl: () => child, signals });
  child.emit('close', null, 'SIGKILL');
  assert.equal(await pending, 1);
  assert.equal(signals.listenerCount('SIGTERM'), 0);
});

test('one deadline includes preflight, attach and proof; cleanup has bounded reserve', async () => {
  let clock = 0;
  const io = mock();
  const invoke = io.docker;
  const budgets = [];
  io.docker = (args, budget) => {
    budgets.push([args[0], budget]);
    if (['info', 'image', 'create'].includes(args[0])) clock += 9000;
    return invoke(args);
  };
  io.attach = async (_name, budget) => {
    assert.equal(budget, 240000 - 27000);
    clock = 240000;
    return 0;
  };
  await assert.rejects(
    runContainer(argv, env, io, () => clock),
    { exitCode: 124 }
  );
  assert.ok(budgets.every(([, budget]) => budget <= 10000));
  assert.deepEqual(budgets.at(-1), ['rm', 10000]);
});

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

test('smoke image runtime matches the application pin without changing Playwright', async () => {
  const source = async (path) =>
    readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const version = (await source('.nvmrc')).trim();
  assert.equal(version, '24.22.3');
  const dockerfile = await source('containers/remote-chat-smoke/Dockerfile');
  const selfCheck = await source('containers/remote-chat-smoke/self-check.mjs');
  assert.ok(
    dockerfile.startsWith(
      `FROM node:${version}-bookworm-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS node-runtime`
    )
  );
  assert.ok(dockerfile.includes(`process.versions.node !== '${version}'`));
  assert.ok(
    selfCheck.includes(`assert.equal(process.versions.node, '${version}')`)
  );
  assert.ok(
    dockerfile.includes(
      'FROM mcr.microsoft.com/playwright:v1.54.2-noble@sha256:18b4bcff4f8ba0ac8c44b09f09def6a4f6cb8579e5f26381c21f38b50935d5d8'
    )
  );
});
