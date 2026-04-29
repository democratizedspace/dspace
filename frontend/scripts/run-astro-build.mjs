import { spawn } from 'node:child_process';

import fs from 'node:fs';
import path from 'node:path';

// Intentionally filter only Astro's unsupported-file warning spam for known support/content files
// under frontend/src/pages/**, while preserving every other warning and normal build output.
const ignoredPatterns = [/Prefix filename with an underscore/];
const unsupportedFileTypeMarker = 'Unsupported file type';
const underscoreHintMarker = 'Prefix filename with an underscore';

const knownSvelteRouteSupportFiles = new Set([
    '/src/pages/achievements/Achievements.svelte',
    '/src/pages/dchat/TokenBadge.svelte',
    '/src/pages/inventory/Inventory.svelte',
    '/src/pages/inventory/item/ItemPage.svelte',
    '/src/pages/item/[slug]/ItemProcesses.svelte',
    '/src/pages/leaderboard/Leaderboard.svelte',
    '/src/pages/process/[slug]/ProcessView.svelte',
    '/src/pages/processes/ProcessListRow.svelte',
    '/src/pages/processes/Processes.svelte',
    '/src/pages/profile/ProfileTitles.svelte',
    '/src/pages/shop/ShoppingForm.svelte',
    '/src/pages/titles/Titles.svelte',
]);

const knownDataFilePrefixes = [
    '/src/pages/docs/images/',
    '/src/pages/docs/json/',
    '/src/pages/inventory/json/',
    '/src/pages/inventory/jsonSchemas/',
    '/src/pages/processes/hardening/',
    '/src/pages/quests/archive/',
    '/src/pages/quests/json/',
    '/src/pages/quests/jsonSchemas/',
    '/src/pages/quests/templates/',
    '/src/pages/sharedSchemas/',
];

const knownDataFiles = new Set([
    '/src/pages/docs/sections.json',
    '/src/pages/processes/base.json',
    '/src/pages/processes/process.schema.json',
]);

const normalizePath = (value) => value.replaceAll('\\', '/');

const extractUnsupportedFilePath = (line) => {
    const match = line.match(/Unsupported file type\s+(.+?)(?:\s+found\.)?(?:\s+Prefix filename with an underscore.*)?$/);
    return match?.[1] ? normalizePath(match[1]) : null;
};

const isKnownIntentionalUnsupportedFile = (filePath) => {
    const normalizedPath = normalizePath(filePath);

    if (!normalizedPath.includes('/src/pages/')) {
        return false;
    }

    if (/\/src\/pages\/.*\/svelte\/.+\.svelte$/.test(normalizedPath)) {
        return true;
    }

    if (knownSvelteRouteSupportFiles.has(normalizedPath.slice(normalizedPath.indexOf('/src/pages/')))) {
        return true;
    }

    const pagesRelativePath = normalizedPath.slice(normalizedPath.indexOf('/src/pages/'));

    if (knownDataFiles.has(pagesRelativePath)) {
        return true;
    }

    return knownDataFilePrefixes.some((prefix) => pagesRelativePath.startsWith(prefix));
};

const createFilteredWriter = (stream) => {
    let buffered = '';
    let suppressUnderscoreHintLine = false;

    return (chunk, flush = false) => {
        buffered += chunk;
        const parts = buffered.split('\n');
        buffered = parts.pop() ?? '';

        for (const line of parts) {
            const unsupportedPath = extractUnsupportedFilePath(line);
            if (unsupportedPath && isKnownIntentionalUnsupportedFile(unsupportedPath)) {
                suppressUnderscoreHintLine = line.includes(unsupportedFileTypeMarker) && !line.includes(underscoreHintMarker);
                continue;
            }

            if (suppressUnderscoreHintLine && ignoredPatterns.some((pattern) => pattern.test(line))) {
                suppressUnderscoreHintLine = false;
                continue;
            }

            suppressUnderscoreHintLine = false;
            stream.write(`${line}\n`);
        }

        if (flush && buffered) {
            const unsupportedPath = extractUnsupportedFilePath(buffered);
            if (!(unsupportedPath && isKnownIntentionalUnsupportedFile(unsupportedPath))) {
                if (!(suppressUnderscoreHintLine && ignoredPatterns.some((pattern) => pattern.test(buffered)))) {
                    stream.write(buffered);
                }
            }
            buffered = '';
            suppressUnderscoreHintLine = false;
        }
    };
};


const writeQuestGraphDebugMarker = () => {
    const markerPath = path.join(process.cwd(), 'dist', '.quest-graph-debug-flag');
    const questGraphDebugEnabled = process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG === 'true';

    fs.mkdirSync(path.dirname(markerPath), { recursive: true });
    fs.writeFileSync(markerPath, questGraphDebugEnabled ? 'true' : 'false');
};

const child = spawn('astro', ['build', ...process.argv.slice(2)], {
    env: process.env,
    stdio: 'pipe',
    shell: true,
});

const writeStdout = createFilteredWriter(process.stdout);
const writeStderr = createFilteredWriter(process.stderr);

child.stdout.on('data', (chunk) => writeStdout(chunk.toString()));
child.stderr.on('data', (chunk) => writeStderr(chunk.toString()));

child.on('close', (code, signal) => {
    writeStdout('', true);
    writeStderr('', true);

    if (signal) {
        console.error(`astro build exited due to signal ${signal}`);
        process.kill(process.pid, signal);
        return;
    }

    if ((code ?? 1) === 0) {
        writeQuestGraphDebugMarker();
    }

    process.exit(code ?? 1);
});

child.on('error', (error) => {
    console.error('Failed to run astro build:', error);
    process.exit(1);
});
