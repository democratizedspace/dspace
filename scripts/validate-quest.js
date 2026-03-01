#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/quests/jsonSchemas/quest.json');
const processes = require('../frontend/src/pages/processes/base.json');
const hardeningSchema = require('../frontend/src/pages/sharedSchemas/hardening.json');

let cachedQuestIds;
let cachedProcessIds;
let cachedItemIds;

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

function loadProcessIds() {
  if (cachedProcessIds) {
    return cachedProcessIds;
  }

  cachedProcessIds = new Set(processes.map((proc) => proc.id));
  return cachedProcessIds;
}

function collectItemIds(dir, ids) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      collectItemIds(fullPath, ids);
      continue;
    }

    if (!entry.endsWith('.json')) {
      continue;
    }

    const records = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    for (const record of records) {
      if (record && typeof record.id === 'string' && record.id.trim().length > 0) {
        ids.add(record.id);
      }
    }
  }
}

function loadItemIds() {
  if (cachedItemIds) {
    return cachedItemIds;
  }

  const ids = new Set();
  collectItemIds(path.resolve(__dirname, '../frontend/src/pages/inventory/json/items'), ids);
  cachedItemIds = ids;
  return cachedItemIds;
}

function toProcessIdSet(knownProcessIds) {
  if (knownProcessIds instanceof Set) {
    return knownProcessIds;
  }

  if (Array.isArray(knownProcessIds)) {
    return new Set(knownProcessIds);
  }

  if (typeof knownProcessIds === 'string' && knownProcessIds.length > 0) {
    return new Set([knownProcessIds]);
  }

  return new Set(loadProcessIds());
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

function toItemIdSet(knownItemIds) {
  if (knownItemIds instanceof Set) {
    return knownItemIds;
  }

  if (Array.isArray(knownItemIds)) {
    return new Set(knownItemIds);
  }

  if (typeof knownItemIds === 'string' && knownItemIds.length > 0) {
    return new Set([knownItemIds]);
  }

  return new Set(loadItemIds());
}

function extractItemIds(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }

      if (entry && typeof entry.id === 'string') {
        return entry.id;
      }

      return null;
    })
    .filter((entry) => typeof entry === 'string' && entry.length > 0);
}

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(hardeningSchema, hardeningSchema.$id);
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
  const processIdSet = toProcessIdSet(options.knownProcessIds);
  const itemIdSet = toItemIdSet(options.knownItemIds);

  if (Array.isArray(data.requiresQuests)) {
    const missing = data.requiresQuests.filter((dep) => !questIdSet.has(dep));
    if (missing.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown quest dependencies ${missing.join(', ')}`
      );
      return false;
    }
  }

  const requiredAndRewardItemIds = [
    ...extractItemIds(data.requiresItems),
    ...extractItemIds(data.rewards),
  ];

  const missingQuestLevelItemIds = requiredAndRewardItemIds.filter((itemId) => !itemIdSet.has(itemId));
  if (missingQuestLevelItemIds.length > 0) {
    console.error(
      `Validation failed for ${filePath}: unknown quest-level item ids ${missingQuestLevelItemIds.join(', ')}`
    );
    return false;
  }

  for (const node of data.dialogue || []) {
    if (!Array.isArray(node.options)) {
      continue;
    }

    const missingProcessIds = node.options
      .filter((option) => option.type === 'process')
      .map((option) => option.process)
      .filter((processId) => !processIdSet.has(processId));

    if (missingProcessIds.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown process ids ${missingProcessIds.join(', ')}`
      );
      return false;
    }

    const missingOptionItemIds = node.options
      .flatMap((option) => [
        ...extractItemIds(option.requiresItems),
        ...extractItemIds(option.grantsItems),
      ])
      .filter((itemId) => !itemIdSet.has(itemId));

    if (missingOptionItemIds.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown option item ids ${missingOptionItemIds.join(', ')}`
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
