/**
 * setup-test-env.js
 *
 * This script ensures that all necessary directories for Playwright tests
 * exist and have the correct permissions before tests are run.
 * It also creates placeholder files for common trace files to prevent ENOENT errors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureAstroBuild } from './ensure-astro-build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Check if we're running E2E tests by looking at npm_lifecycle_event or parent process
// This allows us to skip Playwright browser checks for unit tests
const isE2ETest =
    process.env.npm_lifecycle_event?.includes('e2e') ||
    process.env.npm_lifecycle_script?.includes('playwright') ||
    process.env.npm_lifecycle_script?.includes('@playwright/test');

if (isE2ETest) {
    // Only import and call ensurePlaywrightBrowsers for E2E tests
    const { ensurePlaywrightBrowsers } = await import('./utils/ensure-playwright-browsers.js');
    await ensurePlaywrightBrowsers({ cwd: rootDir });
}

ensureAstroBuild();

// Directories to ensure exist
const directories = [
    path.join(rootDir, 'test-videos'),
    path.join(rootDir, 'test-videos', '.playwright-artifacts-0'),
    path.join(rootDir, 'test-videos', '.playwright-artifacts-0', 'traces'),
    path.join(rootDir, 'test-videos', '.playwright-artifacts-0', 'traces', 'resources'),
    path.join(rootDir, 'test-artifacts'),
    path.join(rootDir, 'test-results'),
    path.join(rootDir, 'playwright-report'),
];

// Create directories if they don't exist
directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Fix permissions (important for CI environments)
directories.forEach((dir) => {
    try {
        fs.chmodSync(dir, 0o755);
    } catch (error) {
        console.warn(`Warning: Could not set permissions for ${dir}: ${error.message}`);
    }
});

// Create placeholder files for common trace files that might be missing
// This prevents ENOENT errors during development
const placeholderFiles = [
    path.join(rootDir, 'test-videos', '.playwright-artifacts-0', 'traces', 'placeholder.network'),
    path.join(rootDir, 'test-videos', '.playwright-artifacts-0', 'traces', 'placeholder.trace'),
    path.join(
        rootDir,
        'test-videos',
        '.playwright-artifacts-0',
        'traces',
        'placeholder-recording1.network'
    ),
    path.join(
        rootDir,
        'test-videos',
        '.playwright-artifacts-0',
        'traces',
        'placeholder-recording1.trace'
    ),
];

// Create empty placeholder files if they don't exist
placeholderFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
        try {
            console.log(`Creating placeholder file: ${file}`);
            fs.writeFileSync(file, ''); // Create empty file
        } catch (error) {
            console.warn(`Warning: Could not create placeholder file ${file}: ${error.message}`);
        }
    }
});

// Add a .gitignore file to the test-videos directory to prevent committing large artifacts
const gitignorePath = path.join(rootDir, 'test-videos', '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    try {
        console.log('Creating .gitignore file for test artifacts');
        fs.writeFileSync(
            gitignorePath,
            '# Ignore all files in this directory\n*\n# Except this file\n!.gitignore\n'
        );
    } catch (error) {
        console.warn(`Warning: Could not create .gitignore file: ${error.message}`);
    }
}

console.log('Test environment setup complete.');
