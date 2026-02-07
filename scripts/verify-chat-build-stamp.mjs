import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const candidateBuildDirs = [
    path.join(repoRoot, 'frontend', 'dist'),
    path.join(repoRoot, 'frontend', '.vercel', 'output', 'static'),
    path.join(repoRoot, 'frontend', '.vercel', 'output'),
];

const buildDir = candidateBuildDirs.find((dir) => {
    try {
        return globSync('**/*', { cwd: dir, nodir: true, dot: true }).length > 0;
    } catch {
        return false;
    }
});

if (!buildDir) {
    throw new Error(
        `Chat build stamp check failed: no build output found in ${candidateBuildDirs.join(', ')}`
    );
}

const assetFiles = globSync('**/*.{js,mjs,cjs,html}', { cwd: buildDir, nodir: true, dot: true });

if (!assetFiles.length) {
    throw new Error(`Chat build stamp check failed: no JS/HTML assets found in ${buildDir}`);
}

const forbiddenPatterns = [
    {
        label: 'Prompt version missing',
        regex: /v3:missing/i,
    },
    {
        label: 'App build SHA missing',
        regex: /App build SHA[\s\S]{0,40}missing/i,
    },
    {
        label: 'App build SHA source missing',
        regex: /App build SHA source[\s\S]{0,40}missing/i,
    },
];

const stampPatterns = [
    /v3:(?!missing|dev-local)[a-z0-9-]{3,}/i,
    /\b[a-f0-9]{7,}\b/i,
];

const issues = [];
let foundStamp = false;

for (const relativePath of assetFiles) {
    const filePath = path.join(buildDir, relativePath);
    const contents = await fs.readFile(filePath, 'utf8');

    for (const pattern of forbiddenPatterns) {
        if (pattern.regex.test(contents)) {
            issues.push(`${relativePath}: ${pattern.label}`);
        }
    }

    if (!foundStamp && stampPatterns.some((regex) => regex.test(contents))) {
        foundStamp = true;
    }
}

if (issues.length) {
    const message = [
        'Chat build stamp check failed: missing build metadata found in assets:',
        ...issues.map((issue) => `- ${issue}`),
    ].join('\n');
    throw new Error(message);
}

if (!foundStamp) {
    throw new Error(
        'Chat build stamp check failed: no non-missing prompt/app stamp found in build assets.'
    );
}
