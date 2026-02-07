import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const buildMetaPath = path.join(repoRoot, 'frontend', 'src', 'generated', 'build_meta.json');
const candidateDirs = [
    path.join(repoRoot, 'frontend', 'dist'),
    path.join(repoRoot, 'frontend', '.vercel', 'output', 'static'),
    path.join(repoRoot, 'frontend', '.vercel', 'output'),
    path.join(repoRoot, 'dist'),
];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.html']);

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

const forbiddenMatchers = [
    {
        label: 'v3:missing',
        regex: /v3:missing/,
    },
    {
        label: 'App build SHA followed by missing',
        regex: /App build SHA[\s\S]{0,80}missing/i,
    },
    {
        label: 'App build SHA source followed by missing',
        regex: /App build SHA source[\s\S]{0,80}missing/i,
    },
];

const requiredPromptRegex = /Prompt version: v3:(?!missing)[a-z0-9-]{7,}/i;

const scanAssets = async () => {
    const buildDir = await findBuildDir();
    if (!buildDir) {
        throw new Error(
            `No frontend build output found. Checked: ${candidateDirs.join(', ')}`
        );
    }

    let buildMeta;
    try {
        const rawMeta = await fs.readFile(buildMetaPath, 'utf8');
        buildMeta = JSON.parse(rawMeta);
    } catch (error) {
        throw new Error(`Unable to read build metadata at ${buildMetaPath}: ${error.message}`);
    }

    const gitSha = normalizeSha(buildMeta?.gitSha);
    if (!gitSha || gitSha.toLowerCase() === 'missing') {
        throw new Error(`build_meta.json gitSha is not set: ${gitSha || 'empty'}`);
    }
    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(`No build assets found in ${buildDir}`);
    }

    const forbiddenHits = new Map();
    let foundRequiredStamp = false;

    for (const filePath of assetFiles) {
        let content = '';
        try {
            content = await fs.readFile(filePath, 'utf8');
        } catch (error) {
            continue;
        }

        for (const matcher of forbiddenMatchers) {
            if (matcher.regex.test(content)) {
                const hits = forbiddenHits.get(filePath) ?? [];
                hits.push(matcher.label);
                forbiddenHits.set(filePath, hits);
            }
        }

        if (
            content.includes(gitSha) ||
            content.includes(shortSha) ||
            content.includes(`v3:${shortSha}`) ||
            requiredPromptRegex.test(content)
        ) {
            foundRequiredStamp = true;
        }
    }

    if (!foundRequiredStamp) {
        throw new Error(
            `No build stamp found in assets. Expected SHA ${gitSha} (or ${shortSha}).`
        );
    }

    if (forbiddenHits.size > 0) {
        const details = Array.from(forbiddenHits.entries())
            .map(([file, labels]) => `${path.relative(repoRoot, file)}: ${labels.join(', ')}`)
            .join('\n');
        throw new Error(`Forbidden build stamp markers detected:\n${details}`);
    }
};

scanAssets().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
