import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBuildMetaComplete, readBuildMeta } from './write-build-meta.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = process.env.VERIFY_REPO_ROOT
    ? path.resolve(process.env.VERIFY_REPO_ROOT)
    : path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend', 'src', 'generated', 'build_meta.json');

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
    const buildMetaNeedles = [`"gitSha":"${gitSha}"`, `"gitSha": "${gitSha}"`];
    const mustFind = [gitSha, ...buildMetaNeedles];
    const mustNotFind = ['v3:missing'];
    const optionalFind = [promptLabel, 'Prompt version: v3:'];

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(`No build assets found in ${buildDir}`);
    }

    const searchNeedles = [...mustFind, ...mustNotFind, ...optionalFind];
    const foundMustFind = new Set();
    const foundOptional = new Set();
    const forbiddenHits = new Map();

    for (const filePath of assetFiles) {
        let matches = new Set();
        try {
            matches = await searchFileForNeedles(filePath, searchNeedles);
        } catch (error) {
            continue;
        }
        for (const needle of mustFind) {
            if (matches.has(needle)) {
                foundMustFind.add(needle);
            }
        }
        for (const needle of optionalFind) {
            if (matches.has(needle)) {
                foundOptional.add(needle);
            }
        }
        for (const needle of mustNotFind) {
            if (matches.has(needle)) {
                const hits = forbiddenHits.get(needle) ?? [];
                hits.push(filePath);
                forbiddenHits.set(needle, hits);
            }
        }
    }

    const missingMustFind = mustFind.filter((needle) => !foundMustFind.has(needle));
    const missingBuildMeta = buildMetaNeedles.every((needle) => missingMustFind.includes(needle));
    const hasForbiddenMissingLabel = forbiddenHits.has('v3:missing');

    if (missingMustFind.length > 0 || hasForbiddenMissingLabel) {
        const failureLines = [
            'Build stamp verification failed.',
            `buildDir: ${buildDir}`,
            `buildMetaPath: ${buildMetaPath}`,
            `expected gitSha: ${gitSha}`,
        ];
        if (missingMustFind.includes(gitSha)) {
            failureLines.push(`- Missing full git SHA in assets (${gitSha}).`);
        }
        if (missingBuildMeta) {
            failureLines.push(`- Missing embedded build_meta gitSha JSON (${gitSha}).`);
        }
        if (hasForbiddenMissingLabel) {
            const hitFiles = forbiddenHits.get('v3:missing') ?? [];
            const maxHits = 5;
            const listed = hitFiles.slice(0, maxHits);
            const remainder = hitFiles.length - listed.length;
            failureLines.push('- Found forbidden v3:missing in assets.');
            if (listed.length > 0) {
                failureLines.push(`  Files: ${listed.join(', ')}${remainder > 0 ? '…' : ''}`);
            }
        }
        throw new Error(failureLines.join('\n'));
    }

    if (optionalFind.length > 0 && foundOptional.size === 0) {
        console.warn(
            `Optional prompt stamp not found (searched for ${optionalFind.join(
                ', '
            )}). This is non-fatal.`
        );
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
