import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MODULE_PATH =
  '../../frontend/scripts/utils/ensure-playwright-browsers.js';
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
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    const cliPath =
      '/workspace/dspace/frontend/node_modules/@playwright/test/cli.js';
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
      if (candidate === '/workspace/dspace/frontend/.playwright-deps-installed') {
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

    ensurePlaywrightBrowsers({ cwd: '/workspace/dspace/frontend', browser });

    expect(execFileSync).toHaveBeenCalledTimes(2);
    expect(execFileSync.mock.calls[0]).toEqual([
      process.execPath,
      expect.arrayContaining([
        expect.stringContaining('node_modules/@playwright/test/cli.js'),
        'install-deps',
      ]),
      expect.objectContaining({
        cwd: '/workspace/dspace/frontend',
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
        cwd: '/workspace/dspace/frontend',
        stdio: 'inherit',
        env: process.env,
      }),
    ]);
    expect(executablePath).toHaveBeenCalledTimes(2);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
  });

  it('installs system deps when headless shell is missing', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    const cliPath =
      '/workspace/dspace/frontend/node_modules/@playwright/test/cli.js';
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
      if (candidate === '/workspace/dspace/frontend/.playwright-deps-installed') {
        return depsSentinelExists;
      }
      return false;
    });
    const execFileSync = vi.fn((_command, args: string[]) => {
      const action = args[1];
      if (action === 'install-deps') {
        depsSentinelExists = true;
        return;
      }

      if (action === 'install') {
        headlessInstalled = true;
      }
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

    ensurePlaywrightBrowsers({ cwd: '/workspace/dspace/frontend', browser });

    expect(execFileSync).toHaveBeenCalledTimes(2);
    expect(execFileSync.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.stringContaining('node_modules/@playwright/test/cli.js'),
        'install-deps',
      ])
    );
    expect(execFileSync.mock.calls[1][1]).toEqual(
      expect.arrayContaining([
        expect.stringContaining('node_modules/@playwright/test/cli.js'),
        'install',
        '--with-deps',
        'chromium',
        'chromium-headless-shell',
      ])
    );
    expect(executablePath).toHaveBeenCalledTimes(2);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
  });

  it('skips install when chromium and headless shell already exist', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    const cliPath =
      '/workspace/dspace/frontend/node_modules/@playwright/test/cli.js';
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

    ensurePlaywrightBrowsers({ cwd: '/workspace/dspace/frontend', browser });

    expect(execFileSync).not.toHaveBeenCalled();
    expect(executablePath).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
  });

  it('prefers underscore headless directories when present', async () => {
    const linuxExecutablePath =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';

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

    expect(resolveHeadlessShellPath(linuxExecutablePath)).toBe(headlessUnderscore);
  });

  it('falls back to hyphenated headless directories', async () => {
    const macExecutablePath =
      '/Users/dev/Library/Caches/ms-playwright/chromium-1181/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
    const headlessHyphen =
      '/Users/dev/Library/Caches/ms-playwright/chromium-headless-shell-1181/chrome-mac/Chromium.app/Contents/MacOS/headless_shell';

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

    expect(resolveHeadlessShellPath(macExecutablePath)).toBe(headlessHyphen);
  });

  it('includes executable extensions when deriving headless shell path', async () => {
    const windowsExecutable =
      'C:/Users/runner/AppData/Local/ms-playwright/chromium-1181/chrome-win/chrome.exe';
    const headlessPath =
      'C:/Users/runner/AppData/Local/ms-playwright/chromium-headless-shell-1181/chrome-win/headless_shell.exe';

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

    expect(() => resolvePlaywrightCLI('/workspace/dspace/frontend')).toThrow(
      /Playwright CLI not found/
    );
  });
});
