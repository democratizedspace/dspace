import { describe, expect, it } from 'vitest';
import { buildRemoteSmokeEnv, parseArgs } from '../run-remote-smoke.mjs';

describe('run-remote-smoke parseArgs', () => {
  it('enables mutation by default for launch-critical custom-item checks', () => {
    const parsed = parseArgs(['--baseURL=https://democratized.space']);
    const env = buildRemoteSmokeEnv(parsed, {});

    expect(parsed.mutate).toBe(true);
    expect(parsed.baseURL).toBe('https://democratized.space');
    expect(env.REMOTE_SMOKE_MUTATION).toBe('1');
  });

  it('supports explicit non-mutating opt-out flags', () => {
    const noMutate = parseArgs(['--baseURL=https://democratized.space', '--no-mutate']);
    const safeAlias = parseArgs(['--baseURL=https://democratized.space', '--safe']);
    const noMutateEnv = buildRemoteSmokeEnv(noMutate, {});
    const safeAliasEnv = buildRemoteSmokeEnv(safeAlias, {});

    expect(noMutate.mutate).toBe(false);
    expect(safeAlias.mutate).toBe(false);
    expect(noMutateEnv.REMOTE_SMOKE_MUTATION).toBe('0');
    expect(safeAliasEnv.REMOTE_SMOKE_MUTATION).toBe('0');
  });

  it('keeps --mutate available and allows it to override --no-mutate when last', () => {
    const reEnabled = parseArgs([
      '--baseURL=https://democratized.space',
      '--no-mutate',
      '--mutate',
    ]);

    expect(reEnabled.mutate).toBe(true);
  });

  it('honors REMOTE_SMOKE_MUTATION=0 as an explicit non-mutating default', () => {
    const original = process.env.REMOTE_SMOKE_MUTATION;
    process.env.REMOTE_SMOKE_MUTATION = '0';
    try {
      const parsed = parseArgs(['--baseURL=https://democratized.space']);
      expect(parsed.mutate).toBe(false);
      expect(parsed.mutateSource).toBe('env');
    } finally {
      if (original === undefined) {
        delete process.env.REMOTE_SMOKE_MUTATION;
      } else {
        process.env.REMOTE_SMOKE_MUTATION = original;
      }
    }
  });

  it('sets REMOTE_SMOKE_USE_WEBSERVER for local targets only', () => {
    const localEnv = buildRemoteSmokeEnv(parseArgs([]), {});
    const remoteEnv = buildRemoteSmokeEnv(parseArgs(['--baseURL=https://democratized.space']), {});

    expect(localEnv.REMOTE_SMOKE_USE_WEBSERVER).toBe('1');
    expect(remoteEnv.REMOTE_SMOKE_USE_WEBSERVER).toBe('0');
  });
});
