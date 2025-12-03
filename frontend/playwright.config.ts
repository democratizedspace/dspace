import { defineConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensurePlaywrightBrowsers } from './scripts/utils/ensure-playwright-browsers.js';

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
        PLAYWRIGHT_PROJECTS?: string;
        PLAYWRIGHT_PROJECT?: string;
        PW_PROJECTS?: string;
        PW_PROJECT?: string;
    };
    argv: string[];
};

// Determine important paths for running tests regardless of the current working directory
const frontendDir = fileURLToPath(new URL('.', import.meta.url));

// Try to ensure Playwright browsers are available
// In CI, browsers may be pre-installed or handled separately
try {
    await ensurePlaywrightBrowsers({ cwd: frontendDir });
} catch (error) {
    // Log warning but don't fail - browsers may be available via other means
    console.warn('Warning: Could not ensure Playwright browsers:', error.message);
}

function ensureAstroBuildArtifacts(): void {
    const serverEntrypoint = join(frontendDir, 'dist', 'server', 'entry.mjs');

    if (existsSync(serverEntrypoint)) {
        return;
    }

    console.log('Astro build artifacts not found. Building before Playwright preview.');
    try {
        execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
    } catch (error) {
        console.error('Failed to build Astro project required for Playwright preview.');
        throw error;
    }
}

// Determine the base URL from environment variables or use default
const protocol = process.env.PROTOCOL || 'http';
const port = process.env.PLAYWRIGHT_PORT ? parseInt(process.env.PLAYWRIGHT_PORT, 10) : 4173;
// Propagate the resolved port so preview/server commands and downstream tools
// stay aligned even when the host sets a default PORT.
process.env.PLAYWRIGHT_PORT = String(port);
process.env.PORT = String(port);
// Default to an explicit IPv4 loopback address so Chromium never attempts an
// IPv6-only connection (which would manifest as intermittent
// net::ERR_CONNECTION_REFUSED failures when the preview server binds only to
// 0.0.0.0). CI can still override BASE_URL when running behind tunnels.
const baseURL = process.env.BASE_URL || `${protocol}://127.0.0.1:${port}`;

// Allow setting workers via environment variable for CI and local runs
const isCI = Boolean(process.env.CI);
const workers = process.env.PW_WORKERS ? parseInt(process.env.PW_WORKERS, 10) : undefined;
const RETRIES = isCI ? 2 : 0;
const EXPECT_TIMEOUT_MS = 15_000;
const TEST_TIMEOUT_MS = 60_000;

type ProjectName = 'chromium' | 'firefox' | 'webkit';

type PlaywrightConfig = Parameters<typeof defineConfig>[0];
type PlaywrightProjectConfig = NonNullable<PlaywrightConfig['projects']>[number];

const AVAILABLE_PROJECTS: PlaywrightProjectConfig[] = [
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
];

function parseProjectArguments(argv: string[]): string[] {
    const parsed: string[] = [];
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--project' || arg === '-p') {
            const value = argv[index + 1];
            if (value) {
                parsed.push(value);
                index++;
            }
        } else if (arg.startsWith('--project=')) {
            parsed.push(arg.split('=')[1]);
        } else if (arg.startsWith('-p=')) {
            parsed.push(arg.split('=')[1]);
        }
    }

    return parsed.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function parseProjectsFromEnv(): string[] {
    const envValue =
        process.env.PLAYWRIGHT_PROJECTS ||
        process.env.PLAYWRIGHT_PROJECT ||
        process.env.PW_PROJECTS ||
        process.env.PW_PROJECT;

    if (!envValue) {
        return [];
    }

    return envValue
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function resolveProjects(): PlaywrightProjectConfig[] {
    const cliArguments = parseProjectArguments(process.argv.slice(2));
    const envArguments = parseProjectsFromEnv();

    const requestedValues = new Set([...envArguments, ...cliArguments]);
    const wantsAll = Array.from(requestedValues).some((value) => value === 'all' || value === '*');

    const requestedProjects = new Set<ProjectName>(
        Array.from(requestedValues).filter(
            (value): value is ProjectName =>
                value === 'chromium' || value === 'firefox' || value === 'webkit'
        )
    );

    if (wantsAll) {
        return AVAILABLE_PROJECTS;
    }

    if (requestedProjects.size === 0) {
        return AVAILABLE_PROJECTS.filter((project) => project.name === 'chromium');
    }

    const matched = AVAILABLE_PROJECTS.filter((project) => requestedProjects.has(project.name));

    if (matched.length === 0) {
        console.warn(
            `No known Playwright projects matched "${Array.from(requestedValues).join(
                ', '
            )}". Falling back to chromium.`
        );
        return AVAILABLE_PROJECTS.filter((project) => project.name === 'chromium');
    }

    return matched;
}

const projects = resolveProjects();

ensureAstroBuildArtifacts();

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
        acceptDownloads: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
        actionTimeout: 15000,
        navigationTimeout: 15000,
        serviceWorkers: 'block',
        // Still keep this for safety, but we're using HTTP
        ignoreHTTPSErrors: true,
    },
    // Set directories for artifacts at the project level
    projects,
    // Configure webServer to start the app server before running tests
    webServer: {
        // Use production preview server so grouped E2E tests don't restart the dev server
        command: `node scripts/ensure-astro-build.mjs && astro preview --host 0.0.0.0 --port ${port}`,
        cwd: frontendDir,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 60000,
    },
    // Group tests to improve parallelization
    fullyParallel: !isCI, // Keep serial runs in CI to avoid cross-test interference
});
