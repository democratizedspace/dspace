import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const distPaths = [];
for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--dist') {
        const value = args[i + 1];
        if (value) {
            distPaths.push(value);
            i += 1;
        }
    }
}

const expectedSha =
    process.env.EXPECTED_SHA || process.env.VITE_GIT_SHA || process.env.GIT_SHA || '';
const normalizedExpected = expectedSha.trim();
const shortSha = normalizedExpected ? normalizedExpected.slice(0, 7) : '';

if (!normalizedExpected) {
    console.error('Expected SHA is missing; set EXPECTED_SHA or VITE_GIT_SHA.');
    process.exit(1);
}

const targets = new Set(
    [normalizedExpected, shortSha, shortSha ? `v3:${shortSha}` : ''].filter(Boolean)
);
const forbidden = new Set(['v3:missing']);

const extensions = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.map']);
const resolvedDistPaths = (distPaths.length ? distPaths : ['frontend/dist', 'dist']).map(
    (entry) => path.resolve(entry)
);

const existingRoots = resolvedDistPaths.filter((entry) => fs.existsSync(entry));
if (existingRoots.length === 0) {
    console.error(
        `No dist directories found. Checked: ${resolvedDistPaths.join(', ')}`
    );
    process.exit(1);
}

let matched = false;
let checkedFiles = 0;
let forbiddenFound = null;

const shouldScan = (filePath) => extensions.has(path.extname(filePath));

const walk = (root) => {
    const stack = [root];
    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        let entries;
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
            if (!entry.isFile() || !shouldScan(fullPath)) {
                continue;
            }
            checkedFiles += 1;
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                for (const forbiddenValue of forbidden) {
                    if (content.includes(forbiddenValue)) {
                        forbiddenFound = { value: forbiddenValue, filePath: fullPath };
                        return;
                    }
                }
                if (!matched) {
                    for (const target of targets) {
                        if (content.includes(target)) {
                            matched = true;
                            break;
                        }
                    }
                }
            } catch (error) {
                continue;
            }
            if (forbiddenFound) {
                return;
            }
        }
    }
};

for (const root of existingRoots) {
    walk(root);
    if (forbiddenFound) {
        break;
    }
}

if (forbiddenFound) {
    console.error(
        `Forbidden prompt version string "${forbiddenFound.value}" found in ${forbiddenFound.filePath}.`
    );
    process.exit(1);
}

if (!matched) {
    console.error(
        `Expected SHA not found in build output. Checked ${checkedFiles} files under ${existingRoots.join(
            ', '
        )}. Looked for: ${[...targets].join(', ')}`
    );
    process.exit(1);
}

console.log(
    `Verified build output contains ${[...targets].join(', ')} and excludes v3:missing.`
);
