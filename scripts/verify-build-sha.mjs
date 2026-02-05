import fs from 'fs';
import path from 'path';

const normalize = (value) => String(value || '').trim();
const resolveSha = () => {
    const viteSha = normalize(process.env.VITE_GIT_SHA);
    if (viteSha) {
        return viteSha;
    }
    return normalize(process.env.GIT_SHA);
};

const buildSha = resolveSha();
if (!buildSha) {
    console.error('verify-build-sha: missing VITE_GIT_SHA/GIT_SHA in environment.');
    process.exit(1);
}

const shortSha = buildSha.length > 7 ? buildSha.slice(0, 7) : buildSha;
const expectedTokens = Array.from(
    new Set([buildSha, shortSha, `v3:${shortSha}`].filter((token) => token))
);

const outputDirs = normalize(process.env.BUILD_OUTPUT_DIRS)
    ? normalize(process.env.BUILD_OUTPUT_DIRS)
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
    : [path.join(process.cwd(), 'frontend', 'dist')];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.map']);
const forbiddenMarker = 'v3:missing';

let foundExpected = false;
let foundForbidden = false;
const scannedFiles = [];

const scanFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        scannedFiles.push(filePath);
        if (!foundExpected && expectedTokens.some((token) => content.includes(token))) {
            foundExpected = true;
        }
        if (!foundForbidden && content.includes(forbiddenMarker)) {
            foundForbidden = true;
        }
    } catch (error) {
        console.warn(`verify-build-sha: unable to read ${filePath}: ${error.message}`);
    }
};

for (const outputDir of outputDirs) {
    if (!fs.existsSync(outputDir)) {
        console.error(`verify-build-sha: build output directory missing: ${outputDir}`);
        process.exit(1);
    }

    const stack = [outputDir];
    while (stack.length) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (!entry.isFile()) {
                continue;
            }
            if (!allowedExtensions.has(path.extname(fullPath))) {
                continue;
            }
            scanFile(fullPath);
        }
    }
}

if (foundForbidden) {
    console.error(`verify-build-sha: forbidden marker "${forbiddenMarker}" found in bundle.`);
    process.exit(1);
}

if (!foundExpected) {
    console.error(
        `verify-build-sha: expected SHA token not found in bundle. Tried: ${expectedTokens.join(
            ', '
        )}`
    );
    console.error(`verify-build-sha: scanned ${scannedFiles.length} files.`);
    process.exit(1);
}

console.log(
    `verify-build-sha: found build SHA token (${expectedTokens.join(', ')}) in bundle.`
);
