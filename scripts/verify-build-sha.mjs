import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const expectedSha = String(process.env.EXPECTED_SHA || process.env.GIT_SHA || '').trim();

if (!expectedSha) {
    console.error('Expected SHA is required. Set EXPECTED_SHA or GIT_SHA.');
    process.exit(1);
}

const shortSha = expectedSha.length > 7 ? expectedSha.slice(0, 7) : expectedSha;
const targets = [expectedSha, shortSha, `v3:${shortSha}`].filter(Boolean);
const forbidden = ['v3:missing'];
const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.css', '.html']);

const candidateDirs =
    args.length > 0 ? args : ['/app/dist', '/workspace/frontend/dist', 'frontend/dist', 'dist'];
const existingDirs = candidateDirs.filter((dir) => fs.existsSync(dir));

if (existingDirs.length === 0) {
    console.error(`No dist directories found. Checked: ${candidateDirs.join(', ')}`);
    process.exit(1);
}

const stack = [...existingDirs];
let foundTarget = false;
const forbiddenHits = new Set();

while (stack.length) {
    const current = stack.pop();
    if (!current) {
        continue;
    }
    let entries = [];
    try {
        entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
        continue;
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
        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!foundTarget && targets.some((target) => content.includes(target))) {
                foundTarget = true;
            }
            for (const forbiddenValue of forbidden) {
                if (content.includes(forbiddenValue)) {
                    forbiddenHits.add(forbiddenValue);
                }
            }
        } catch (error) {
            continue;
        }
    }
}

if (!foundTarget) {
    console.error(
        `Expected build SHA not found in frontend bundle. Looked for: ${targets.join(', ')}`
    );
    process.exit(1);
}

if (forbiddenHits.size > 0) {
    console.error(
        `Forbidden build SHA markers found in frontend bundle: ${Array.from(forbiddenHits).join(
            ', '
        )}`
    );
    process.exit(1);
}

console.log(`Build SHA verified in frontend bundle. Matched: ${targets.join(', ')}`);
