import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { ensurePlaywrightBrowsers } from './scripts/utils/ensure-playwright-browsers.js';

declare const process: {
    env: {
        BASE_URL?: string;
        REMOTE_SMOKE_JSON_REPORT?: string;
        PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string;
        PLAYWRIGHT_SKIP_INSTALL_DEPS?: string;
        CI?: string;
    };
};

const frontendDir = fileURLToPath(new URL('.', import.meta.url));
const skipSystemDepsInstall = true;

try {
    await ensurePlaywrightBrowsers({
        cwd: frontendDir,
        env: {
            ...process.env,
            ...(skipSystemDepsInstall ? { PLAYWRIGHT_SKIP_INSTALL_DEPS: '1' } : {}),
        },
        installArgs: skipSystemDepsInstall
            ? ['install', 'chromium', 'chromium-headless-shell']
            : undefined,
        installSystemDeps: !skipSystemDepsInstall,
    });
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Could not ensure Playwright browsers for remote smoke:', message);
}

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const jsonOutputFile =
    process.env.REMOTE_SMOKE_JSON_REPORT || './test-results/remote-smoke/results.json';

export default defineConfig({
    testDir: './e2e',
    testMatch: /remote-release-smoke\.spec\.ts/,
    timeout: 90_000,
    expect: {
        timeout: 15_000,
    },
    retries: 0,
    fullyParallel: false,
    reporter: [['list'], ['json', { outputFile: jsonOutputFile }]],
    use: {
        baseURL,
        headless: true,
        actionTimeout: 20_000,
        navigationTimeout: 20_000,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: {
                launchOptions: {
                    executablePath: chromiumExecutable || undefined,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                },
            },
        },
    ],
});
