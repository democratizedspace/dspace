import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { chatUiContractFor } from '../../frontend/e2e/remote-chat-smoke-contract';
import {
  parseAndValidateArgs,
  publishResult,
  runSmoke,
} from '../run-remote-chat-smoke.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';
const completeEnv = {
  DSPACE_SMOKE_BASE_URL: 'https://staging.example.test',
  DSPACE_EXPECTED_VERSION: '3.1.1',
  DSPACE_EXPECTED_REVISION: revision,
  DSPACE_EXPECTED_PROVIDER: 'openai',
};

function options(resultFile?: string) {
  return parseAndValidateArgs(
    resultFile
      ? [`--result-file=${resultFile}`, `--runner-revision=${revision}`]
      : [],
    completeEnv
  );
}

function childThat(event: 'exit' | 'error', ...args: unknown[]) {
  const child = new EventEmitter();
  queueMicrotask(() => child.emit(event, ...args));
  return child;
}

function completedChild(
  settings: { env: Record<string, string> },
  exitCode: number
) {
  const child = new EventEmitter();
  queueMicrotask(async () => {
    await writeFile(
      settings.env.DSPACE_REMOTE_CHAT_SMOKE_EXECUTION_FILE,
      settings.env.DSPACE_REMOTE_CHAT_SMOKE_EXECUTION_TOKEN
    );
    child.emit('exit', exitCode, null);
  });
  return child;
}

describe('remote chat smoke UI contract selection', () => {
  it.each([
    ['legacy-build-meta-v1', 'openai', 'legacy-inline-openai-v1'],
    ['legacy-build-meta-v1', 'token-place', 'modern-settings-v1'],
    ['build-info-v1', 'openai', 'modern-settings-v1'],
    ['build-info-v1', 'token-place', 'modern-settings-v1'],
  ] as const)('maps %s + %s to %s', (identityContract, provider, expected) => {
    expect(chatUiContractFor(identityContract, provider)).toBe(expected);
  });
});

describe('remote chat smoke result contract', () => {
  it('leaves an existing result untouched on validation failure', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    await writeFile(resultFile, 'existing-result\n');
    expect(() =>
      parseAndValidateArgs([`--result-file=${resultFile}`], completeEnv)
    ).toThrow('--result-file and --runner-revision');
    expect(await readFile(resultFile, 'utf8')).toBe('existing-result\n');
  });

  it('atomically replaces a result with the exact successful schema and restrictive mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    await writeFile(resultFile, '{"stale":true}\n');

    const outcome = await runSmoke(options(resultFile), {
      spawnImpl: (_command, _args, settings) =>
        completedChild(settings, 0) as never,
      publishResultImpl: (file, sha, passed) =>
        publishResult(file, sha, passed, () => 1785988800123),
    });

    expect(outcome).toEqual({ kind: 'completed', exitCode: 0 });
    const raw = await readFile(resultFile, 'utf8');
    expect(raw).toBe(
      `${JSON.stringify({
        schemaVersion: 1,
        journey: '/chat',
        passed: true,
        executedAt: 1785988800,
        runnerRevision: revision,
        transport: 'intercepted',
        mutationEnabled: false,
      })}\n`
    );
    expect(Object.keys(JSON.parse(raw))).toEqual([
      'schemaVersion',
      'journey',
      'passed',
      'executedAt',
      'runnerRevision',
      'transport',
      'mutationEnabled',
    ]);
    if (process.platform !== 'win32') {
      expect((await stat(resultFile)).mode & 0o777).toBe(0o600);
    }
  });

  it('publishes passed false and retains a completed child failure status', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    const outcome = await runSmoke(options(resultFile), {
      spawnImpl: (_command, _args, settings) =>
        completedChild(settings, 17) as never,
    });
    expect(outcome).toEqual({ kind: 'completed', exitCode: 17 });
    expect(JSON.parse(await readFile(resultFile, 'utf8')).passed).toBe(false);
  });

  it.each([
    ['launch failure', () => childThat('error', new Error('spawn failed'))],
    ['signal', () => childThat('exit', null, 'SIGTERM')],
  ])('preserves an existing result after %s', async (_name, spawnImpl) => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    await writeFile(resultFile, 'existing-result\n');
    const relaySignal = vi.fn();
    await runSmoke(options(resultFile), {
      spawnImpl: spawnImpl as never,
      relaySignal,
    });
    expect(await readFile(resultFile, 'utf8')).toBe('existing-result\n');
  });

  it('does not create a result when launch never completes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    await runSmoke(options(resultFile), {
      spawnImpl: () => childThat('error', new Error('spawn failed')) as never,
    });
    await expect(readFile(resultFile)).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it.each([0, 1])(
    'preserves an existing result when Playwright exits %i before a test body runs',
    async (childExitCode) => {
      const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
      const resultFile = join(directory, 'result.json');
      await writeFile(resultFile, 'existing-result\n');
      const outcome = await runSmoke(options(resultFile), {
        spawnImpl: () => childThat('exit', childExitCode, null) as never,
      });
      expect(outcome).toEqual({ kind: 'incomplete', exitCode: 1 });
      expect(await readFile(resultFile, 'utf8')).toBe('existing-result\n');
    }
  );

  it('preserves an existing result when launch throws synchronously', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dspace-chat-result-'));
    const resultFile = join(directory, 'result.json');
    await writeFile(resultFile, 'existing-result\n');
    const outcome = await runSmoke(options(resultFile), {
      spawnImpl: () => {
        throw new Error('spawn failed');
      },
    });
    expect(outcome).toMatchObject({ kind: 'launch-failure', exitCode: 1 });
    expect(await readFile(resultFile, 'utf8')).toBe('existing-result\n');
  });

  it('fails closed when publication fails after completion', async () => {
    const outcome = await runSmoke(options('/unwritten/result.json'), {
      spawnImpl: (_command, _args, settings) =>
        completedChild(settings, 0) as never,
      publishResultImpl: async () => {
        throw new Error('sensitive implementation detail');
      },
    });
    expect(outcome).toEqual({ kind: 'publication-failure', exitCode: 1 });
  });

  it('keeps legacy execution serial, intercepted, mutation-disabled, and output-free', async () => {
    let invocation:
      | { args: string[]; settings: { env: Record<string, string> } }
      | undefined;
    const outcome = await runSmoke(options(), {
      spawnImpl: (_command, args, settings) => {
        invocation = { args, settings } as typeof invocation;
        return childThat('exit', 0, null) as never;
      },
    });
    expect(outcome).toEqual({ kind: 'completed', exitCode: 0 });
    expect(invocation?.args).toEqual([
      './node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-chat-smoke.spec.ts',
      '--project=chromium',
    ]);
    expect(invocation?.settings.env).toMatchObject({
      PW_WORKERS: '1',
      REMOTE_CHAT_SMOKE: '1',
    });
  });
});
