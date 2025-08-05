import { defineConfig } from '@playwright/test';

// Add type declaration for process.env
declare const process: {
    env: {
        CI?: string;
        BASE_URL?: string;
        PROTOCOL?: string;
        PW_WORKERS?: string;
    };
};

// Determine the base URL from environment variables or use default
const protocol = process.env.PROTOCOL || 'http';
const baseURL = process.env.BASE_URL || `${protocol}://localhost:3002`;

// Allow setting workers via environment variable for CI and local runs
const workers = process.env.PW_WORKERS ? parseInt(process.env.PW_WORKERS) : process.env.CI ? 1 : 1;

export default defineConfig({
    testDir: './e2e',
    workers: workers,
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
    retries: process.env.CI ? 2 : 1, // Add 1 retry for flaky tests even in local development
    timeout: 30000,
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
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60000,
    },
    // Group tests to improve parallelization
    fullyParallel: false, // Only parallel when explicitly enabled in tests
});
