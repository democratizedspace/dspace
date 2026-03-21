import { describe, expect, it } from 'vitest';

import {
  isSupportedNodeVersion,
  resolvePlaywrightCli,
  runRemoteCompletionistAwardIII,
} from '../scripts/run-remote-completionist-award-iii.mjs';

describe('resolvePlaywrightCli', () => {
  it('looks up the Playwright CLI package via require.resolve search paths', () => {
    const calls = [];
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (id, options) => {
      calls.push({ id, options });
      return '/repo/node_modules/@playwright/test/cli.js';
    });

    expect(resolved).toBe('/repo/node_modules/@playwright/test/cli.js');
    expect(calls).toEqual([
      {
        id: '@playwright/test/cli',
        options: {
          paths: ['/repo/frontend', '/repo'],
        },
      },
    ]);
  });

  it('resolves when Playwright CLI is available from repo root', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (_id, options) => {
      if (options?.paths?.[1] === '/repo') {
        return '/repo/node_modules/@playwright/test/cli.js';
      }
      throw new Error('not found');
    });

    expect(resolved).toBe('/repo/node_modules/@playwright/test/cli.js');
  });

  it('resolves when Playwright CLI is available from frontend', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (_id, options) => {
      if (options?.paths?.[0] === '/repo/frontend') {
        return '/repo/frontend/node_modules/@playwright/test/cli.js';
      }
      throw new Error('not found');
    });

    expect(resolved).toBe('/repo/frontend/node_modules/@playwright/test/cli.js');
  });

  it('returns null when Playwright CLI is not resolvable from either path', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], () => {
      throw new Error('MODULE_NOT_FOUND');
    });

    expect(resolved).toBeNull();
  });
});

describe('isSupportedNodeVersion', () => {
  it('rejects unsupported node major versions', () => {
    expect(isSupportedNodeVersion('18.19.0')).toBe(false);
    expect(isSupportedNodeVersion('22.0.0')).toBe(false);
  });

  it('accepts supported node major versions', () => {
    expect(isSupportedNodeVersion('20.11.1')).toBe(true);
    expect(isSupportedNodeVersion('21.7.3')).toBe(true);
  });
});

describe('runRemoteCompletionistAwardIII node preflight', () => {
  it('fails before Playwright spawn for unsupported node versions', () => {
    const errors: string[] = [];
    let exitCode: number | null = null;
    let spawnCalled = false;
    let resolveCalled = false;

    runRemoteCompletionistAwardIII(['--baseURL=https://staging.democratized.space'], {
      nodeVersion: '18.18.0',
      spawnFn: () => {
        spawnCalled = true;
        throw new Error('spawn should not be called');
      },
      exitFn: (code: number) => {
        exitCode = code;
      },
      errorFn: (message: string) => {
        errors.push(message);
      },
      logFn: () => {},
      env: {},
      resolvePlaywrightCliFn: () => {
        resolveCalled = true;
        return '/fake/playwright/cli.js';
      },
    });

    expect(exitCode).toBe(1);
    expect(spawnCalled).toBe(false);
    expect(resolveCalled).toBe(false);
    expect(errors[0]).toContain('[qa:remote-completionist-award-iii]');
    expect(errors[0]).toContain('Unsupported Node.js version 18.18.0');
    expect(errors[0]).toContain('Supported range is >=20 <22');
    expect(errors[0]).toContain('nvm use');
    expect(errors[0]).toContain('pnpm install');
  });
});
