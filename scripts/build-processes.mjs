#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const processesDir = path.join(root, 'frontend/src/pages/processes');
const jsonDir = path.join(processesDir, 'json');
const hardeningDir = path.join(processesDir, 'hardening');

let processes = [];
for (const file of fs.readdirSync(jsonDir)) {
  if (!file.endsWith('.json')) continue;
  const arr = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
  processes = processes.concat(arr);
}

processes.sort((a, b) => a.id.localeCompare(b.id));

for (const proc of processes) {
  const hardeningPath = path.join(hardeningDir, `${proc.id}.json`);
  if (fs.existsSync(hardeningPath)) {
    proc.hardening = JSON.parse(fs.readFileSync(hardeningPath, 'utf8'));
  }
}

fs.writeFileSync(path.join(processesDir, 'processes.json'), JSON.stringify(processes, null, 4) + '\n');
console.log(`Wrote ${processes.length} processes`);
