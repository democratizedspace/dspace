#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../frontend/src/pages/processes/processSchema.json');
const hardeningSchema = require('../common/hardening.schema.json');
const {
  validateHardening,
  normalizeHardening,
  evaluateProcessQuality,
} = require('../common/hardening.js');

const ajv = new Ajv({ allErrors: true });
ajv.addSchema(hardeningSchema);
const validate = ajv.compile(schema);

function validateOneProcess(process, filePath) {
  const ok = validate(process);
  if (!ok) {
    console.error(`Validation failed for ${filePath}`);
    console.error(validate.errors);
    return false;
  }

  const hardeningErrors = validateHardening(process.hardening);
  if (hardeningErrors.length > 0) {
    console.error(`Validation failed for ${filePath}: ${hardeningErrors.join('; ')}`);
    return false;
  }

  const evaluationScore = evaluateProcessQuality(process);
  const normalized = normalizeHardening(process.hardening, { minimumScore: evaluationScore });
  if (normalized.score < evaluationScore) {
    console.error(
      `Validation failed for ${filePath}: hardening score ${normalized.score} below evaluator ${evaluationScore}`
    );
    return false;
  }

  if (normalized.passes !== normalized.history.length) {
    console.error(`Validation failed for ${filePath}: passes must equal history length`);
    return false;
  }

  return true;
}

function validateProcess(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (Array.isArray(data)) {
    return data.every((process) => validateOneProcess(process, filePath));
  }
  return validateOneProcess(data, filePath);
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/validate-process.js <process.json>');
    process.exit(1);
  }
  const isValid = validateProcess(path.resolve(file));
  process.exit(isValid ? 0 : 1);
}

module.exports = validateProcess;
