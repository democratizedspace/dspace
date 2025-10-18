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

  it('installs browsers when chromium executable is missing', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    let chromeExists = false;
    const existingHeadless = new Set<string>();
    const execSync = vi.fn(() => {
      chromeExists = true;
      existingHeadless.add(headlessUnderscore);
    });
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === chromeExecutable) {
        return chromeExists;
      }
      return existingHeadless.has(candidate);
    });
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execSync,
        default: { ...actual, execSync },
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

    expect(execSync).toHaveBeenCalledTimes(1);
    expect(execSync).toHaveBeenCalledWith(
      'npx playwright install --with-deps chromium',
      expect.objectContaining({
        cwd: '/workspace/dspace/frontend',
        stdio: 'inherit',
        env: process.env,
      })
    );
    expect(executablePath).toHaveBeenCalledTimes(2);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
  });

  it('installs browsers when headless shell is missing', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessHyphen =
      '/root/.cache/ms-playwright/chromium-headless-shell-1181/chrome-linux/headless_shell';
    const headlessUnderscore =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    let headlessInstalled = false;
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === chromeExecutable) {
        return true;
      }
      if (candidate === headlessUnderscore) {
        return headlessInstalled;
      }
      return false;
    });
    const execSync = vi.fn(() => {
      headlessInstalled = true;
    });
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execSync,
        default: { ...actual, execSync },
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

    expect(execSync).toHaveBeenCalledTimes(1);
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
    const execSync = vi.fn();
    const existsSync = vi.fn((candidate: string) =>
      candidate === chromeExecutable || candidate === headlessHyphen || candidate === headlessUnderscore
    );
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual = await vi.importActual<typeof import('node:child_process')>(
        'node:child_process'
      );
      return {
        ...actual,
        execSync,
        default: { ...actual, execSync },
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

    expect(execSync).not.toHaveBeenCalled();
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
});
