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
import fsPromises from 'fs/promises';
import { resolveBuildMeta, writeBuildMeta } from '../../scripts/write-build-meta.mjs';
import { isRemotePlaywrightModeWithoutWebServerOverride } from './utils/playwright-remote-mode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure the quest graph debug handle is available in test builds
// even though Astro builds with production settings for preview.
// This flag is read at build time, so we need to default it here.
if (!process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG) {
    process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG = 'true';
}

// Do *not* touch Playwright here; this file is used by unit tests too.
// Playwright browser management is handled by playwright.config.ts for E2E tests only.
const { ensureAstroBuild } = await import('./ensure-astro-build.mjs');
if (isRemotePlaywrightModeWithoutWebServerOverride({ includeQuestsPerfBaseUrlSignal: true })) {
    // Keep this message stable for remote perf verification commands in PR evidence.
    console.log('Remote Playwright mode detected; skipping local Astro build setup.');
} else {
    ensureAstroBuild();
}

const readExistingBuildMetaSha = async () => {
    const buildMetaPath = path.join(rootDir, 'src', 'generated', 'build_meta.json');

    try {
        const rawBuildMeta = await fsPromises.readFile(buildMetaPath, 'utf8');
        const parsedBuildMeta = JSON.parse(rawBuildMeta);
        return String(parsedBuildMeta?.gitSha || '').trim();
    } catch {
        return '';
    }
};

const ensureBuildMetaForPreview = async () => {
    try {
        const { gitSha, source } = resolveBuildMeta();
        const existingGitSha = await readExistingBuildMetaSha();

        if (existingGitSha === gitSha) {
            return;
        }

        await writeBuildMeta({ gitSha, source });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
            `Warning: could not refresh build metadata (safe to ignore outside E2E/preview): ${message}`
        );
    }
};

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

await ensureBuildMetaForPreview();

console.log('Test environment setup complete.');
