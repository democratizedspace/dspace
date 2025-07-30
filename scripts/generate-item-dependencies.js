const fs = require('fs');
const path = require('path');
const glob = require('glob');

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

function collectItemDeps(obj, questId, map) {
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectItemDeps(v, questId, map));
    return;
  }
  if (obj && typeof obj === 'object') {
    if (obj.requiresItems) {
      obj.requiresItems.forEach((item) => {
        map[item.id] = map[item.id] || { requires: [], rewards: [] };
        if (!map[item.id].requires.includes(questId)) {
          map[item.id].requires.push(questId);
        }
      });
    }
    if (obj.rewards) {
      obj.rewards.forEach((item) => {
        map[item.id] = map[item.id] || { requires: [], rewards: [] };
        if (!map[item.id].rewards.includes(questId)) {
          map[item.id].rewards.push(questId);
        }
      });
    }
    Object.values(obj).forEach((v) => collectItemDeps(v, questId, map));
  }
}

function buildMap() {
  const files = glob.sync(questsPattern);
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
