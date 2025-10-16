#!/usr/bin/env node

/**
 * Cross-platform script to run all tests before PR submission
 * This script detects the OS and runs the appropriate test script
 */

const { execSync } = require('child_process');
const os = require('os');
const { hasZeroTests } = require('./scripts/utils/detect-zero-tests');

// ANSI color codes for pretty output
const colors = Object.freeze({
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
});

function runTests(exec = execSync, platform = os.platform()) {
    console.log(`${colors.bright}${colors.magenta}DSPACE Testing Suite${colors.reset}`);
    console.log(
        `${colors.cyan}Running comprehensive tests before PR submission...${colors.reset}\n`
    );

    try {
        const coverageDone = process.env.CI_COVERAGE_DONE === '1';
        if (coverageDone) {
            console.log(
                `${colors.yellow}Skipping root unit tests (CI_COVERAGE_DONE=1).${colors.reset}`
            );
        } else {
            console.log(`${colors.yellow}Running root unit tests...${colors.reset}`);
            const rootOutput = exec('npm run test:root', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            process.stdout.write(rootOutput);
            if (hasZeroTests(rootOutput)) {
                console.error(`${colors.red}Error: no root tests were run.${colors.reset}`);
                return 1;
            }
        }

        const scripts = {
            win32: {
                message: `${colors.yellow}Detected Windows OS, running PowerShell script...${colors.reset}`,
                command: 'powershell -File .\\frontend\\scripts\\prepare-pr.ps1'
            },
            default: {
                message: `${colors.yellow}Detected Unix-like OS, running Bash script...${colors.reset}`,
                command: 'bash ./frontend/scripts/prepare-pr.sh'
            }
        };
        const { message, command } = scripts[platform] || scripts.default;
        console.log(message);
        exec(command, {
            stdio: 'inherit',
            env: { ...process.env, SKIP_UNIT_TESTS: '1' }
        });

        console.log(
            `\n${colors.bright}${colors.green}All tests completed successfully!${colors.reset}`
        );
        return 0;
    } catch (error) {
        console.error(
            `\n${colors.bright}${colors.red}Tests failed with error:${colors.reset}`
        );
        console.error(error.message);
        return 1;
    }
}

if (require.main === module) {
    const code = runTests();
    process.exit(code);
}

module.exports = { runTests };
