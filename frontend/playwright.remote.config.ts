import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { ensurePlaywrightBrowsers } from './scripts/utils/ensure-playwright-browsers.js';

declare const process: {
    env: {
        BASE_URL?: string;
        CI?: string;
        PW_WORKERS?: string;
        PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?: string;
        PLAYWRIGHT_SKIP_INSTALL_DEPS?: string;
    };
};

const frontendDir = fileURLToPath(new URL('.', import.meta.url));

const skipSystemDepsInstall =
    process.env.CI === 'true' || process.env.PLAYWRIGHT_SKIP_INSTALL_DEPS === '1';
const installArgs = skipSystemDepsInstall
    ? ['install', 'chromium', 'chromium-headless-shell']
    : undefined;

try {
    await ensurePlaywrightBrowsers({
        cwd: frontendDir,
        env: {
            ...process.env,
            ...(skipSystemDepsInstall ? { PLAYWRIGHT_SKIP_INSTALL_DEPS: '1' } : {}),
        },
        installArgs,
        installSystemDeps: !skipSystemDepsInstall,
    });
} catch (error) {
    console.warn('Warning: Could not ensure Playwright browsers:', (error as Error).message);
}

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3002';
const workers = process.env.PW_WORKERS ? Number.parseInt(process.env.PW_WORKERS, 10) : 1;

export default defineConfig({
    testDir: './e2e',
    testMatch: /remote-release-smoke\.spec\.ts/,
    fullyParallel: false,
    workers,
    retries: 0,
    timeout: 120_000,
    expect: {
        timeout: 15_000,
    },
    reporter: [
        ['list'],
        [
            'json',
            {
                outputFile:
                    process.env.REMOTE_SMOKE_REPORT_FILE ||
                    '../test-results/remote-smoke/playwright-report.json',
            },
        ],
    ],
    use: {
        baseURL,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
        actionTimeout: 15_000,
        navigationTimeout: 20_000,
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: {
                launchOptions: {
                    executablePath:
                        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() || undefined,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--headless=new',
                    ],
                },
            },
        },
    ],
});
