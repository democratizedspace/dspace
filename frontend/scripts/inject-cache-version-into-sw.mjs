import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CACHE_VERSION } from '../../packages/cache-version/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatePath = resolve(__dirname, '../public/service-worker.template.js');
const outputPath = resolve(__dirname, '../public/service-worker.js');
const placeholder = '__CACHE_VERSION__';

const template = await readFile(templatePath, 'utf-8');

if (!template.includes(placeholder)) {
    throw new Error(`Placeholder ${placeholder} missing from service worker template.`);
}

const output = template.replace(new RegExp(placeholder, 'g'), CACHE_VERSION);

await writeFile(outputPath, output);

console.log(`Wrote service worker with cache version ${CACHE_VERSION}`);
