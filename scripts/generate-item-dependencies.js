const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const questsPattern = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'pages',
  'quests',
  'json',
  '**',
  '*.json'
);
const outFile = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'generated',
  'itemQuestMap.json'
);

function addDeps(items, questId, map, key) {
  for (const { id } of items) {
    const list = (map[id] ??= { requires: [], rewards: [] })[key];
    if (!list.includes(questId)) list.push(questId);
  }
}

function collectItemDeps(obj, questId, map) {
  if (Array.isArray(obj)) {
    for (const v of obj) collectItemDeps(v, questId, map);
    return;
  }
  if (!obj || typeof obj !== 'object') return;

  if (obj.requiresItems) addDeps(obj.requiresItems, questId, map, 'requires');
  if (obj.rewards) addDeps(obj.rewards, questId, map, 'rewards');
  for (const v of Object.values(obj)) collectItemDeps(v, questId, map);
}

function buildMap() {
  const map = {};
  for (const file of globSync(questsPattern)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    collectItemDeps(data, data.id, map);
  }
  return map;
}

function main() {
  const map = buildMap();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(map, null, 2));
  console.log('Generated item quest map at', outFile);
}

if (require.main === module) {
  main();
}

module.exports = { buildMap };
