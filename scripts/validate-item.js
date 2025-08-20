#!/usr/bin/env node
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/inventory/jsonSchemas/item.json');
const readJson = require('./utils/read-json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateItem(filePath) {
  const data = readJson(filePath);
  const items = Array.isArray(data) ? data : [data];
  let valid = true;
  for (const item of items) {
    if (!validate(item)) {
      console.error(`Validation failed for ${filePath}`);
      console.error(validate.errors);
      valid = false;
    }
  }
  return valid;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/validate-item.js <item.json>');
    process.exit(1);
  }
  const isValid = validateItem(path.resolve(file));
  process.exit(isValid ? 0 : 1);
}

module.exports = validateItem;
