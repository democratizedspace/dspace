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

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(`No build assets found in ${buildDir}`);
    }

    const mustFind = [gitSha];
    const mustNotFind = ['v3:missing'];
    const optionalFind = [promptLabel, 'Prompt version: v3:'];
    const allNeedles = [...mustFind, ...mustNotFind, ...optionalFind, ...buildMetaNeedles];
    let foundFullSha = false;
    let foundMissingLabel = false;
    let foundBuildMetaJson = false;
    const optionalMatches = new Set();
    const forbiddenFiles = new Map();
    const maxReportedFiles = 5;

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
        if (matches.has('v3:missing')) {
            foundMissingLabel = true;
            if (!forbiddenFiles.has('v3:missing')) {
                forbiddenFiles.set('v3:missing', []);
            }
            const files = forbiddenFiles.get('v3:missing');
            if (files.length < maxReportedFiles) {
                files.push(filePath);
            }
        }
        if (!foundBuildMetaJson && buildMetaNeedles.some((needle) => matches.has(needle))) {
            foundBuildMetaJson = true;
        }
        for (const needle of optionalFind) {
            if (matches.has(needle)) {
                optionalMatches.add(needle);
            }
        }
    }

    const failures = [];
    if (!foundFullSha) {
        failures.push('Missing full git SHA in build assets.');
    }
    if (!foundBuildMetaJson) {
        failures.push('Missing embedded build_meta.json gitSha in build assets.');
    }
    if (foundMissingLabel) {
        failures.push('Found forbidden prompt label v3:missing in build assets.');
    }

    if (failures.length > 0) {
        const details = [
            'Chat build stamp verification failed.',
            `buildDir: ${buildDir}`,
            `buildMetaPath: ${buildMetaPath}`,
            `expected gitSha: ${gitSha}`,
            'Failures:',
            ...failures.map((failure) => `- ${failure}`),
        ];
        if (forbiddenFiles.size > 0) {
            for (const [needle, files] of forbiddenFiles.entries()) {
                details.push(`Forbidden needle "${needle}" found in:`);
                details.push(...files.map((file) => `- ${file}`));
            }
        }
        throw new Error(details.join('\n'));
    }

    const optionalList =
        optionalMatches.size > 0 ? Array.from(optionalMatches).join(', ') : 'none';
    console.log(`Optional prompt markers found: ${optionalList}`);
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
