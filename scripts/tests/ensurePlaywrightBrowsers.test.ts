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
    const headlessExecutable =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    let chromeExists = false;
    let headlessExists = false;
    const execSync = vi.fn(() => {
      chromeExists = true;
      headlessExists = true;
    });
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === chromeExecutable) {
        return chromeExists;
      }
      if (candidate === headlessExecutable) {
        return headlessExists;
      }
      return false;
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
    expect(
      existsSync.mock.calls.filter(
        ([candidate]) => candidate === chromeExecutable || candidate === headlessExecutable
      )
    ).toHaveLength(3);
  });

  it('installs browsers when headless shell is missing', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessExecutable =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    let chromeExists = true;
    let headlessExists = false;
    const execSync = vi.fn(() => {
      headlessExists = true;
    });
    const existsSync = vi.fn((candidate: string) => {
      if (candidate === chromeExecutable) {
        return chromeExists;
      }
      if (candidate === headlessExecutable) {
        return headlessExists;
      }
      return false;
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
    expect(
      existsSync.mock.calls.filter(
        ([candidate]) => candidate === chromeExecutable || candidate === headlessExecutable
      )
    ).toHaveLength(4);
  });

  it('skips install when chromium and headless shell already exist', async () => {
    const chromeExecutable =
      '/root/.cache/ms-playwright/chromium-1181/chrome-linux/chrome';
    const headlessExecutable =
      '/root/.cache/ms-playwright/chromium_headless_shell-1181/chrome-linux/headless_shell';
    const execSync = vi.fn();
    const existsSync = vi.fn((candidate: string) =>
      candidate === chromeExecutable || candidate === headlessExecutable
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
    expect(
      existsSync.mock.calls.filter(
        ([candidate]) => candidate === chromeExecutable || candidate === headlessExecutable
      )
    ).toHaveLength(2);
  });
});
