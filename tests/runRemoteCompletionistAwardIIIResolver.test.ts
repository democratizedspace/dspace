import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  getUnsupportedNodeVersionMessage,
  isSupportedNodeVersion,
  main,
  resolvePlaywrightCli,
} from '../scripts/run-remote-completionist-award-iii.mjs';

type ChildProcessLike = {
  on: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => ChildProcessLike;
};

type SpawnFn = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    stdio: 'inherit';
    env: NodeJS.ProcessEnv;
  }
) => ChildProcessLike;

describe('resolvePlaywrightCli', () => {
  it('looks up the Playwright CLI package via require.resolve search paths', () => {
    const calls = [];
    const resolved = resolvePlaywrightCli(
      ['/repo/frontend', '/repo'],
      (id, options) => {
        calls.push({ id, options });
        return '/repo/node_modules/@playwright/test/cli.js';
      }
    );

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
    const resolved = resolvePlaywrightCli(
      ['/repo/frontend'],
      (_id, options) => {
        if (options?.paths?.[0] === '/repo/frontend') {
          return '/repo/frontend/node_modules/@playwright/test/cli.js';
        }
        throw new Error('not found');
      }
    );

    expect(resolved).toBe(
      '/repo/frontend/node_modules/@playwright/test/cli.js'
    );
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
    expect(message).toContain('>=24.22.3');
    expect(message).toContain('nvm use');
    expect(message).toContain('pnpm install');
  });

  it('accepts supported versions in the declared engine range', () => {
    expect(isSupportedNodeVersion('19.9.0')).toBe(false);
    expect(isSupportedNodeVersion('20.0.0')).toBe(false);
    expect(isSupportedNodeVersion('21.9.0')).toBe(false);
    expect(isSupportedNodeVersion('22.0.0')).toBe(false);
    expect(isSupportedNodeVersion('22.23.3')).toBe(false);
    expect(isSupportedNodeVersion('24.22.3')).toBe(true);
    expect(isSupportedNodeVersion('22.24.0')).toBe(false);
    expect(isSupportedNodeVersion('24.22.2')).toBe(false);
    expect(isSupportedNodeVersion('24.23.0')).toBe(true);
    expect(isSupportedNodeVersion('25.0.0')).toBe(false);
    expect(isSupportedNodeVersion('24.0.0')).toBe(false);
  });

  it('rejects malformed versions and accepts optional v-prefix versions', () => {
    expect(isSupportedNodeVersion('')).toBe(false);
    expect(isSupportedNodeVersion('not-a-version')).toBe(false);
    expect(isSupportedNodeVersion('v24.22.3')).toBe(true);
  });

  it.each([
    '18.18.0',
    '24.22.2',
    '25.0.0',
    '24.22',
    '24.22.3-rc.1',
    'not-a-version',
  ])('rejects %s before resolving or spawning Playwright', (nodeVersion) => {
    const spawnFn = vi.fn<SpawnFn>();
    const resolvePlaywrightCliFn = vi.fn();
    const errorLog = vi.fn();
    const exitFn = vi.fn();

    main({
      argv: ['--baseURL=https://staging.democratized.space'],
      nodeVersion,
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
    expect(errorLog.mock.calls[0][0]).toContain(
      `Unsupported Node.js version ${nodeVersion}`
    );
  });

  it('fails closed when the CLI is missing on a supported runtime', () => {
    const spawnFn = vi.fn<SpawnFn>();
    const exitFn = vi.fn();
    const errorLog = vi.fn();
    const resolvePlaywrightCliFn = vi.fn(() => null);
    main({
      nodeVersion: '24.22.3',
      argv: [],
      spawnFn,
      exitFn,
      errorLog,
      infoLog: vi.fn(),
      resolvePlaywrightCliFn,
    });
    expect(resolvePlaywrightCliFn).toHaveBeenCalledOnce();
    expect(spawnFn).not.toHaveBeenCalled();
    expect(exitFn).toHaveBeenCalledTimes(1);
    expect(exitFn).toHaveBeenCalledWith(1);
    expect(errorLog.mock.calls[0][0]).toContain(
      'Could not resolve @playwright/test/cli'
    );
  });

  it('uses the current Node runtime to launch Playwright', () => {
    const events = new Map<string, (...args: unknown[]) => void>();
    const printChecklistSummaryFn = vi.fn();
    const child: ChildProcessLike = {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        events.set(event, handler);
        return child;
      }),
    };
    const spawnFn = vi.fn<SpawnFn>(() => child);
    const exitFn = vi.fn();

    main({
      argv: ['--baseURL=https://staging.democratized.space'],
      nodeVersion: '24.22.3',
      spawnFn,
      resolvePlaywrightCliFn: () =>
        '/repo/node_modules/@playwright/test/cli.js',
      errorLog: vi.fn(),
      infoLog: vi.fn(),
      printChecklistSummaryFn,
      exitFn,
    });

    expect(spawnFn).toHaveBeenCalledTimes(1);
    expect(spawnFn.mock.calls[0][0]).toBe(process.execPath);
    expect(spawnFn.mock.calls[0][1]).toEqual([
      '/repo/node_modules/@playwright/test/cli.js',
      'test',
      'e2e/remote-completionist-award-iii.spec.ts',
      '--project=chromium',
    ]);
    expect(spawnFn.mock.calls[0][2]).toMatchObject({
      cwd: path.resolve(__dirname, '../frontend'),
      stdio: 'inherit',
      env: {
        BASE_URL: 'https://staging.democratized.space',
        PLAYWRIGHT_SKIP_INSTALL_DEPS: '1',
        REMOTE_COMPLETIONIST_AWARD_III: '1',
        REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER: '0',
      },
    });

    const exitHandler = events.get('exit');
    expect(exitHandler).toBeDefined();
    exitHandler?.(0, null);
    expect(printChecklistSummaryFn).toHaveBeenCalledWith(
      'test-results/remote-completionist-award-iii-harness-report.json'
    );
    expect(exitFn).toHaveBeenCalledWith(0);
  });

  it.each([7, null])(
    'propagates child exit %s without reporting success',
    (code) => {
      const events = new Map<string, (...args: unknown[]) => void>();
      const child: ChildProcessLike = {
        on(event, handler) {
          events.set(event, handler);
          return child;
        },
      };
      const exitFn = vi.fn();
      const printChecklistSummaryFn = vi.fn();
      main({
        argv: [],
        nodeVersion: 'v24.22.3',
        spawnFn: () => child,
        resolvePlaywrightCliFn: () => '/cli.js',
        infoLog: vi.fn(),
        exitFn,
        printChecklistSummaryFn,
      });
      events.get('exit')?.(code, null);
      expect(printChecklistSummaryFn).toHaveBeenCalledOnce();
      expect(exitFn).toHaveBeenCalledTimes(1);
      expect(exitFn).toHaveBeenCalledWith(code ?? 1);
    }
  );

  it('forwards child signals without printing a success summary', () => {
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    try {
      const events = new Map<string, (...args: unknown[]) => void>();
      const child: ChildProcessLike = {
        on(event, handler) {
          events.set(event, handler);
          return child;
        },
      };
      const exitFn = vi.fn();
      const printChecklistSummaryFn = vi.fn();
      main({
        argv: [],
        nodeVersion: '24.22.3',
        spawnFn: () => child,
        resolvePlaywrightCliFn: () => '/cli.js',
        infoLog: vi.fn(),
        exitFn,
        printChecklistSummaryFn,
      });
      events.get('exit')?.(null, 'SIGTERM');
      expect(kill).toHaveBeenCalledTimes(1);
      expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
      expect(printChecklistSummaryFn).not.toHaveBeenCalled();
      expect(exitFn).not.toHaveBeenCalled();
    } finally {
      kill.mockRestore();
    }
  });

  it('fails when the Playwright process cannot start', () => {
    const events = new Map<string, (...args: unknown[]) => void>();
    const child: ChildProcessLike = {
      on(event, handler) {
        events.set(event, handler);
        return child;
      },
    };
    const exitFn = vi.fn();
    const errorLog = vi.fn();
    main({
      argv: [],
      nodeVersion: '24.22.3',
      spawnFn: () => child,
      resolvePlaywrightCliFn: () => '/cli.js',
      infoLog: vi.fn(),
      exitFn,
      errorLog,
    });
    events.get('error')?.(new Error('ENOENT'));
    expect(errorLog.mock.calls[0][0]).toContain(
      'Failed to start Playwright process: ENOENT'
    );
    expect(exitFn).toHaveBeenCalledTimes(1);
    expect(exitFn).toHaveBeenCalledWith(1);
  });
});
