import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PLAYWRIGHT_RELATIVE_CLI = path.join('node_modules', '@playwright', 'test', 'cli.js');
const INSTALL_ARGS = ['install', '--with-deps', 'chromium', 'chromium-headless-shell'];
const INSTALL_DEPS_ARGS = ['install-deps'];
const INSTALL_DEPS_SENTINEL = '.playwright-deps-installed';

export function resolvePlaywrightCLI(cwd) {
    const cliPath = path.join(cwd, PLAYWRIGHT_RELATIVE_CLI);

    if (!existsSync(cliPath)) {
        throw new Error(
            `Playwright CLI not found at ${cliPath}. Have you installed frontend dependencies?`
        );
    }

    return cliPath;
}

export function resolveHeadlessShellPath(executablePath) {
    if (!executablePath) {
        return '';
    }

    let revisionDir = path.dirname(executablePath);
    let previousDir = '';

    while (revisionDir !== previousDir) {
        const revisionBasename = path.basename(revisionDir);

        if (revisionBasename.startsWith('chromium-') || revisionBasename.startsWith('chromium_')) {
            const parentDir = path.dirname(revisionDir);
            const relativeExecutablePath = path.relative(revisionDir, executablePath);

            if (relativeExecutablePath.startsWith('..')) {
                return '';
            }

            const executableExtension = path.extname(executablePath);
            const headlessExecutable = `headless_shell${executableExtension}`;
            const relativeDirectory = path.dirname(relativeExecutablePath);
            const headlessRelativePath =
                !relativeDirectory || relativeDirectory === '.'
                    ? headlessExecutable
                    : path.join(relativeDirectory, headlessExecutable);

            const revisionSuffix = revisionBasename.replace(/^chromium[-_]/, '');
            const headlessBasenames = [
                `chromium-headless-shell-${revisionSuffix}`,
                `chromium_headless_shell-${revisionSuffix}`,
                `chromium-headless_shell-${revisionSuffix}`,
                `chromium_headless-shell-${revisionSuffix}`,
            ];

            for (const headlessBasename of headlessBasenames) {
                const headlessRevisionDir = path.join(parentDir, headlessBasename);
                const candidatePath = path.join(headlessRevisionDir, headlessRelativePath);

                if (existsSync(candidatePath)) {
                    return candidatePath;
                }
            }

            return path.join(
                parentDir,
                `chromium-headless-shell-${revisionSuffix}`,
                headlessRelativePath
            );
        }

        previousDir = revisionDir;
        revisionDir = path.dirname(revisionDir);
    }

    return '';
}

export function hasChromiumExecutable(browser) {
    try {
        const executablePath = browser.executablePath();
        if (!executablePath) {
            return false;
        }

        if (!existsSync(executablePath)) {
            return false;
        }

        const headlessShellPath = resolveHeadlessShellPath(executablePath);
        if (!headlessShellPath || !existsSync(headlessShellPath)) {
            console.warn(
                `Playwright chromium executable found at ${executablePath} but headless shell is missing. Proceeding with chromium binary only.`
            );
            return true;
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function getChromiumBrowser() {
    try {
        const { chromium } = await import('@playwright/test');
        return chromium;
    } catch (error) {
        // @playwright/test not installed, return null
        return null;
    }
}

export async function ensurePlaywrightBrowsers(options = {}) {
    const {
        cwd = process.cwd(),
        installArgs = INSTALL_ARGS,
        env = process.env,
        platform = process.platform,
        installSystemDeps = true,
        browser: providedBrowser,
    } = options;

    const browser = providedBrowser ?? (await getChromiumBrowser());

    if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
        if (browser && !hasChromiumExecutable(browser)) {
            console.warn(
                'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 but Playwright chromium browser is missing. E2E tests may fail.'
            );
        }
        return;
    }

    if (!browser) {
        // Playwright not installed, skip browser check
        return;
    }

    if (hasChromiumExecutable(browser)) {
        return;
    }

    const cliPath = resolvePlaywrightCLI(cwd);

    if (installSystemDeps) {
        ensurePlaywrightSystemDeps({ cwd, env, cliPath, platform });
    }

    execFileSync(process.execPath, [cliPath, ...installArgs], {
        stdio: 'inherit',
        cwd,
        env,
    });

    if (!hasChromiumExecutable(browser)) {
        console.warn(
            'Playwright chromium executable is still missing after installation. Tests may fail if browsers are unavailable.'
        );
    }
}

function getSystemDepsSentinelPath(cwd) {
    return path.join(cwd, INSTALL_DEPS_SENTINEL);
}

export function ensurePlaywrightSystemDeps(options = {}) {
    const {
        cwd = process.cwd(),
        env = process.env,
        platform = process.platform,
        cliPath = resolvePlaywrightCLI(cwd),
        depsStampPath = getSystemDepsSentinelPath(cwd),
    } = options;

    if (platform !== 'linux') {
        return false;
    }

    if (env.PLAYWRIGHT_SKIP_INSTALL_DEPS === '1') {
        return false;
    }

    if (existsSync(depsStampPath)) {
        return false;
    }

    try {
        execFileSync(process.execPath, [cliPath, ...INSTALL_DEPS_ARGS], {
            stdio: 'inherit',
            cwd,
            env,
        });
    } catch (error) {
        if (env.CI === 'true') {
            throw error;
        }

        const message =
            'Failed to install Playwright system dependencies automatically. ' +
            'Run "npx playwright install-deps" manually if browsers fail to launch.';
        console.warn(message);
        return false;
    }

    try {
        writeFileSync(depsStampPath, `${new Date().toISOString()}\n`);
    } catch (error) {
        console.warn(
            `Unable to create Playwright deps sentinel file at ${depsStampPath}: ${error.message}`
        );
    }

    return true;
}
