/**
 * Run Playwright tests in batches to improve performance
 * This helps reduce the total test execution time by grouping tests logically
 * and running them in a specific order.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine optimal number of workers based on CPU cores
const CPU_CORES = os.cpus().length;
const MAX_WORKERS = Math.max(2, Math.floor(CPU_CORES / 2)); // Use half the available cores, minimum 2

// Configuration: Test groups
const TEST_GROUPS = [
    {
        name: 'Test Coverage',
        files: ['test-coverage.spec.ts'],
        parallel: false,
        workers: 1,
    },
    {
        name: 'Structure Tests',
        files: [
            'page-structure.spec.ts',
            'error-pages.spec.ts',
            'svelte-component-hydration.spec.ts',
            'builtin-quests.spec.ts',
            'custom-backup.spec.ts',
            'authentication-flow.spec.ts',
            'cloud-sync.spec.ts',
            'cookie-consent.spec.ts',
            'docs-navigation.spec.ts',
            'docs-changelog.spec.ts',
            'failover-status.spec.ts',
            'home-page-basic.spec.ts',
            'profile-avatar-selection.spec.ts',
            'profile-page.spec.ts',
            'mobile-process-form.spec.ts',
            'leaderboard.spec.ts',
            'settings-page.spec.ts',
        ],
        parallel: true,
        workers: MAX_WORKERS,
    },
    {
        name: 'Item Tests',
        files: ['custom-content.spec.ts'],
        grep: 'create a custom item|retrieve all custom content',
        parallel: true,
        workers: Math.min(MAX_WORKERS, 3), // Cap at 3 for this group
    },
    {
        name: 'Process Tests',
        files: ['process-creation.spec.ts', 'custom-content.spec.ts'],
        grep: 'create a custom process',
        parallel: true,
        workers: 2,
    },
    {
        name: 'Process Preview',
        files: ['process-preview.spec.ts'],
        parallel: true,
        workers: 1,
    },
    {
        name: 'Quest Tests',
        files: [
            'test-quest-chat.spec.ts',
            'tutorial-quest.spec.ts',
            'quests.spec.ts',
            'constellations-quest.spec.ts',
            'custom-content.spec.ts',
            'quest-form-validation.spec.ts',
            'quest-pr-form.spec.ts',
        ],
        grep: 'create and view a custom quest|Quest Management|quest PR form',
        parallel: true,
        workers: 2,
    },
    {
        name: 'Quest PR Validation',
        files: ['quest-pr-validation.spec.ts'],
        parallel: false,
    },
    {
        name: 'Integration Tests',
        files: ['custom-content.spec.ts'],
        grep: 'integrate custom items, processes, and quests',
        parallel: false, // Keep this sequential as it depends on previous state
    },
    {
        name: 'Shop Functionality',
        files: ['shop-functionality.spec.ts'],
        parallel: true,
        workers: 2,
    },
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// Function to run a test group
function runTestGroup(group) {
    console.log(`${colors.bright}${colors.blue}Running ${group.name}${colors.reset}`);

    let command = 'npx playwright test';

    // Add files
    if (group.files && group.files.length > 0) {
        command += ` ${group.files.join(' ')}`;
    }

    // Add grep pattern if specified
    if (group.grep) {
        command += ` -g "${group.grep}"`;
    }

    // Configure parallelism
    if (group.parallel) {
        command += ` --workers=${group.workers || MAX_WORKERS}`;
    } else {
        command += ' --workers=1';
    }

    // Add additional performance optimizations
    command += ' --reporter=dot';

    try {
        console.log(`${colors.cyan}Command: ${command}${colors.reset}`);
        console.log(
            `${colors.cyan}Using ${group.parallel ? group.workers || MAX_WORKERS : 1} worker(s)${
                colors.reset
            }`
        );
        execSync(command, { stdio: 'inherit', cwd: rootDir });
        console.log(`${colors.green}✓ ${group.name} completed successfully${colors.reset}`);
        return true;
    } catch (error) {
        console.error(`${colors.red}✗ ${group.name} failed with error:${colors.reset}`);
        console.error(error.message);
        return false;
    }
}

function main() {
    console.log(
        `${colors.bright}${colors.magenta}Starting DSpace Test Suite in Groups${colors.reset}`
    );
    console.log(`${colors.yellow}Total groups: ${TEST_GROUPS.length}${colors.reset}`);
    console.log(
        `${colors.yellow}System has ${CPU_CORES} CPU cores, using up to ${MAX_WORKERS} workers for parallel tests${colors.reset}\n`
    );

    let startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    // Run each group in sequence
    for (let i = 0; i < TEST_GROUPS.length; i++) {
        const group = TEST_GROUPS[i];
        console.log(
            `${colors.yellow}Group ${i + 1}/${TEST_GROUPS.length}: ${group.name}${colors.reset}`
        );

        const groupStartTime = Date.now();
        const success = runTestGroup(group);
        const groupEndTime = Date.now();
        const groupDuration = (groupEndTime - groupStartTime) / 1000;

        if (success) {
            successCount++;
            console.log(
                `${colors.green}Group completed in ${groupDuration.toFixed(2)} seconds${
                    colors.reset
                }\n`
            );
        } else {
            failureCount++;
            console.log(
                `${colors.red}Group failed after ${groupDuration.toFixed(2)} seconds${
                    colors.reset
                }\n`
            );
        }
    }

    // Print summary
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;

    console.log(`${colors.bright}${colors.magenta}Test Suite Summary:${colors.reset}`);
    console.log(`${colors.green}✓ ${successCount} groups passed${colors.reset}`);
    console.log(`${colors.red}✗ ${failureCount} groups failed${colors.reset}`);
    console.log(`${colors.yellow}Total time: ${totalDuration.toFixed(2)} seconds${colors.reset}`);

    // Exit with appropriate code
    process.exit(failureCount > 0 ? 1 : 0);
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('run-test-groups.mjs')
) {
    main();
}

export { TEST_GROUPS, runTestGroup, main, CPU_CORES, MAX_WORKERS };
