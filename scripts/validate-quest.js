#!/usr/bin/env node
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/quests/jsonSchemas/quest.json');
const readJson = require('./utils/read-json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateQuest(filePath) {
  const data = readJson(filePath);
  const valid = validate(data);
  if (!valid) {
    console.error(`Validation failed for ${filePath}`);
    console.error(validate.errors);
  }
  return valid;
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
