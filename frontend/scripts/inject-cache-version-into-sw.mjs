import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');
const publicDir = path.join(projectRoot, 'public');
const templatePath = path.join(publicDir, 'service-worker.template.js');
const outputPath = path.join(publicDir, 'service-worker.js');

async function resolveCacheVersion() {
    const modulePath = path.join(repoRoot, 'packages', 'cache-version', 'index.js');
    const { CACHE_VERSION } = await import(pathToFileURL(modulePath).href);
    if (typeof CACHE_VERSION !== 'string' || CACHE_VERSION.trim().length === 0) {
        throw new Error('CACHE_VERSION must be a non-empty string');
    }
    return CACHE_VERSION;
}

export async function injectCacheVersionIntoServiceWorker() {
    const cacheVersion = await resolveCacheVersion();
    const template = fs.readFileSync(templatePath, 'utf8');

    if (!template.includes('__CACHE_VERSION__')) {
        throw new Error('Service worker template is missing __CACHE_VERSION__ placeholder');
    }

    const output = template.replace(/__CACHE_VERSION__/g, cacheVersion);

    try {
        const existing = fs.readFileSync(outputPath, 'utf8');
        if (existing === output) {
            return;
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    fs.writeFileSync(outputPath, output);
}

if (process.argv[1]) {
    const invokedUrl = pathToFileURL(path.resolve(process.argv[1])).href;
    if (import.meta.url === invokedUrl) {
        await injectCacheVersionIntoServiceWorker();
    }
}
