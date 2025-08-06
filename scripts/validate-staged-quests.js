#!/usr/bin/env node
const child_process = require('child_process');
const path = require('path');
const validateQuest = require('./validate-quest');

function getStagedQuestFiles() {
  try {
    const output = child_process.execSync(
      'git diff --cached --name-only --diff-filter=ACM',
      {
        encoding: 'utf8',
      }
    );
    return output
      .split('\n')
      .map((f) => f.trim())
      .filter(
        (f) =>
          f.startsWith('frontend/src/pages/quests/json/') && f.endsWith('.json')
      );
  } catch {
    return [];
  }
}

function validateStagedQuests(files = getStagedQuestFiles()) {
  let allValid = true;
  for (const file of files) {
    const ok = validateQuest(path.resolve(file));
    if (!ok) {
      allValid = false;
    }
  }
  return allValid;
}

if (require.main === module) {
  const ok = validateStagedQuests();
  process.exit(ok ? 0 : 1);
}

module.exports = { getStagedQuestFiles, validateStagedQuests };
