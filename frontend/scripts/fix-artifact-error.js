/**
 * fix-artifact-error.js
 *
 * Fixes the common ENOENT errors with Playwright artifacts during development.
 * This script can be run alongside the dev server to monitor and create missing files
 * that would otherwise cause errors.
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to the test-videos directory
const testVideosDir = path.join(rootDir, 'test-videos');

// Initialize the base directories
function initDirectories() {
    const directories = [
        testVideosDir,
        path.join(testVideosDir, '.playwright-artifacts-0'),
        path.join(testVideosDir, '.playwright-artifacts-0', 'traces'),
        path.join(testVideosDir, '.playwright-artifacts-0', 'traces', 'resources'),
    ];

    directories.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Create the file if it doesn't exist
function ensureFileExists(filepath) {
    if (!fs.existsSync(filepath)) {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        console.log(`Creating missing file: ${filepath}`);
        fs.writeFileSync(filepath, ''); // Create empty file
    }
}

// Extract the trace ID to create matching network file
function extractTraceId(filepath) {
    const filename = path.basename(filepath);
    // Remove '.trace' and split by '-' to get the IDs
    const parts = filename.replace('.trace', '').split('-');

    // Different formats observed in traces
    if (parts.length >= 2) {
        // Common format: id1-id2-recording1.trace
        if (filename.includes('recording')) {
            return parts.join('-');
        }
        // Other format: id1-id2.trace
        return parts.join('-');
    }
    return null;
}

// Watch for trace files and create matching network files
function watchTraceFiles() {
    const tracesDir = path.join(testVideosDir, '.playwright-artifacts-0', 'traces');

    // Create the watcher for .trace files
    const watcher = chokidar.watch(`${tracesDir}/**/*.trace`, {
        persistent: true,
        ignoreInitial: false,
    });

    watcher.on('add', (filepath) => {
        console.log(`Trace file detected: ${filepath}`);

        // Create corresponding .network file
        const networkFile = filepath.replace('.trace', '.network');
        ensureFileExists(networkFile);

        // Check for recording1 pattern and create those too
        const traceId = extractTraceId(filepath);
        if (traceId && !filepath.includes('recording1')) {
            const recording1Trace = path.join(tracesDir, `${traceId}-recording1.trace`);
            const recording1Network = path.join(tracesDir, `${traceId}-recording1.network`);

            ensureFileExists(recording1Trace);
            ensureFileExists(recording1Network);
        }
    });

    console.log(`Watching for trace files in ${tracesDir}`);
}

// Main function
function main() {
    console.log('Starting Playwright artifact error prevention...');
    initDirectories();
    watchTraceFiles();
    console.log('Artifact error prevention running. Leave this script running while developing.');
}

main();
