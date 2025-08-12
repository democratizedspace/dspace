import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const itemsDir = path.join(root, 'frontend/src/pages/inventory/json/items');
const processesDir = path.join(root, 'frontend/src/pages/processes/json');
const questsDir = path.join(root, 'frontend/src/pages/quests/json');

const idMapPath = path.join(root, 'scripts', 'item-id-map.json');

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 4));
}

function generateMapping(items) {
  const map = {};
  for (const item of items) {
    const newId = randomUUID();
    map[item.id] = newId;
    item.id = newId;
  }
  return map;
}

function replaceIds(data, map) {
  let modified = false;
  if (Array.isArray(data)) {
    for (const item of data) {
      if (replaceIds(item, map)) modified = true;
    }
  } else if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' && typeof value === 'string' && map[value]) {
        data[key] = map[value];
        modified = true;
      } else if (replaceIds(value, map)) {
        modified = true;
      }
    }
  }
  return modified;
}

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else if (entry.name.endsWith('.json')) callback(full);
  }
}

const itemFiles = fs.readdirSync(itemsDir).filter((f) => f.endsWith('.json'));
const items = [];
const fileItems = {};
for (const file of itemFiles) {
  const arr = loadJSON(path.join(itemsDir, file));
  fileItems[file] = arr;
  items.push(...arr);
}

const idMap = generateMapping(items);
for (const file of itemFiles) {
  saveJSON(path.join(itemsDir, file), fileItems[file]);
}
saveJSON(idMapPath, idMap);

for (const file of fs.readdirSync(processesDir).filter((f) => f.endsWith('.json'))) {
  const full = path.join(processesDir, file);
  const data = loadJSON(full);
  replaceIds(data, idMap);
  saveJSON(full, data);
}

walk(questsDir, (file) => {
  const data = loadJSON(file);
  const changed = replaceIds(data, idMap);
  if (changed) saveJSON(file, data);
});

console.log(`Migrated ${Object.keys(idMap).length} item IDs`);
