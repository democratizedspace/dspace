#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const rawArgs = process.argv.slice(2);
let outDir = 'backups';
const targets = [];
for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === '--out' || arg === '-o') {
        outDir = rawArgs[i + 1] ?? outDir;
        i += 1;
    } else {
        targets.push(arg);
    }
}

const sources = targets.length > 0 ? targets : ['backend', 'frontend'];

const outPath = path.resolve(repoRoot, outDir);
mkdirSync(outPath, { recursive: true });
const relativeOutDir = path.relative(repoRoot, outPath) || '.';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const tarTarget = path.join(relativeOutDir, `backup-${timestamp}.tar.gz`);
const tarSources = sources.map((p) => {
    const relative = path.relative(repoRoot, path.resolve(repoRoot, p));
    return relative || '.';
});

execFileSync('tar', ['-czf', tarTarget, ...tarSources], { cwd: repoRoot, stdio: 'inherit' });
console.log(`Created backup at ${path.join(outPath, path.basename(tarTarget))}`);

