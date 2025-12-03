import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { resolveCacheVersion } from './sync-cache-version.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const templatePath = path.join(publicDir, 'service-worker.template.js');
const outputPath = path.join(publicDir, 'service-worker.js');
const PLACEHOLDER = '__CACHE_VERSION__';

function renderServiceWorker(templateSource, cacheVersion) {
    if (!templateSource.includes(PLACEHOLDER)) {
        throw new Error(`Service worker template missing ${PLACEHOLDER} placeholder`);
    }
    return templateSource.replace(new RegExp(PLACEHOLDER, 'g'), cacheVersion);
}

export async function injectCacheVersionIntoServiceWorker() {
    const cacheVersion = await resolveCacheVersion();
    const template = fs.readFileSync(templatePath, 'utf8');
    const output = renderServiceWorker(template, cacheVersion);

    fs.mkdirSync(publicDir, { recursive: true });
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
