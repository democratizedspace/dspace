import fs from 'fs';
import path from 'path';

const [distArg, shaArg] = process.argv.slice(2);
const distRoot = distArg || process.env.DIST_DIR || '/app/dist';
const expectedSha =
    shaArg || process.env.EXPECTED_SHA || process.env.GITHUB_SHA || process.env.VITE_GIT_SHA;

if (!expectedSha) {
    console.error('No expected SHA provided via args or environment.');
    process.exit(1);
}

const normalizedSha = String(expectedSha).trim();
if (!normalizedSha) {
    console.error('Expected SHA is empty after normalization.');
    process.exit(1);
}

const shortSha = normalizedSha.slice(0, 7);
const targets = [normalizedSha, shortSha, `v3:${shortSha}`];
const forbidden = ['v3:missing', 'v3:dev-local'];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.css', '.html']);
const stack = [distRoot];
const seen = new Set();
let foundTarget = false;
let foundForbidden = false;
const forbiddenHits = [];

while (stack.length > 0) {
    const current = stack.pop();
    if (seen.has(current)) {
        continue;
    }
    seen.add(current);

    let entries;
    try {
        entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
        console.error(`Unable to read directory: ${current}`);
        console.error(error?.message || error);
        process.exit(1);
    }

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

        let content;
        try {
            content = fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            console.warn(`Skipping unreadable file: ${fullPath}`);
            continue;
        }

        if (!foundTarget && targets.some((target) => content.includes(target))) {
            foundTarget = true;
        }

        for (const marker of forbidden) {
            if (content.includes(marker)) {
                foundForbidden = true;
                forbiddenHits.push({ marker, file: fullPath });
            }
        }
    }
}

if (!foundTarget) {
    console.error(
        `Expected build SHA not found in ${distRoot}. Looked for: ${targets.join(', ')}.`
    );
    process.exit(1);
}

if (foundForbidden) {
    console.error('Found forbidden prompt markers in build output:');
    for (const hit of forbiddenHits) {
        console.error(`- ${hit.marker} in ${hit.file}`);
    }
    process.exit(1);
}

console.log(`Build SHA verified in ${distRoot}.`);
