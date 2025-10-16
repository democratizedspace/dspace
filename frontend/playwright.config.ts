import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

if (process.env.CI) {
    await import('fake-indexeddb/auto');
}

// Add type declaration for process.env
declare const process: {
    env: {
        CI?: string;
        BASE_URL?: string;
        PROTOCOL?: string;
        PW_WORKERS?: string;
    };
};

// Determine important paths for running tests regardless of the current working directory
const frontendDir = fileURLToPath(new URL('.', import.meta.url));

// Determine the base URL from environment variables or use default
const protocol = process.env.PROTOCOL || 'http';
const baseURL = process.env.BASE_URL || `${protocol}://localhost:3002`;

// Allow setting workers via environment variable for CI and local runs
const isCI = Boolean(process.env.CI);
const workers = process.env.PW_WORKERS ? parseInt(process.env.PW_WORKERS, 10) : undefined;
const RETRIES = isCI ? 1 : 0;
const EXPECT_TIMEOUT_MS = isCI ? 10000 : 5000;
const TEST_TIMEOUT_MS = isCI ? 45000 : 30000;

export default defineConfig({
    testDir: './e2e',
    workers,
    reporter: [
        ['list'],
        [
            'html',
            {
                outputFolder: './test-results/html-report/',
                open: 'never',
            },
        ],
    ],
    retries: RETRIES,
    timeout: TEST_TIMEOUT_MS,
    expect: {
        timeout: EXPECT_TIMEOUT_MS,
    },
    // Configure artifact folders
    outputDir: './test-artifacts/',
    use: {
        baseURL: baseURL,
        headless: true,
        // Screenshots configuration
        screenshot: 'only-on-failure',
        // Video configuration
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 15000,
        navigationTimeout: 15000,
        // Still keep this for safety, but we're using HTTP
        ignoreHTTPSErrors: true,
    },
    // Set directories for artifacts at the project level
    projects: [
        {
            name: 'chromium',
            use: {
                launchOptions: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--headless=new',
                    ],
                },
            },
            // Specify output directories for this project
            snapshotDir: './test-screenshots/',
            outputDir: './test-videos/',
        },
        {
            name: 'firefox',
            snapshotDir: './test-screenshots/',
            outputDir: './test-videos/',
        },
        {
            name: 'webkit',
            snapshotDir: './test-screenshots/',
            outputDir: './test-videos/',
        },
    ],
    // Configure webServer to start the app server before running tests
    webServer: {
        // Use production preview server so grouped E2E tests don't restart the dev server
        command: 'pnpm run preview',
        cwd: frontendDir,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60000,
    },
    // Group tests to improve parallelization
    fullyParallel: false, // Only parallel when explicitly enabled in tests
});
