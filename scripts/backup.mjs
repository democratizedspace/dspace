#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

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
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const relativeOutPath = path.relative(repoRoot, outPath) || '.';
const file = path.join(relativeOutPath, `backup-${timestamp}.tar.gz`);
const normalizedSources = sources.map((source) => {
    const absolute = path.resolve(repoRoot, source);
    const relative = path.relative(repoRoot, absolute);
    return relative || '.';
});
execFileSync('tar', ['-czf', file, ...normalizedSources], { stdio: 'inherit', cwd: repoRoot });
console.log(`Created backup at ${path.resolve(repoRoot, file)}`);

