import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');
const distDir = path.join(repoRoot, 'frontend/dist');

const normalizeSha = (value) => String(value || '').trim();

const isPlaceholderSha = (value) => {
    const normalized = normalizeSha(value).toLowerCase();
    return !normalized || normalized === 'unknown' || normalized === 'missing';
};

const walkFiles = async (dir, results = []) => {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
        console.warn(`Skipping ${dir}: ${error.message}`);
        return results;
    }
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await walkFiles(entryPath, results);
        } else {
            results.push(entryPath);
        }
    }
    return results;
};

const searchFileForNeedles = async (filePath, needles) => {
    const matches = new Set();
    const maxNeedleLength = Math.max(...needles.map((needle) => needle.length));
    let carryover = '';

    await new Promise((resolve, reject) => {
        const stream = createReadStream(filePath);
        stream.on('data', (chunk) => {
            const text = carryover + chunk.toString('utf8');
            for (const needle of needles) {
                if (text.includes(needle)) {
                    matches.add(needle);
                }
            }
            carryover = text.slice(-maxNeedleLength);
        });
        stream.on('error', reject);
        stream.on('end', resolve);
    });

    return matches;
};

const scanAssets = async () => {
    const rawMeta = await fs.readFile(buildMetaPath, 'utf-8');
    const buildMeta = JSON.parse(rawMeta);
    const gitSha = normalizeSha(buildMeta?.gitSha);
    if (isPlaceholderSha(gitSha)) {
        throw new Error(`build_meta.json gitSha is not set: ${gitSha || 'empty'}`);
    }
    let foundFullSha = false;
    let foundMissingLabel = false;

    const files = await walkFiles(distDir);
    if (!files.length) {
        throw new Error(`No build assets found in ${distDir}`);
    }

    for (const filePath of files) {
        const ext = path.extname(filePath);
        if (!['.js', '.mjs', '.cjs', '.html', '.css', '.map'].includes(ext)) {
            continue;
        }
        const matches = await searchFileForNeedles(filePath, [gitSha, 'v3:missing']);
        if (matches.has(gitSha)) {
            foundFullSha = true;
        }
        if (matches.has('v3:missing')) {
            foundMissingLabel = true;
        }
    }

    if (!foundFullSha) {
        throw new Error(`Build assets missing full SHA ${gitSha}`);
    }
    if (foundMissingLabel) {
        throw new Error('Build assets contain v3:missing');
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
