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
        PLAYWRIGHT_PROJECTS?: string;
        PLAYWRIGHT_PROJECT?: string;
        PW_PROJECTS?: string;
        PW_PROJECT?: string;
    };
    argv: string[];
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
        Array.from(requestedValues).filter((value): value is ProjectName =>
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
            `No known Playwright projects matched "${Array.from(requestedValues).join(', ')}". Falling back to chromium.`
        );
        return AVAILABLE_PROJECTS.filter((project) => project.name === 'chromium');
    }

    return matched;
}

const projects = resolveProjects();

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
    projects,
    // Configure webServer to start the app server before running tests
    webServer: {
        // Use production preview server so grouped E2E tests don't restart the dev server
        command: 'npm run preview',
        cwd: frontendDir,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60000,
    },
    // Group tests to improve parallelization
    fullyParallel: false, // Only parallel when explicitly enabled in tests
});
