#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/quests/jsonSchemas/quest.json');
const processes = require('../frontend/src/pages/processes/base.json');
const hardeningSchema = require('../frontend/src/pages/sharedSchemas/hardening.json');

let cachedQuestIds;
let cachedProcessIds;

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

  if (Array.isArray(data.requiresQuests)) {
    const missing = data.requiresQuests.filter((dep) => !questIdSet.has(dep));
    if (missing.length > 0) {
      console.error(
        `Validation failed for ${filePath}: unknown quest dependencies ${missing.join(', ')}`
      );
      return false;
    }
  }

  for (const node of data.dialogue || []) {
    if (!Array.isArray(node.options)) {
      continue;
    }

    const hasFinishOption = node.options.some((option) => option.type === 'finish');
    const hasGotoOption = node.options.some(
      (option) => option.type === 'goto' && typeof option.goto === 'string' && option.goto.trim().length > 0
    );

    if (!hasFinishOption && !hasGotoOption) {
      const nodeId = typeof node.id === 'string' && node.id.trim().length > 0 ? node.id : '<unknown>';
      console.error(
        `Validation failed for ${filePath}: dialogue node "${nodeId}" must include at least one goto option or a finish option.`
      );
      return false;
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
