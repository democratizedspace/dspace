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
        throw new Error(
            [
                'build_meta.json is invalid.',
                `buildDir: ${buildDir}`,
                `repoRoot: ${repoRoot}`,
                `buildMetaPath: ${buildMetaPath}`,
                `error: ${error.message}`,
            ].join('\n')
        );
    }

    const gitSha = normalizeSha(buildMeta?.gitSha);
    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;
    const promptLabel = `v3:${shortSha}`;

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(`No build assets found in ${buildDir}`);
    }

    const mustFindNeedles = [gitSha];
    const buildMetaNeedles = [`"gitSha":"${gitSha}"`, `"gitSha": "${gitSha}"`];
    const mustNotFindNeedles = ['v3:missing'];
    const optionalNeedles = [promptLabel, 'Prompt version: v3:'];
    const allNeedles = [
        ...mustFindNeedles,
        ...buildMetaNeedles,
        ...mustNotFindNeedles,
        ...optionalNeedles,
    ];
    let foundFullSha = false;
    let foundBuildMeta = false;
    let foundMissingLabel = false;
    let foundOptionalNeedle = false;
    const forbiddenHits = new Map();

    for (const filePath of assetFiles) {
        let matches = new Set();
        try {
            matches = await searchFileForNeedles(filePath, allNeedles);
        } catch (error) {
            continue;
        }

        if (matches.has(gitSha)) {
            foundFullSha = true;
        }
        if (buildMetaNeedles.some((needle) => matches.has(needle))) {
            foundBuildMeta = true;
        }
        if (optionalNeedles.some((needle) => matches.has(needle))) {
            foundOptionalNeedle = true;
        }
        if (matches.has('v3:missing')) {
            foundMissingLabel = true;
            const hitList = forbiddenHits.get('v3:missing') ?? [];
            if (hitList.length < 5) {
                hitList.push(filePath);
            }
            forbiddenHits.set('v3:missing', hitList);
        }
    }

    if (!foundFullSha) {
        throw new Error(
            [
                'Missing required build SHA in assets.',
                `buildDir: ${buildDir}`,
                `repoRoot: ${repoRoot}`,
                `buildMetaPath: ${buildMetaPath}`,
                `expected gitSha: ${gitSha}`,
                'invariant: full git SHA not found in build output',
            ].join('\n')
        );
    }

    if (!foundBuildMeta) {
        throw new Error(
            [
                'Missing embedded build_meta.json payload in assets.',
                `buildDir: ${buildDir}`,
                `repoRoot: ${repoRoot}`,
                `buildMetaPath: ${buildMetaPath}`,
                `expected gitSha: ${gitSha}`,
                'invariant: build_meta.json gitSha not found in build output',
            ].join('\n')
        );
    }

    if (foundMissingLabel) {
        const hitFiles = forbiddenHits.get('v3:missing') ?? [];
        const hitList = hitFiles.length ? `\nfiles:\n- ${hitFiles.join('\n- ')}` : '';
        throw new Error(
            [
                'Build assets contain v3:missing.',
                `buildDir: ${buildDir}`,
                `repoRoot: ${repoRoot}`,
                `buildMetaPath: ${buildMetaPath}`,
                `expected gitSha: ${gitSha}`,
                `invariant: forbidden marker found${hitList}`,
            ].join('\n')
        );
    }

    if (!foundOptionalNeedle) {
        console.warn(
            [
                'Optional prompt version label not found in assets.',
                `buildDir: ${buildDir}`,
                `expected prompt label: ${promptLabel}`,
                'This is informational; prompt label may be computed at runtime.',
            ].join('\n')
        );
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
