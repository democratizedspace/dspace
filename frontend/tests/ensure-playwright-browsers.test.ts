import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';

const execFileSyncMock = vi.fn();
const existsSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();
const chromiumExecutablePathMock = vi.fn();

const originalSkipInstallDeps = process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS;
const originalSkipBrowserDownload = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;

vi.mock('node:child_process', () => ({
    default: {
        execFileSync: execFileSyncMock,
    },
    execFileSync: execFileSyncMock,
}));

vi.mock('node:fs', async () => {
    const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
    return {
        ...actual,
        existsSync: existsSyncMock,
        writeFileSync: writeFileSyncMock,
    };
});

vi.mock('@playwright/test', () => ({
    chromium: {
        executablePath: chromiumExecutablePathMock,
    },
}));

type EnsureModule = typeof import('../scripts/utils/ensure-playwright-browsers.js');

async function importModule(): Promise<EnsureModule> {
    const module = await import('../scripts/utils/ensure-playwright-browsers.js');
    return module;
}

describe('ensurePlaywrightSystemDeps', () => {
    const cwd = '/workspace/dspace/frontend';
    const cliPath = `${cwd}/node_modules/@playwright/test/cli.js`;
    const depsStampPath = path.join(cwd, '.playwright-deps-installed-test');

    beforeEach(() => {
        execFileSyncMock.mockReset();
        existsSyncMock.mockReset();
        writeFileSyncMock.mockReset();
        process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS = '0';
    });

    it('invokes install-deps on linux when sentinel is missing', async () => {
        existsSyncMock.mockImplementation((target: string) => {
            if (target === cliPath) {
                return true;
            }
            if (target === depsStampPath) {
                return false;
            }
            return false;
        });

        const { ensurePlaywrightSystemDeps } = await importModule();

        const env = { PLAYWRIGHT_SKIP_INSTALL_DEPS: '0' };

        const result = ensurePlaywrightSystemDeps({
            cwd,
            env,
            platform: 'linux',
            cliPath,
            depsStampPath,
            exec: execFileSyncMock,
            fs: { existsSync: existsSyncMock, writeFileSync: writeFileSyncMock },
        });

        expect(result).toBe(true);
        expect(execFileSyncMock).toHaveBeenCalledTimes(1);
        expect(execFileSyncMock.mock.calls[0][1]).toEqual([cliPath, 'install-deps']);
        expect(writeFileSyncMock).toHaveBeenCalledWith(
            depsStampPath,
            expect.stringMatching(/\d{4}-\d{2}-\d{2}/)
        );
    });

    it('skips installation when sentinel exists', async () => {
        existsSyncMock.mockImplementation((target: string) => {
            if (target === cliPath) {
                return true;
            }
            if (target === depsStampPath) {
                return true;
            }
            return false;
        });

        const { ensurePlaywrightSystemDeps } = await importModule();

        const env = { ...process.env };

        const result = ensurePlaywrightSystemDeps({
            cwd,
            env,
            platform: 'linux',
            cliPath,
            depsStampPath,
            exec: execFileSyncMock,
            fs: { existsSync: existsSyncMock, writeFileSync: writeFileSyncMock },
        });

        expect(result).toBe(false);
        expect(execFileSyncMock).not.toHaveBeenCalled();
        expect(writeFileSyncMock).not.toHaveBeenCalled();
    });

    it('throws in CI when install-deps fails', async () => {
        existsSyncMock.mockImplementation((target: string) => {
            if (target === cliPath) {
                return true;
            }
            if (target === depsStampPath) {
                return false;
            }
            return false;
        });

        execFileSyncMock.mockImplementation(() => {
            throw new Error('install-deps failed');
        });

        const { ensurePlaywrightSystemDeps } = await importModule();

        expect(() =>
            ensurePlaywrightSystemDeps({
                cwd,
                env: { PLAYWRIGHT_SKIP_INSTALL_DEPS: '0', CI: 'true' },
                platform: 'linux',
                cliPath,
                depsStampPath,
                exec: execFileSyncMock,
                fs: { existsSync: existsSyncMock, writeFileSync: writeFileSyncMock },
            })
        ).toThrow('install-deps failed');
    });
});

describe('ensurePlaywrightBrowsers', () => {
    const cwd = '/workspace/dspace/frontend';
    const cliPath = `${cwd}/node_modules/@playwright/test/cli.js`;
    const chromiumPath = '/root/.cache/ms-playwright/chromium-1234/chrome';
    const headlessShellPath =
        '/root/.cache/ms-playwright/chromium-headless-shell-1234/headless_shell';
    const depsStampPath = path.join(cwd, '.playwright-deps-installed-test');

    beforeEach(() => {
        execFileSyncMock.mockReset();
        existsSyncMock.mockReset();
        writeFileSyncMock.mockReset();
        chromiumExecutablePathMock.mockReset();
        chromiumExecutablePathMock.mockReturnValue(chromiumPath);
        process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS = '0';
        delete process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
    });

    it('installs system deps before browsers when chromium is missing', async () => {
        let sentinelExists = false;
        let browserInstalled = false;

        existsSyncMock.mockImplementation((target: string) => {
            if (target === cliPath) {
                return true;
            }
            if (target === depsStampPath) {
                return sentinelExists;
            }
            if (target === chromiumPath) {
                return browserInstalled;
            }
            if (target === headlessShellPath) {
                return browserInstalled;
            }
            if (target.includes('chromium-headless-shell-1234')) {
                return browserInstalled && target === headlessShellPath;
            }
            return false;
        });

        execFileSyncMock.mockImplementation((_command, args: string[]) => {
            if (args[1] === 'install-deps') {
                sentinelExists = true;
            }
            if (args[1] === 'install') {
                browserInstalled = true;
            }
        });

        const { ensurePlaywrightBrowsers } = await importModule();

        await ensurePlaywrightBrowsers({
            cwd,
            env: { ...process.env },
            platform: 'linux',
            depsStampPath,
            exec: execFileSyncMock,
            fs: { existsSync: existsSyncMock, writeFileSync: writeFileSyncMock },
        });

        expect(execFileSyncMock).toHaveBeenCalledTimes(2);
        expect(execFileSyncMock.mock.calls[0][1]).toEqual([cliPath, 'install-deps']);
        expect(execFileSyncMock.mock.calls[1][1]).toEqual([
            cliPath,
            'install',
            'chromium',
            'chromium-headless-shell',
        ]);
        expect(writeFileSyncMock).toHaveBeenCalled();
    });

    it('respects skip flag for browser download', async () => {
        existsSyncMock.mockReturnValue(false);
        chromiumExecutablePathMock.mockReturnValue(undefined as unknown as string);

        const { ensurePlaywrightBrowsers } = await importModule();

        process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

        try {
            await ensurePlaywrightBrowsers({
                cwd,
                env: { ...process.env },
                platform: 'linux',
            });
        } finally {
            delete process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
        }

        expect(execFileSyncMock).not.toHaveBeenCalled();
    });
});

afterAll(() => {
    if (originalSkipInstallDeps === undefined) {
        delete process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS;
    } else {
        process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS = originalSkipInstallDeps;
    }

    if (originalSkipBrowserDownload === undefined) {
        delete process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
    } else {
        process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = originalSkipBrowserDownload;
    }
});
