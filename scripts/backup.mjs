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

const resolvedOutDir = path.isAbsolute(outDir)
        ? outDir
        : path.join(repoRoot, outDir);
mkdirSync(resolvedOutDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const archiveName = `backup-${timestamp}.tar.gz`;
const archiveRelative = path.relative(repoRoot, path.join(resolvedOutDir, archiveName));

execFileSync('tar', ['-czf', archiveRelative, ...sources], {
        cwd: repoRoot,
        stdio: 'inherit'
});

console.log(`Created backup at ${path.join(resolvedOutDir, archiveName)}`);

