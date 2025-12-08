import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MODULE_PATH =
  '../../frontend/scripts/utils/ensure-playwright-browsers.js';
const repoRoot = path.resolve(__dirname, '..', '..');
const frontendRoot = path.join(repoRoot, 'frontend');
const isWindows = process.platform === 'win32';
const platformDir = process.platform === 'darwin'
  ? 'chrome-mac'
  : isWindows
    ? 'chrome-win'
    : 'chrome-linux';
const cacheRoot = isWindows
  ? path.join(
      process.env.LOCALAPPDATA ??
        path.join(process.env.USERPROFILE ?? '', 'AppData', 'Local'),
      'ms-playwright'
    )
  : path.join(path.sep, 'root', '.cache', 'ms-playwright');
const chromeExecutableName = isWindows ? 'chrome.exe' : 'chrome';
const headlessExecutableName = isWindows ? 'headless_shell.exe' : 'headless_shell';
const chromeExecutable = path.join(
  cacheRoot,
  'chromium-1181',
  platformDir,
  chromeExecutableName
);
const headlessHyphen = path.join(
  cacheRoot,
  'chromium-headless-shell-1181',
  platformDir,
  headlessExecutableName
);
const headlessUnderscore = path.join(
  cacheRoot,
  'chromium_headless_shell-1181',
  platformDir,
  headlessExecutableName
);
const cliPath = path.join(
  frontendRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js'
);
const depsSentinel = path.join(frontendRoot, '.playwright-deps-installed');
const testIf = (condition: boolean) => (condition ? it : it.skip);
const originalEnv = process.env;

describe('ensurePlaywrightBrowsers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = originalEnv;
    try {
      vi.unmock('node:child_process');
      vi.unmock('node:fs');
    } catch (error) {
      // Module might not have been mocked in the test.
    }
  });

  it('installs system deps and browsers when chromium executable is missing', async () => {
    let chromeExists = false;
    let depsSentinelExists = false;
    const existingHeadless = new Set<string>();
    const execFileSync = vi.fn((_command, args: string[]) => {
      const action = args[1];
      if (action === 'install-deps') {
        depsSentinelExists = true;
        return;
      }

      if (action === 'install') {
        chromeExists = true;
        existingHeadless.add(headlessUnderscore);
      }
    });
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === cliPath) {
        return true;
      }
      if (candidate === chromeExecutable) {
        return chromeExists;
      }
      if (candidate === depsSentinel) {
        return depsSentinelExists;
      }
      return existingHeadless.has(candidate);
    });
    const writeFileSync = vi.fn(() => {
      depsSentinelExists = true;
    });
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execFileSync,
        default: { ...actual, execFileSync },
      };
    });
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        existsSync,
        writeFileSync,
        default: { ...actual, existsSync },
      };
    });
    const { ensurePlaywrightBrowsers } = await import(MODULE_PATH);

    await ensurePlaywrightBrowsers({ cwd: frontendRoot, browser });

    expect(execFileSync).toHaveBeenCalledTimes(2);
    expect(execFileSync.mock.calls[0]).toEqual([
      process.execPath,
      expect.arrayContaining([
        expect.stringContaining('node_modules/@playwright/test/cli.js'),
        'install-deps',
      ]),
      expect.objectContaining({
        cwd: frontendRoot,
        stdio: 'inherit',
        env: process.env,
      }),
    ]);
    expect(execFileSync.mock.calls[1]).toEqual([
      process.execPath,
      expect.arrayContaining([
        expect.stringContaining('node_modules/@playwright/test/cli.js'),
        'install',
        '--with-deps',
        'chromium',
        'chromium-headless-shell',
      ]),
      expect.objectContaining({
        cwd: frontendRoot,
        stdio: 'inherit',
        env: process.env,
      }),
    ]);
    expect(executablePath).toHaveBeenCalledTimes(2);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
  });

  it('warns but continues when headless shell is missing', async () => {
    let headlessInstalled = false;
    let depsSentinelExists = false;
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === cliPath) {
        return true;
      }
      if (candidate === chromeExecutable) {
        return true;
      }
      if (candidate === headlessUnderscore) {
        return headlessInstalled;
      }
      if (candidate === depsSentinel) {
        return depsSentinelExists;
      }
      return false;
    });
    const execFileSync = vi.fn();
    const writeFileSync = vi.fn(() => {
      depsSentinelExists = true;
    });
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execFileSync,
        default: { ...actual, execFileSync },
      };
    });
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        existsSync,
        writeFileSync,
        default: { ...actual, existsSync },
      };
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ensurePlaywrightBrowsers } = await import(MODULE_PATH);

    await ensurePlaywrightBrowsers({ cwd: frontendRoot, browser });

    expect(execFileSync).not.toHaveBeenCalled();
    expect(executablePath).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('headless shell is missing')
    );
    warnSpy.mockRestore();
  });

  it('skips install when chromium and headless shell already exist', async () => {
    const execFileSync = vi.fn();
    const existsSync = vi.fn((candidate: string) =>
      candidate === chromeExecutable ||
      candidate === headlessHyphen ||
      candidate === headlessUnderscore ||
      candidate === cliPath
    );
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execFileSync,
        default: { ...actual, execFileSync },
      };
    });
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        existsSync,
        default: { ...actual, existsSync },
      };
    });
    const { ensurePlaywrightBrowsers } = await import(MODULE_PATH);

    await ensurePlaywrightBrowsers({ cwd: frontendRoot, browser });

    expect(execFileSync).not.toHaveBeenCalled();
    expect(executablePath).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
  });

  it('prefers underscore headless directories when present', async () => {
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      const check = (candidate: string) => candidate === headlessUnderscore;
      return {
        ...actual,
        existsSync: check,
        default: { ...actual, existsSync: check },
      };
    });

    const { resolveHeadlessShellPath } = await import(MODULE_PATH);

    expect(resolveHeadlessShellPath(chromeExecutable)).toBe(headlessUnderscore);
  });

  it('falls back to hyphenated headless directories', async () => {
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      const check = (candidate: string) => candidate === headlessHyphen;
      return {
        ...actual,
        existsSync: check,
        default: { ...actual, existsSync: check },
      };
    });

    const { resolveHeadlessShellPath } = await import(MODULE_PATH);

    expect(resolveHeadlessShellPath(chromeExecutable)).toBe(headlessHyphen);
  });

  testIf(isWindows)('includes executable extensions when deriving headless shell path', async () => {
    const windowsExecutable = path.win32.join(
      'C:\\Users',
      'runner',
      'AppData',
      'Local',
      'ms-playwright',
      'chromium-1181',
      'chrome-win',
      'chrome.exe'
    );
    const headlessPath = path.win32.join(
      'C:\\Users',
      'runner',
      'AppData',
      'Local',
      'ms-playwright',
      'chromium-headless-shell-1181',
      'chrome-win',
      'headless_shell.exe'
    );

    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      const check = (candidate: string) => candidate === headlessPath;
      return {
        ...actual,
        existsSync: check,
        default: { ...actual, existsSync: check },
      };
    });

    const { resolveHeadlessShellPath } = await import(MODULE_PATH);

    expect(resolveHeadlessShellPath(windowsExecutable)).toBe(headlessPath);
  });

  it('throws a helpful error when the Playwright CLI is missing', async () => {
    vi.doMock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        existsSync: () => false,
        default: { ...actual, existsSync: () => false },
      };
    });

    const { resolvePlaywrightCLI } = await import(MODULE_PATH);

    expect(() => resolvePlaywrightCLI(frontendRoot)).toThrow(
      /Playwright CLI not found/
    );
  });
});
