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

function loadItemIds() {
  if (cachedItemIds) {
    return cachedItemIds;
  }

  const itemDir = path.resolve(__dirname, '../frontend/src/pages/inventory/json/items');
  const itemIds = new Set();

  if (!fs.existsSync(itemDir)) {
    cachedItemIds = itemIds;
    return cachedItemIds;
  }

  for (const entry of fs.readdirSync(itemDir)) {
    if (!entry.endsWith('.json')) {
      continue;
    }

    const fullPath = path.join(itemDir, entry);
    try {
      const records = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (!Array.isArray(records)) {
        continue;
      }
      for (const item of records) {
        if (item && typeof item.id === 'string' && item.id.trim().length > 0) {
          itemIds.add(item.id);
        }
      }
    } catch (error) {
      console.warn(`Unable to parse item file ${fullPath}:`, error.message);
    }
  }

  cachedItemIds = itemIds;
  return cachedItemIds;
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

function collectItemIdsFromEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => entry && entry.id)
    .filter((id) => typeof id === 'string' && id.length > 0);
}

const defaultAllowedItemPlaceholderIds = new Set([
  '11aa585c-16f6-4012-9fec-48f6c203f7c7',
  '15e3dd7e-374b-4233-b8c9-117e3057f009'
]);

function toAllowedItemPlaceholderSet(allowedItemPlaceholderIds) {
  if (allowedItemPlaceholderIds instanceof Set) {
    return allowedItemPlaceholderIds;
  }

  if (Array.isArray(allowedItemPlaceholderIds)) {
    return new Set(allowedItemPlaceholderIds);
  }

  if (typeof allowedItemPlaceholderIds === 'string' && allowedItemPlaceholderIds.length > 0) {
    return new Set([allowedItemPlaceholderIds]);
  }

  return new Set(defaultAllowedItemPlaceholderIds);
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
  const allowedItemPlaceholderSet = toAllowedItemPlaceholderSet(options.allowedItemPlaceholderIds);

  if (Array.isArray(data.requiresQuests)) {
    const missing = data.requiresQuests.filter((dep) => !questIdSet.has(dep));
    if (missing.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown quest dependencies ${missing.join(', ')}`
      );
      return false;
    }
  }


  const referencedItemIds = new Set([
    ...collectItemIdsFromEntries(data.rewards),
    ...collectItemIdsFromEntries(data.grantsItems),
    ...collectItemIdsFromEntries(data.requiresItems)
  ]);

  for (const node of data.dialogue || []) {
    if (!Array.isArray(node.options)) {
      continue;
    }

    for (const option of node.options) {
      for (const itemId of collectItemIdsFromEntries(option.requiresItems)) {
        referencedItemIds.add(itemId);
      }
      for (const itemId of collectItemIdsFromEntries(option.grantsItems)) {
        referencedItemIds.add(itemId);
      }
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
  }

  const missingItemIds = [...referencedItemIds].filter(
    (itemId) => !itemIdSet.has(itemId) && !allowedItemPlaceholderSet.has(itemId)
  );
  if (missingItemIds.length > 0) {
    console.error(
      `Validation failed for ${filePath}: unknown item ids ${missingItemIds.join(', ')}`
    );
    return false;
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
