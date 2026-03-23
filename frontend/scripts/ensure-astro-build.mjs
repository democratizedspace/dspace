import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRootDir = path.resolve(__dirname, '..');

const questGraphDebugEnvFlag = process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG === 'true';

function hasClientAssets(rootDir, logger) {
    const clientAssetsDir = path.join(rootDir, 'dist', 'client', '_astro');

    try {
        const entries = fs.readdirSync(clientAssetsDir, { withFileTypes: true });
        return entries.some((entry) => entry.isFile());
    } catch (error) {
        if (error.code !== 'ENOENT') {
            logger.warn?.(`Failed to inspect client assets directory: ${error.message}`);
        }
        return false;
    }
}

function getQuestGraphDebugMarker(rootDir) {
    const markerPath = path.join(rootDir, 'dist', '.quest-graph-debug-flag');

    try {
        const contents = fs.readFileSync(markerPath, 'utf8').trim();
        return contents === 'true';
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(`Failed to read quest graph debug marker: ${error.message}`);
        }
        return null;
    }
}

function writeQuestGraphDebugMarker(rootDir, enabled) {
    const markerPath = path.join(rootDir, 'dist', '.quest-graph-debug-flag');

    try {
        fs.mkdirSync(path.dirname(markerPath), { recursive: true });
        fs.writeFileSync(markerPath, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn(`Failed to write quest graph debug marker: ${error.message}`);
    }
}

export function ensureAstroBuild(options = {}) {
    const { root = defaultRootDir, exec = execSync, logger = console } = options;

    const serverEntrypoint = path.join(root, 'dist', 'server', 'entry.mjs');
    const serverBuilt = fs.existsSync(serverEntrypoint);
    const clientBuilt = hasClientAssets(root, logger);
    const questGraphDebugMarker = getQuestGraphDebugMarker(root);
    const buildConfigMismatch =
        questGraphDebugMarker === null
            ? questGraphDebugEnvFlag
            : questGraphDebugMarker !== questGraphDebugEnvFlag;

    if (serverBuilt && clientBuilt && !buildConfigMismatch) {
        logger.log?.('Astro build artifacts detected. Skipping rebuild.');
        return;
    }

    const rebuildReason = buildConfigMismatch
        ? 'Quest graph debug flag mismatch detected. Rebuilding Astro app...'
        : 'Astro build artifacts missing or incomplete. Building the app for Playwright preview...';

    logger.log?.(rebuildReason);

    const runBuild = () => exec('npm run build', { cwd: root, stdio: 'inherit' });

    try {
        runBuild();
        writeQuestGraphDebugMarker(root, questGraphDebugEnvFlag);
    } catch (error) {
        const shouldRetryCleanBuild =
            error instanceof Error &&
            /ENOENT|no such file or directory/i.test(error.message || '');

        if (!shouldRetryCleanBuild) {
            (logger.error ?? console.error)(
                'Failed to build Astro project required for Playwright preview.'
            );
            throw error;
        }

        logger.warn?.(
            'Astro build encountered missing dist artifacts. Removing dist/ and retrying once...'
        );
        fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
        runBuild();
        writeQuestGraphDebugMarker(root, questGraphDebugEnvFlag);
    }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ensure-astro-build.mjs')) {
    ensureAstroBuild();
}
