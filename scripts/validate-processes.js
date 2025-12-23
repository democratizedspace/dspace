#!/usr/bin/env node
const Ajv = require('ajv');
const processes = require('../frontend/src/generated/processes.json');
const processSchema = require('../frontend/src/pages/processes/jsonSchemas/process.json');
const hardeningSchema = require('../frontend/src/shared/hardening.schema.json');
const { validateHardening, evaluateProcessQuality } = require('./hardening.js');

function main() {
  const ajv = new Ajv({ allErrors: true });
  ajv.addSchema(hardeningSchema, hardeningSchema.$id);
  const validate = ajv.compile(processSchema);
  let allValid = true;

  processes.forEach((proc) => {
    const errors = [];
    const validSchema = validate(proc);
    if (!validSchema) {
      errors.push(...(validate.errors || []).map((err) => ajv.errorsText([err])));
    }
    const hardeningCheck = validateHardening(proc.hardening);
    if (!hardeningCheck.valid) {
      errors.push(...hardeningCheck.errors);
    }
    const expectedScore = evaluateProcessQuality(proc);
    if (proc.hardening.score < expectedScore) {
      errors.push(`hardening.score ${proc.hardening.score} below evaluator ${expectedScore}`);
    }

    if (errors.length > 0) {
      allValid = false;
      console.error(`Process ${proc.id} failed validation: ${errors.join('; ')}`);
    }
  });

  process.exit(allValid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = main;
