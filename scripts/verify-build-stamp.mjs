import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'frontend', 'dist');
const buildMetaPath = path.join(repoRoot, 'frontend', 'src', 'generated', 'build_meta.json');

const isPlaceholderSha = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return !normalized || ['missing', 'missing-sha', 'unknown', 'dev-local'].includes(normalized);
};

const collectFiles = async (rootDir) => {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const entryPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(entryPath)));
        } else {
            files.push(entryPath);
        }
    }
    return files;
};

const run = async () => {
    try {
        await fs.access(distRoot);
    } catch (error) {
        throw new Error(`Build output not found at ${distRoot}. Run the build first.`);
    }

    const buildMetaRaw = await fs.readFile(buildMetaPath, 'utf-8');
    const buildMeta = JSON.parse(buildMetaRaw);
    const gitSha = String(buildMeta?.gitSha || '').trim();
    if (isPlaceholderSha(gitSha)) {
        throw new Error(`build_meta gitSha is missing or placeholder: "${gitSha}"`);
    }
    const shortSha = gitSha.slice(0, 7);
    const expectedPromptStamp = `v3:${shortSha}`;

    const files = await collectFiles(distRoot);
    const textFiles = files.filter((file) =>
        ['.js', '.mjs', '.cjs', '.html', '.css'].includes(path.extname(file))
    );

    let foundMissingStamp = null;
    let hasPromptStamp = false;
    let hasFullSha = false;

    for (const file of textFiles) {
        const content = await fs.readFile(file, 'utf-8');
        if (!foundMissingStamp && content.includes('v3:missing')) {
            foundMissingStamp = file;
        }
        if (!hasPromptStamp && content.includes(expectedPromptStamp)) {
            hasPromptStamp = true;
        }
        if (!hasFullSha && content.includes(gitSha)) {
            hasFullSha = true;
        }
        if (foundMissingStamp && hasPromptStamp) {
            break;
        }
    }

    if (foundMissingStamp) {
        throw new Error(`Found "v3:missing" in built assets (${foundMissingStamp}).`);
    }

    if (!hasPromptStamp && !hasFullSha) {
        throw new Error(
            `Build stamp missing. Expected "${expectedPromptStamp}" or "${gitSha}" in built assets.`
        );
    }

    console.log(
        `Build stamp verified (prompt: ${expectedPromptStamp}, sha: ${gitSha}).`
    );
};

run().catch((error) => {
    console.error('Build stamp verification failed.', error);
    process.exit(1);
});
