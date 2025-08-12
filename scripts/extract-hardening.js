#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const hardeningDir = path.join(repoRoot, 'hardening');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(hardeningDir);

function extractFromItems() {
  const dir = path.join(repoRoot, 'frontend/src/pages/inventory/json/items');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const result = {};
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    for (const item of data) {
      if (item.hardening) {
        result[item.id] = item.hardening;
        delete item.hardening;
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
    }
  }
  fs.writeFileSync(
    path.join(hardeningDir, 'items.json'),
    JSON.stringify(result, null, 4) + '\n'
  );
}

function extractFromQuests() {
  const dir = path.join(repoRoot, 'frontend/src/pages/quests/json');
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? fs.readdirSync(path.join(dir, entry.name)).map((f) => path.join(entry.name, f)) : [entry.name]
    )
    .filter((f) => f.endsWith('.json'));
  const result = {};
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.hardening) {
      result[data.id] = data.hardening;
      delete data.hardening;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
    }
  }
  fs.writeFileSync(
    path.join(hardeningDir, 'quests.json'),
    JSON.stringify(result, null, 4) + '\n'
  );
}

function extractFromProcesses() {
  const dir = path.join(repoRoot, 'frontend/src/pages/processes/json');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const result = {};
  for (const file of files) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    for (const proc of data) {
      if (proc.hardening) {
        result[proc.id] = proc.hardening;
        delete proc.hardening;
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n');
    }
  }
  fs.writeFileSync(
    path.join(hardeningDir, 'processes.json'),
    JSON.stringify(result, null, 4) + '\n'
  );
}

extractFromItems();
extractFromQuests();
extractFromProcesses();

