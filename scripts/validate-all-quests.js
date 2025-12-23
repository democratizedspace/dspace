#!/usr/bin/env node
const { globSync } = require('glob');
const path = require('path');
const validateQuest = require('./validate-quest');

function collectQuestIds(files) {
  return new Set(
    files.map((file) => {
      const quest = require(path.resolve(file));
      return quest.id;
    })
  );
}

function main() {
  const questFiles = globSync('frontend/src/pages/quests/{json,templates}/**/*.json');
  const questIds = collectQuestIds(questFiles);
  let allValid = true;
  questFiles.forEach((file) => {
    const ok = validateQuest(path.resolve(file), { knownQuestIds: questIds });
    if (!ok) {
      allValid = false;
    }
  });
  process.exit(allValid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = main;
