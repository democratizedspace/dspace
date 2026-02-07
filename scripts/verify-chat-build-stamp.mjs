import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBuildMetaComplete, readBuildMeta } from './write-build-meta.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const candidateDirs = [
    path.join(repoRoot, 'frontend', 'dist'),
    path.join(repoRoot, 'frontend', '.vercel', 'output', 'static'),
    path.join(repoRoot, 'frontend', '.vercel', 'output'),
    path.join(repoRoot, 'dist'),
];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.map']);

const normalizeSha = (value) => String(value || '').trim();

const walkFiles = async (dir, results = []) => {
    let entries = [];
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
        return results;
    }
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await walkFiles(entryPath, results);
        } else if (entry.isFile()) {
            results.push(entryPath);
        }
    }
    return results;
};

const findBuildDir = async () => {
    for (const dir of candidateDirs) {
        try {
            const entries = await fs.readdir(dir);
            if (entries.length > 0) {
                return dir;
            }
        } catch (error) {
            continue;
        }
    }
    return null;
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
    const buildDir = await findBuildDir();
    if (!buildDir) {
        throw new Error(
            `No frontend build output found. Checked: ${candidateDirs.join(', ')}`
        );
    }

    let buildMeta;
    try {
        buildMeta = await readBuildMeta();
        assertBuildMetaComplete(buildMeta);
    } catch (error) {
        throw new Error(`build_meta.json is invalid: ${error.message}`);
    }

    const gitSha = normalizeSha(buildMeta?.gitSha);
    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;
    const promptLabel = `v3:${shortSha}`;

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(`No build assets found in ${buildDir}`);
    }

    const requiredNeedles = [gitSha, promptLabel, 'v3:missing'];
    let foundFullSha = false;
    let foundPromptLabel = false;
    let foundMissingLabel = false;

    for (const filePath of assetFiles) {
        let matches = new Set();
        try {
            matches = await searchFileForNeedles(filePath, requiredNeedles);
        } catch (error) {
            continue;
        }

        if (matches.has(gitSha)) {
            foundFullSha = true;
        }
        if (matches.has(promptLabel)) {
            foundPromptLabel = true;
        }
        if (matches.has('v3:missing')) {
            foundMissingLabel = true;
        }
    }

    if (!foundFullSha) {
        throw new Error(`No build stamp found in assets. Expected SHA ${gitSha}.`);
    }

    if (!foundPromptLabel) {
        throw new Error(`No prompt stamp found in assets. Expected label ${promptLabel}.`);
    }

    if (foundMissingLabel) {
        throw new Error('Build assets contain v3:missing');
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
