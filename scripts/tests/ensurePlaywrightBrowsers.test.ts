import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sanitizeProxyEnv } from '../../frontend/scripts/utils/ensure-playwright-browsers.js';

const MODULE_PATH =
  '../../frontend/scripts/utils/ensure-playwright-browsers.js';
const repoRoot = path.join(path.sep, 'workspace', 'dspace', 'frontend');
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
    const cacheRoot = path.join(path.sep, 'root', '.cache', 'ms-playwright');
    const chromeExecutable = path.join(
      cacheRoot,
      'chromium-1181',
      'chrome-linux',
      'chrome'
    );
    const headlessHyphen = path.join(
      cacheRoot,
      'chromium-headless-shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const headlessUnderscore = path.join(
      cacheRoot,
      'chromium_headless_shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const cliPath = path.join(
      repoRoot,
      'node_modules',
      '@playwright',
      'test',
      'cli.js'
    );
    let chromeExists = false;
    let depsSentinelExists = false;
    const existingHeadless = new Set<string>();
    const envWithProxy = {
      ...process.env,
      HTTPS_PROXY: 'http://legit-proxy:3128',
      npm_config_https_proxy: 'http://legit-proxy:3128',
    };
    const sanitizedEnv = sanitizeProxyEnv(envWithProxy);
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
      if (candidate === path.join(repoRoot, '.playwright-deps-installed')) {
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
      const actual =
        await vi.importActual<typeof import('node:child_process')>(
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

    await ensurePlaywrightBrowsers({
      cwd: repoRoot,
      browser,
      env: envWithProxy,
      platform: 'linux',
    });

    const installDepsCall = execFileSync.mock.calls.find(([, args]) =>
      Array.isArray(args) && args[1] === 'install-deps'
    );
    const installCall = execFileSync.mock.calls.find(([, args]) =>
      Array.isArray(args) && args[1] === 'install'
    );

    expect(installCall).toEqual([
      process.execPath,
      expect.arrayContaining([
        expect.stringContaining(
          path.join('node_modules', '@playwright', 'test', 'cli.js')
        ),
        'install',
        'chromium',
        'chromium-headless-shell',
      ]),
      expect.objectContaining({
        cwd: repoRoot,
        stdio: 'inherit',
        env: sanitizedEnv,
      }),
    ]);
    if (process.platform === 'linux') {
      expect(installDepsCall).toEqual([
        process.execPath,
        expect.arrayContaining([
          expect.stringContaining(
            path.join('node_modules', '@playwright', 'test', 'cli.js')
          ),
          'install-deps',
        ]),
        expect.objectContaining({
          cwd: repoRoot,
          stdio: 'inherit',
          env: sanitizedEnv,
        }),
      ]);
    } else {
      expect(installDepsCall).toBeUndefined();
    }
    expect(executablePath).toHaveBeenCalledTimes(2);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
    expect(existsSync).toHaveBeenCalledWith(headlessUnderscore);
  });

  it('removes known placeholder proxies before installing', () => {
    const envWithProxy = {
      HTTPS_PROXY: 'http://proxy:8080',
      HTTP_PROXY: 'http://proxy:8080',
      npm_config_https_proxy: 'http://proxy:8080',
      npm_config_http_proxy: 'http://proxy:8080',
      SOME_OTHER: 'value',
    };

    const result = sanitizeProxyEnv(envWithProxy);

    expect(result).toEqual({ SOME_OTHER: 'value' });
  });

  it('installs system dependency packages with sanitized env when only placeholder proxies are present', async () => {
    const envWithProxy = {
      HTTPS_PROXY: 'http://proxy:8080',
      HTTP_PROXY: 'http://proxy:8080',
      npm_config_https_proxy: 'http://proxy:8080',
      npm_config_http_proxy: 'http://proxy:8080',
    };
    const execFileSync = vi.fn();
    const writeFileSync = vi.fn();

    const { ensurePlaywrightSystemDeps } = await import(MODULE_PATH);

    const installed = ensurePlaywrightSystemDeps({
      cwd: repoRoot,
      env: envWithProxy,
      platform: 'linux',
      cliPath: path.join(
        repoRoot,
        'node_modules',
        '@playwright',
        'test',
        'cli.js'
      ),
      exec: execFileSync,
      fs: {
        existsSync: vi.fn((candidate: string) => {
          return (
            candidate ===
            path.join(repoRoot, 'node_modules', '@playwright', 'test', 'cli.js')
          );
        }),
        writeFileSync,
      },
    });

    expect(installed).toBe(true);
    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(execFileSync.mock.calls[0][2]).toMatchObject({
      cwd: repoRoot,
      stdio: 'inherit',
    });
    expect(execFileSync.mock.calls[0][2]?.env?.HTTP_PROXY).toBeUndefined();
    expect(execFileSync.mock.calls[0][2]?.env?.HTTPS_PROXY).toBeUndefined();
    expect(Object.keys(execFileSync.mock.calls[0][2]?.env ?? {})).toHaveLength(
      0
    );
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('preserves non-placeholder proxies during system deps install', async () => {
    const envWithProxy = {
      PLAYWRIGHT_SKIP_INSTALL_DEPS: '0',
      HTTPS_PROXY: 'http://corp-proxy.internal:8443',
      HTTP_PROXY: 'http://corp-proxy.internal:8080',
    };
    const execFileSync = vi.fn();
    const writeFileSync = vi.fn();

    const { ensurePlaywrightSystemDeps } = await import(MODULE_PATH);

    const installed = ensurePlaywrightSystemDeps({
      cwd: repoRoot,
      env: envWithProxy,
      platform: 'linux',
      cliPath: path.join(
        repoRoot,
        'node_modules',
        '@playwright',
        'test',
        'cli.js'
      ),
      exec: execFileSync,
      fs: {
        existsSync: vi.fn((candidate: string) => {
          return (
            candidate ===
            path.join(repoRoot, 'node_modules', '@playwright', 'test', 'cli.js')
          );
        }),
        writeFileSync,
      },
    });

    expect(installed).toBe(true);
    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(execFileSync.mock.calls[0][2]?.env).toMatchObject({
      HTTP_PROXY: envWithProxy.HTTP_PROXY,
      HTTPS_PROXY: envWithProxy.HTTPS_PROXY,
    });
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });

  it('warns but continues when headless shell is missing', async () => {
    const cacheRoot = path.join(path.sep, 'root', '.cache', 'ms-playwright');
    const chromeExecutable = path.join(
      cacheRoot,
      'chromium-1181',
      'chrome-linux',
      'chrome'
    );
    const headlessHyphen = path.join(
      cacheRoot,
      'chromium-headless-shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const headlessUnderscore = path.join(
      cacheRoot,
      'chromium_headless_shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const cliPath = path.join(
      repoRoot,
      'node_modules',
      '@playwright',
      'test',
      'cli.js'
    );
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
      if (candidate === path.join(repoRoot, '.playwright-deps-installed')) {
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
      const actual =
        await vi.importActual<typeof import('node:child_process')>(
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

    await ensurePlaywrightBrowsers({ cwd: repoRoot, browser });

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
    const cacheRoot = path.join(path.sep, 'root', '.cache', 'ms-playwright');
    const chromeExecutable = path.join(
      cacheRoot,
      'chromium-1181',
      'chrome-linux',
      'chrome'
    );
    const headlessHyphen = path.join(
      cacheRoot,
      'chromium-headless-shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const headlessUnderscore = path.join(
      cacheRoot,
      'chromium_headless_shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const cliPath = path.join(
      repoRoot,
      'node_modules',
      '@playwright',
      'test',
      'cli.js'
    );
    const execFileSync = vi.fn();
    const existsSync = vi.fn(
      (candidate: string) =>
        candidate === chromeExecutable ||
        candidate === headlessHyphen ||
        candidate === headlessUnderscore ||
        candidate === cliPath
    );
    const executablePath = vi.fn(() => chromeExecutable);
    const browser = { executablePath };

    vi.doMock('node:child_process', async () => {
      const actual =
        await vi.importActual<typeof import('node:child_process')>(
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

    await ensurePlaywrightBrowsers({ cwd: repoRoot, browser });

    expect(execFileSync).not.toHaveBeenCalled();
    expect(executablePath).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenCalledWith(headlessHyphen);
  });

  it('prefers underscore headless directories when present', async () => {
    const cacheRoot = path.join(path.sep, 'root', '.cache', 'ms-playwright');
    const linuxExecutablePath = path.join(
      cacheRoot,
      'chromium-1181',
      'chrome-linux',
      'chrome'
    );
    const headlessHyphen = path.join(
      cacheRoot,
      'chromium-headless-shell-1181',
      'chrome-linux',
      'headless_shell'
    );
    const headlessUnderscore = path.join(
      cacheRoot,
      'chromium_headless_shell-1181',
      'chrome-linux',
      'headless_shell'
    );

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

    expect(resolveHeadlessShellPath(linuxExecutablePath)).toBe(
      headlessUnderscore
    );
  });

  it('falls back to hyphenated headless directories', async () => {
    const macCacheRoot = path.join(
      path.sep,
      'Users',
      'dev',
      'Library',
      'Caches',
      'ms-playwright'
    );
    const macExecutablePath = path.join(
      macCacheRoot,
      'chromium-1181',
      'chrome-mac',
      'Chromium.app',
      'Contents',
      'MacOS',
      'Chromium'
    );
    const headlessHyphen = path.join(
      macCacheRoot,
      'chromium-headless-shell-1181',
      'chrome-mac',
      'Chromium.app',
      'Contents',
      'MacOS',
      'headless_shell'
    );

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
    const winCacheRoot = path.join(
      'C:',
      'Users',
      'runner',
      'AppData',
      'Local',
      'ms-playwright'
    );
    const windowsExecutable = path.join(
      winCacheRoot,
      'chromium-1181',
      'chrome-win',
      'chrome.exe'
    );
    const headlessPath = path.join(
      winCacheRoot,
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

    expect(() => resolvePlaywrightCLI(repoRoot)).toThrow(
      /Playwright CLI not found/
    );
  });
});
