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
    let hasBinary = false;
    const execSync = vi.fn(() => {
      hasBinary = true;
    });
    const existsSync = vi.fn(() => hasBinary);
    const executablePath = vi.fn(() => '/fake/chromium');
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
    expect(existsSync).toHaveBeenCalledTimes(2);
  });

  it('skips install when chromium executable already exists', async () => {
    const execSync = vi.fn();
    const existsSync = vi.fn(() => true);
    const executablePath = vi.fn(() => '/fake/chromium');
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
    expect(existsSync).toHaveBeenCalledTimes(1);
  });
});
