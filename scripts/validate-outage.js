#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const schemaPath = path.resolve(__dirname, '../outages/schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Remove format validation since ajv-formats is not installed
if (schema.properties && schema.properties.date) {
  delete schema.properties.date.format;
}

const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateOutage(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const valid = validate(data);
    
    if (!valid) {
      console.error(`Validation failed for ${filePath}`);
      console.error(validate.errors);
      return false;
    }

    // Additional validation: check filename matches id pattern
    const filename = path.basename(filePath, '.json');
    const expectedPattern = /^\d{4}-\d{2}-\d{2}-.+$/;
    
    if (!expectedPattern.test(filename)) {
      console.error(`Validation failed for ${filePath}: filename must match pattern YYYY-MM-DD-<slug>`);
      return false;
    }

    // Check that date in filename matches date field
    const filenameDate = filename.substring(0, 10);
    if (data.date !== filenameDate) {
      console.error(`Validation failed for ${filePath}: date field "${data.date}" doesn't match filename date "${filenameDate}"`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating ${filePath}:`, error.message);
    return false;
  }
}

function validateAllOutages() {
  const outagesDir = path.resolve(__dirname, '../outages');
  const files = fs.readdirSync(outagesDir)
    .filter(f => f.endsWith('.json') && f !== 'schema.json')
    .map(f => path.join(outagesDir, f));

  let allValid = true;
  for (const file of files) {
    if (!validateOutage(file)) {
      allValid = false;
    }
  }

  return allValid;
}

if (require.main === module) {
  const file = process.argv[2];
  
  let isValid;
  if (file) {
    isValid = validateOutage(path.resolve(file));
  } else {
    isValid = validateAllOutages();
  }
  
  process.exit(isValid ? 0 : 1);
}

module.exports = validateOutage;
