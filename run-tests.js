#!/usr/bin/env node

/**
 * Cross-platform script to run all tests before PR submission
 * This script detects the OS and runs the appropriate test script
 */

const { execSync } = require('child_process');
const os = require('os');
const { hasZeroTests } = require('./scripts/utils/detect-zero-tests');

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function runTests(exec = execSync, platform = os.platform()) {
    console.log(`${colors.bright}${colors.magenta}DSPACE Testing Suite${colors.reset}`);
    console.log(
        `${colors.cyan}Running comprehensive tests before PR submission...${colors.reset}\n`
    );

    try {
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

        // Determine which script to run based on OS
        if (platform === 'win32') {
            console.log(
                `${colors.yellow}Detected Windows OS, running PowerShell script...${colors.reset}`
            );
            exec('powershell -File .\\frontend\\scripts\\prepare-pr.ps1', {
                stdio: 'inherit'
            });
        } else {
            console.log(
                `${colors.yellow}Detected Unix-like OS, running Bash script...${colors.reset}`
            );
            exec('bash ./frontend/scripts/prepare-pr.sh', {
                stdio: 'inherit'
            });
        }

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
