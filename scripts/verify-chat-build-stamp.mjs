import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');

const normalize = (value) => String(value ?? '').trim();

const isPlaceholder = (value) => {
    const normalized = normalize(value).toLowerCase();
    return !normalized || normalized === 'unknown' || normalized === 'missing' || normalized === 'missing-sha';
};

const walkFiles = async (dir, results = []) => {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
        return results;
    }

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules') {
                continue;
            }
            await walkFiles(entryPath, results);
        } else {
            results.push(entryPath);
        }
    }

    return results;
};

const findBuildRoot = async () => {
    const candidates = [
        path.join(repoRoot, 'frontend', 'dist'),
        path.join(repoRoot, 'frontend', '.vercel', 'output', 'static'),
        path.join(repoRoot, 'frontend', '.vercel', 'output'),
        path.join(repoRoot, 'dist'),
    ];

    for (const candidate of candidates) {
        try {
            const stats = await fs.stat(candidate);
            if (!stats.isDirectory()) {
                continue;
            }
            return candidate;
        } catch (error) {
            // Ignore missing paths and continue.
        }
    }

    return null;
};

const readBuildMeta = async () => {
    const raw = await fs.readFile(buildMetaPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
};

export const verifyChatBuildStamp = async () => {
    const buildRoot = await findBuildRoot();
    if (!buildRoot) {
        throw new Error(
            'No built frontend output directory found. Expected frontend/dist or frontend/.vercel/output.'
        );
    }

    const buildMeta = await readBuildMeta();
    const gitSha = normalize(buildMeta?.gitSha);
    if (isPlaceholder(gitSha)) {
        throw new Error(`build_meta.json gitSha is not set: ${gitSha || 'empty'}`);
    }

    const shortSha = gitSha.length >= 7 ? gitSha.slice(0, 7) : gitSha;

    const files = await walkFiles(buildRoot);
    if (!files.length) {
        throw new Error(`No build assets found under ${buildRoot}`);
    }

    const allowedExtensions = new Set(['.js', '.mjs', '.html']);
    const forbiddenPatterns = [
        { label: 'Prompt version missing (v3:missing)', regex: /v3:missing/ },
        {
            label: 'App build SHA missing',
            regex: /App build SHA[\s:\n]*missing/i,
        },
        {
            label: 'App build SHA source missing',
            regex: /App build SHA source[\s:\n]*missing/i,
        },
    ];

    const requiredPatterns = [
        {
            label: `Full build SHA (${gitSha})`,
            regex: new RegExp(gitSha, 'i'),
        },
        {
            label: `Prompt version contains build SHA (${shortSha})`,
            regex: new RegExp(`v3:${shortSha}`, 'i'),
        },
        {
            label: 'Prompt version contains a non-placeholder SHA',
            regex: /v3:(?!missing\b)(?!dev-local\b)[a-f0-9]{7,}/i,
        },
    ];

    const forbiddenMatches = new Map();
    let requiredFound = false;

    for (const filePath of files) {
        const ext = path.extname(filePath);
        if (!allowedExtensions.has(ext)) {
            continue;
        }

        const contents = await fs.readFile(filePath, 'utf-8');

        for (const pattern of forbiddenPatterns) {
            if (pattern.regex.test(contents)) {
                const entries = forbiddenMatches.get(pattern.label) || [];
                entries.push(filePath);
                forbiddenMatches.set(pattern.label, entries);
            }
        }

        if (!requiredFound) {
            requiredFound = requiredPatterns.some((pattern) => pattern.regex.test(contents));
        }
    }

    if (forbiddenMatches.size > 0) {
        const details = Array.from(forbiddenMatches.entries())
            .map(([label, entries]) => {
                const list = entries.map((entry) => `  - ${entry}`).join('\n');
                return `${label}:\n${list}`;
            })
            .join('\n');
        throw new Error(`Detected missing chat build stamps in assets:\n${details}`);
    }

    if (!requiredFound) {
        throw new Error(
            `No non-placeholder prompt version stamp found in assets (expected v3:${shortSha} or another SHA).`
        );
    }

    return true;
};

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify-chat-build-stamp.mjs')) {
    verifyChatBuildStamp().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
