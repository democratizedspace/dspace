#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/quests/jsonSchemas/quest.json');

let cachedQuestIds;

function collectQuestIds(dir, ids) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    let stats;

    try {
      stats = fs.statSync(fullPath);
    } catch (error) {
      console.warn(`Unable to stat ${fullPath}:`, error.message);
      continue;
    }

    if (stats.isDirectory()) {
      collectQuestIds(fullPath, ids);
      continue;
    }

    if (!entry.endsWith('.json')) {
      continue;
    }

    try {
      const quest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (quest && typeof quest.id === 'string' && quest.id.trim().length > 0) {
        ids.add(quest.id);
      }
    } catch (error) {
      console.warn(`Unable to parse quest file ${fullPath}:`, error.message);
    }
  }
}

function loadDefaultQuestIds() {
  if (cachedQuestIds) {
    return cachedQuestIds;
  }

  const questDirs = [
    path.resolve(__dirname, '../frontend/src/pages/quests/json'),
    path.resolve(__dirname, '../frontend/src/pages/quests/archive')
  ];

  const ids = new Set();
  for (const dir of questDirs) {
    collectQuestIds(dir, ids);
  }

  cachedQuestIds = ids;
  return cachedQuestIds;
}

function toQuestIdSet(knownQuestIds) {
  if (knownQuestIds instanceof Set) {
    return knownQuestIds;
  }

  if (Array.isArray(knownQuestIds)) {
    return new Set(knownQuestIds);
  }

  if (typeof knownQuestIds === 'string' && knownQuestIds.length > 0) {
    return new Set([knownQuestIds]);
  }

  return new Set(loadDefaultQuestIds());
}

const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateQuest(filePath, options = {}) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const valid = validate(data);
  if (!valid) {
    console.error(`Validation failed for ${filePath}`);
    console.error(validate.errors);
    return false;
  }

  const questIdSet = toQuestIdSet(options.knownQuestIds);

  if (Array.isArray(data.requiresQuests)) {
    const missing = data.requiresQuests.filter((dep) => !questIdSet.has(dep));
    if (missing.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown quest dependencies ${missing.join(', ')}`
      );
      return false;
    }
  }

  return true;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/validate-quest.js <quest.json>');
    process.exit(1);
  }
  const isValid = validateQuest(path.resolve(file));
  process.exit(isValid ? 0 : 1);
}

module.exports = validateQuest;
