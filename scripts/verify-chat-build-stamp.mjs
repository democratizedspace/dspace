import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend/src/generated/build_meta.json');

const normalizeValue = (value) => String(value || '').trim();

const isPlaceholderSha = (value) => {
    const normalized = normalizeValue(value).toLowerCase();
    return (
        !normalized ||
        normalized === 'unknown' ||
        normalized === 'missing' ||
        normalized === 'missing-sha' ||
        normalized === 'dev-local'
    );
};

const isPlaceholderSource = (value) => {
    const normalized = normalizeValue(value).toLowerCase();
    return !normalized || normalized === 'unknown' || normalized === 'static' || normalized === 'missing';
};

const resolveDistDir = async () => {
    const candidates = [
        path.join(repoRoot, 'frontend/dist'),
        path.join(repoRoot, 'frontend/.vercel/output/static'),
        path.join(repoRoot, 'frontend/.vercel/output'),
        path.join(repoRoot, 'dist'),
    ];

    for (const candidate of candidates) {
        try {
            const stat = await fs.stat(candidate);
            if (stat.isDirectory()) {
                return candidate;
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error(`No build output directory found. Checked: ${candidates.join(', ')}`);
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
            await walkFiles(entryPath, results);
        } else {
            results.push(entryPath);
        }
    }
    return results;
};

const forbiddenChecks = [
    {
        label: 'v3:missing',
        pattern: /v3:missing/,
    },
    {
        label: 'App build SHA missing',
        pattern: /App build SHA(?:\s*[:\n]\s*)missing/i,
    },
    {
        label: 'App build SHA source missing',
        pattern: /App build SHA source(?:\s*[:\n]\s*)missing/i,
    },
];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.map']);

export const verifyChatBuildStamp = async () => {
    const rawMeta = await fs.readFile(buildMetaPath, 'utf-8');
    const buildMeta = JSON.parse(rawMeta);
    const gitSha = normalizeValue(buildMeta?.gitSha);
    const generatedAt = normalizeValue(buildMeta?.generatedAt);
    const source = normalizeValue(buildMeta?.source);

    if (isPlaceholderSha(gitSha)) {
        throw new Error(`build_meta.json gitSha is not set: ${gitSha || 'empty'}`);
    }
    if (!generatedAt) {
        throw new Error('build_meta.json generatedAt is not set');
    }
    if (isPlaceholderSource(source)) {
        throw new Error(`build_meta.json source is not set: ${source || 'empty'}`);
    }

    const distDir = await resolveDistDir();
    const files = await walkFiles(distDir);
    if (!files.length) {
        throw new Error(`No build assets found in ${distDir}`);
    }

    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;
    const expectedTokens = [gitSha, `v3:${shortSha}`];
    const forbiddenHits = new Map();
    let foundStamp = false;

    for (const filePath of files) {
        const ext = path.extname(filePath);
        if (!allowedExtensions.has(ext)) {
            continue;
        }
        let content;
        try {
            content = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            continue;
        }

        if (!foundStamp && expectedTokens.some((token) => content.includes(token))) {
            foundStamp = true;
        }

        for (const check of forbiddenChecks) {
            if (check.pattern.test(content)) {
                if (!forbiddenHits.has(check.label)) {
                    forbiddenHits.set(check.label, []);
                }
                forbiddenHits.get(check.label).push(filePath);
            }
        }
    }

    if (!foundStamp) {
        throw new Error(
            `Build assets missing expected stamp tokens (${expectedTokens.join(', ')}) in ${distDir}`
        );
    }

    if (forbiddenHits.size > 0) {
        const details = Array.from(forbiddenHits.entries())
            .map(([label, filesWithHits]) => `${label}:\n  ${filesWithHits.join('\n  ')}`)
            .join('\n');
        throw new Error(`Build assets contain forbidden chat stamp values:\n${details}`);
    }
};

if (process.argv[1] === __filename) {
    verifyChatBuildStamp().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
