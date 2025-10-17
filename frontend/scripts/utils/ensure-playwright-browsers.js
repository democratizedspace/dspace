import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const INSTALL_COMMAND = 'npx playwright install --with-deps chromium';

export function resolveHeadlessShellPath(executablePath) {
    if (!executablePath) {
        return '';
    }

    let revisionDir = path.dirname(executablePath);
    let previousDir = '';

    while (revisionDir !== previousDir) {
        const revisionBasename = path.basename(revisionDir);

        if (revisionBasename.startsWith('chromium-')) {
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

            const headlessRevisionDir = path.join(
                parentDir,
                revisionBasename.replace('chromium-', 'chromium-headless-shell-')
            );

            return path.join(headlessRevisionDir, headlessRelativePath);
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
        if (!headlessShellPath) {
            return false;
        }

        return existsSync(headlessShellPath);
    } catch (error) {
        return false;
    }
}

export function ensurePlaywrightBrowsers(options = {}) {
    const {
        cwd = process.cwd(),
        command = INSTALL_COMMAND,
        env = process.env,
        browser = chromium,
    } = options;

    if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
        if (!hasChromiumExecutable(browser)) {
            console.warn(
                'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 but Playwright chromium browser is missing. E2E tests may fail.'
            );
        }
        return;
    }

    if (hasChromiumExecutable(browser)) {
        return;
    }

    execSync(command, {
        stdio: 'inherit',
        cwd,
        env,
    });

    if (!hasChromiumExecutable(browser)) {
        throw new Error(
            `Playwright chromium executable is still missing after running "${command}".`
        );
    }
}
