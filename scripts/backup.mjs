#!/usr/bin/env node
import { execSync } from 'node:child_process';
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

const outPath = path.resolve(outDir);
mkdirSync(outPath, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(outPath, `backup-${timestamp}.tar.gz`);
const args = sources.map((p) => `'${p}'`).join(' ');
execSync(`tar -czf '${file}' ${args}`, { stdio: 'inherit' });
console.log(`Created backup at ${file}`);

