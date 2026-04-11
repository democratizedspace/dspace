import { describe, expect, it, vi } from 'vitest';

import {
  getUnsupportedNodeVersionMessage,
  isSupportedNodeVersion,
  main,
  resolvePlaywrightCli,
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

  it('resolves when the search path is repo root only', () => {
    const resolved = resolvePlaywrightCli(['/repo'], (_id, options) => {
      if (options?.paths?.[0] === '/repo') {
        return '/repo/node_modules/@playwright/test/cli.js';
      }
      throw new Error('not found');
    });

    expect(resolved).toBe('/repo/node_modules/@playwright/test/cli.js');
  });

  it('resolves when the search path is frontend only', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend'], (_id, options) => {
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

describe('Node version preflight', () => {
  it('rejects unsupported versions and reports guidance', () => {
    expect(isSupportedNodeVersion('18.18.0')).toBe(false);

    const message = getUnsupportedNodeVersionMessage('18.18.0');
    expect(message).toContain('[qa:remote-completionist-award-iii]');
    expect(message).toContain('18.18.0');
    expect(message).toContain('20 || >=22');
    expect(message).toContain('nvm use');
    expect(message).toContain('pnpm install');
  });

  it('accepts supported versions in the declared engine range', () => {
    expect(isSupportedNodeVersion('19.9.0')).toBe(false);
    expect(isSupportedNodeVersion('20.0.0')).toBe(true);
    expect(isSupportedNodeVersion('21.9.0')).toBe(false);
    expect(isSupportedNodeVersion('22.0.0')).toBe(true);
  });

  it('rejects malformed versions and accepts optional v-prefix versions', () => {
    expect(isSupportedNodeVersion('')).toBe(false);
    expect(isSupportedNodeVersion('not-a-version')).toBe(false);
    expect(isSupportedNodeVersion('v20.11.0')).toBe(true);
  });

  it('fails before attempting Playwright launch on unsupported Node', () => {
    const spawnFn = vi.fn();
    const resolvePlaywrightCliFn = vi.fn();
    const errorLog = vi.fn();
    const exitFn = vi.fn();

    main({
      argv: ['--baseURL=https://staging.democratized.space'],
      nodeVersion: '18.18.0',
      spawnFn,
      resolvePlaywrightCliFn,
      errorLog,
      infoLog: vi.fn(),
      exitFn,
    });

    expect(resolvePlaywrightCliFn).not.toHaveBeenCalled();
    expect(spawnFn).not.toHaveBeenCalled();
    expect(exitFn).toHaveBeenCalledWith(1);
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(errorLog.mock.calls[0][0]).toContain('Unsupported Node.js version 18.18.0');
  });

  it('uses the current Node runtime to launch Playwright', () => {
    const events = new Map<string, (...args: unknown[]) => void>();
    const printChecklistSummaryFn = vi.fn();
    const child = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        events.set(event, handler);
        return child;
      }),
    };
    const spawnFn = vi.fn(() => child);
    const exitFn = vi.fn();

    main({
      argv: ['--baseURL=https://staging.democratized.space'],
      nodeVersion: '20.11.0',
      spawnFn,
      resolvePlaywrightCliFn: () => '/repo/node_modules/@playwright/test/cli.js',
      errorLog: vi.fn(),
      infoLog: vi.fn(),
      printChecklistSummaryFn,
      exitFn,
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    expect(spawnFn.mock.calls[0][0]).toBe(process.execPath);

    const exitHandler = events.get('exit');
    expect(exitHandler).toBeDefined();
    exitHandler?.(0, null);
    expect(printChecklistSummaryFn).toHaveBeenCalledWith(
      'test-results/remote-completionist-award-iii-harness-report.json'
    );
    expect(exitFn).toHaveBeenCalledWith(0);
  });
});
