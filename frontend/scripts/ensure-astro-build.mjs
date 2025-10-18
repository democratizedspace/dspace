import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRootDir = path.resolve(__dirname, '..');

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

export function ensureAstroBuild(options = {}) {
    const { root = defaultRootDir, exec = execSync, logger = console } = options;

    const serverEntrypoint = path.join(root, 'dist', 'server', 'entry.mjs');
    const serverBuilt = fs.existsSync(serverEntrypoint);
    const clientBuilt = hasClientAssets(root, logger);

    if (serverBuilt && clientBuilt) {
        logger.log?.('Astro build artifacts detected. Skipping rebuild.');
        return;
    }

    logger.log?.(
        'Astro build artifacts missing or incomplete. Building the app for Playwright preview...'
    );

    try {
        exec('npm run build', { cwd: root, stdio: 'inherit' });
    } catch (error) {
        (logger.error ?? console.error)(
            'Failed to build Astro project required for Playwright preview.'
        );
        throw error;
    }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ensure-astro-build.mjs')) {
    ensureAstroBuild();
}
