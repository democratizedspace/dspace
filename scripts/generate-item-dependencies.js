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
  for (const item of items) {
    const entry = map[item.id] || (map[item.id] = { requires: [], rewards: [] });
    const list = entry[key];
    if (!list.includes(questId)) list.push(questId);
  }
}

function collectItemDeps(obj, questId, map) {
  if (Array.isArray(obj)) {
    for (const v of obj) collectItemDeps(v, questId, map);
    return;
  }
  if (obj && typeof obj === 'object') {
    if (obj.requiresItems) addDeps(obj.requiresItems, questId, map, 'requires');
    if (obj.rewards) addDeps(obj.rewards, questId, map, 'rewards');
    for (const v of Object.values(obj)) collectItemDeps(v, questId, map);
  }
}

function buildMap() {
  const files = globSync(questsPattern);
  const map = {};
  files.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const questId = data.id;
    collectItemDeps(data, questId, map);
  });
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
