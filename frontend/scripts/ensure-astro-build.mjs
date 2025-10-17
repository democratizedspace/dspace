import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SERVER_ENTRYPOINT = path.join(rootDir, 'dist', 'server', 'entry.mjs');

function ensureAstroBuild() {
    if (fs.existsSync(SERVER_ENTRYPOINT)) {
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

export { ensureAstroBuild };
export default ensureAstroBuild;
