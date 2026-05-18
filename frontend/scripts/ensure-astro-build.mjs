import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRootDir = path.resolve(__dirname, '..');

const questGraphDebugEnvFlag = process.env.PUBLIC_ENABLE_QUEST_GRAPH_DEBUG === 'true';
const dspaceEnvFlag = (process.env.DSPACE_ENV || '').trim().toLowerCase();

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

function readBuildMarker(rootDir, fileName, label) {
    const markerPath = path.join(rootDir, 'dist', fileName);

    try {
        return fs.readFileSync(markerPath, 'utf8').trim();
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(`Failed to read ${label} marker: ${error.message}`);
        }
        return null;
    }
}

function writeBuildMarker(rootDir, fileName, contents, label) {
    const markerPath = path.join(rootDir, 'dist', fileName);

    try {
        fs.mkdirSync(path.dirname(markerPath), { recursive: true });
        fs.writeFileSync(markerPath, contents);
    } catch (error) {
        console.warn(`Failed to write ${label} marker: ${error.message}`);
    }
}

function getQuestGraphDebugMarker(rootDir) {
    const contents = readBuildMarker(rootDir, '.quest-graph-debug-flag', 'quest graph debug');
    return contents === null ? null : contents === 'true';
}

function writeBuildConfigMarkers(rootDir) {
    writeBuildMarker(
        rootDir,
        '.quest-graph-debug-flag',
        questGraphDebugEnvFlag ? 'true' : 'false',
        'quest graph debug'
    );

    if (dspaceEnvFlag) {
        writeBuildMarker(rootDir, '.dspace-env-flag', dspaceEnvFlag, 'DSPACE_ENV');
    }
}

export function ensureAstroBuild(options = {}) {
    const { root = defaultRootDir, exec = execSync, logger = console } = options;

    const serverEntrypoint = path.join(root, 'dist', 'server', 'entry.mjs');
    const serverBuilt = fs.existsSync(serverEntrypoint);
    const clientBuilt = hasClientAssets(root, logger);
    const questGraphDebugMarker = getQuestGraphDebugMarker(root);
    const dspaceEnvMarker = readBuildMarker(root, '.dspace-env-flag', 'DSPACE_ENV');
    const questGraphDebugMismatch =
        questGraphDebugMarker === null
            ? questGraphDebugEnvFlag
            : questGraphDebugMarker !== questGraphDebugEnvFlag;
    const dspaceEnvMismatch = dspaceEnvFlag ? dspaceEnvMarker !== dspaceEnvFlag : false;
    const buildConfigMismatch = questGraphDebugMismatch || dspaceEnvMismatch;

    if (serverBuilt && clientBuilt && !buildConfigMismatch) {
        logger.log?.('Astro build artifacts detected. Skipping rebuild.');
        return;
    }

    const rebuildReason = buildConfigMismatch
        ? 'Build environment marker mismatch detected. Rebuilding Astro app...'
        : 'Astro build artifacts missing or incomplete. Building the app for Playwright preview...';

    logger.log?.(rebuildReason);

    const runBuild = () =>
        exec('npm run build', { cwd: root, stdio: ['inherit', 'inherit', 'pipe'] });

    try {
        runBuild();
        writeBuildConfigMarkers(root);
    } catch (error) {
        const errorOutput =
            (error instanceof Error ? error.message : '') +
            (error && typeof error === 'object' && error.stderr
                ? `\n${error.stderr.toString()}`
                : '');
        const shouldRetryCleanBuild = /ENOENT|no such file or directory/i.test(errorOutput);

        if (!shouldRetryCleanBuild) {
            (logger.error ?? console.error)(
                'Failed to build Astro project required for Playwright preview.'
            );
            throw error;
        }

        logger.warn?.(
            'Astro build encountered missing dist artifacts. Removing dist/ and retrying once...'
        );
        try {
            fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
            runBuild();
            writeBuildConfigMarkers(root);
        } catch (retryError) {
            (logger.error ?? console.error)(
                'Failed to build Astro project required for Playwright preview (retry after dist/ removal).'
            );
            throw retryError;
        }
    }
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('ensure-astro-build.mjs')
) {
    ensureAstroBuild();
}
