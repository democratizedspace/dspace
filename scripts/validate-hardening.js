#!/usr/bin/env node
const { globSync } = require('glob');
const path = require('path');
const validateQuest = require('./validate-quest.js');
const validateProcess = require('./validate-process.js');

function validateQuests() {
  const questFiles = globSync('frontend/src/pages/quests/json/**/*.json', {
    ignore: ['**/templates/*.json'],
  });
  return questFiles.every((file) => validateQuest(path.resolve(file)));
}

function validateProcesses() {
  return validateProcess(path.resolve('frontend/src/pages/processes/base.json'));
}

function run() {
  const questsOk = validateQuests();
  const processesOk = validateProcesses();
  if (!questsOk || !processesOk) {
    process.exit(1);
  }
  console.log('All quest and process hardening metadata is valid.');
}

if (require.main === module) {
  run();
}

module.exports = run;
