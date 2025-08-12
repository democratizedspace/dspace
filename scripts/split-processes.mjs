#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const processesPath = path.join(root, 'frontend/src/pages/processes/processes.json');
const processes = JSON.parse(fs.readFileSync(processesPath, 'utf8'));

const jsonDir = path.join(root, 'frontend/src/pages/processes/json');
const hardeningDir = path.join(root, 'frontend/src/pages/processes/hardening');
fs.mkdirSync(jsonDir, { recursive: true });
fs.mkdirSync(hardeningDir, { recursive: true });

const categories = {};
for (const proc of processes) {
  const { id, hardening, ...rest } = proc;
  const category = id.split('-')[0];
  if (!categories[category]) categories[category] = [];
  categories[category].push({ id, ...rest });
  if (hardening) {
    fs.writeFileSync(path.join(hardeningDir, `${id}.json`), JSON.stringify(hardening, null, 4) + '\n');
  }
}

for (const [cat, list] of Object.entries(categories)) {
  list.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(jsonDir, `${cat}.json`), JSON.stringify(list, null, 4) + '\n');
}
