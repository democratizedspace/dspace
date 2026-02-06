import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'frontend', 'dist');
const buildMetaPath = path.join(repoRoot, 'frontend', 'src', 'generated', 'build_meta.json');

const readBuildMeta = async () => {
    const raw = await fs.readFile(buildMetaPath, 'utf-8');
    const meta = JSON.parse(raw);
    return {
        gitSha: String(meta?.gitSha || '').trim(),
    };
};

const isPlaceholderSha = (value) => {
    if (!value) {
        return true;
    }
    const lower = value.toLowerCase();
    return (
        lower === 'unknown' ||
        lower === 'dev-local' ||
        lower === 'missing' ||
        lower === 'missing-sha'
    );
};

const collectFiles = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(fullPath)));
        } else {
            files.push(fullPath);
        }
    }
    return files;
};

const shouldScan = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return ['.js', '.mjs', '.cjs', '.html', '.css', '.json', '.map', '.txt'].includes(ext);
};

const main = async () => {
    const { gitSha } = await readBuildMeta();
    if (isPlaceholderSha(gitSha)) {
        throw new Error(`build_meta.json gitSha is not set (got "${gitSha || 'empty'}").`);
    }
    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;

    const files = await collectFiles(distDir);
    if (!files.length) {
        throw new Error(`No build artifacts found in ${distDir}.`);
    }

    let sawMissingPrompt = false;
    let sawExpectedSha = false;

    for (const filePath of files) {
        if (!shouldScan(filePath)) {
            continue;
        }
        const contents = await fs.readFile(filePath, 'utf-8');
        if (contents.includes('v3:missing')) {
            sawMissingPrompt = true;
        }
        if (contents.includes(gitSha) || contents.includes(`v3:${shortSha}`)) {
            sawExpectedSha = true;
        }
    }

    if (sawMissingPrompt) {
        throw new Error('Build artifacts still include v3:missing.');
    }
    if (!sawExpectedSha) {
        throw new Error(`Build artifacts do not include ${gitSha} or v3:${shortSha}.`);
    }

    console.log('Verified build stamp in frontend/dist artifacts.');
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
