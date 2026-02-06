import fs from 'node:fs/promises';
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
    const entries = await fs.readdir(dir, { withFileTypes: true });
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

const scanAssets = async () => {
    const rawMeta = await fs.readFile(buildMetaPath, 'utf-8');
    const buildMeta = JSON.parse(rawMeta);
    const gitSha = normalizeSha(buildMeta?.gitSha);
    if (isPlaceholderSha(gitSha)) {
        throw new Error(`build_meta.json gitSha is not set: ${gitSha || 'empty'}`);
    }
    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;

    let foundFullSha = false;
    let foundPromptLabel = false;
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
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.includes(gitSha)) {
            foundFullSha = true;
        }
        if (content.includes(`v3:${shortSha}`)) {
            foundPromptLabel = true;
        }
        if (content.includes('v3:missing')) {
            foundMissingLabel = true;
        }
    }

    if (!foundFullSha) {
        throw new Error(`Build assets missing full SHA ${gitSha}`);
    }
    if (!foundPromptLabel) {
        throw new Error(`Build assets missing prompt label v3:${shortSha}`);
    }
    if (foundMissingLabel) {
        throw new Error('Build assets contain v3:missing');
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
