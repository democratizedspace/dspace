import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function ensureAstroBuild() {
    const serverEntrypoint = path.join(rootDir, 'dist', 'server', 'entry.mjs');

    if (fs.existsSync(serverEntrypoint)) {
        console.log('Astro build artifacts detected. Skipping rebuild.');
        return;
    }

    console.log('Astro build artifacts not found. Building the app for Playwright preview...');
    try {
        execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
    } catch (error) {
        console.error('Failed to build Astro project required for Playwright preview.');
        throw error;
    }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ensure-astro-build.mjs')) {
    ensureAstroBuild();
}
