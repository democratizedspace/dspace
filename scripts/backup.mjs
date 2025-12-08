#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

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

const cwd = process.cwd();
const outPath = path.resolve(cwd, outDir);
mkdirSync(outPath, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const absoluteFile = path.join(outPath, `backup-${timestamp}.tar.gz`);
const relativeFile = path.relative(cwd, absoluteFile) || `.${path.sep}${path.basename(absoluteFile)}`;
execFileSync('tar', ['-czf', relativeFile, ...sources], { cwd, stdio: 'inherit' });
console.log(`Created backup at ${absoluteFile}`);

