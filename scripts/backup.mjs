#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);
const sources = targets.length > 0 ? targets : ['backend', 'frontend'];

const outDir = path.resolve('backups');
mkdirSync(outDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(outDir, `backup-${timestamp}.tar.gz`);
const args = sources.map((p) => `'${p}'`).join(' ');
execSync(`tar -czf '${file}' ${args}`, { stdio: 'inherit' });
console.log(`Created backup at ${file}`);

