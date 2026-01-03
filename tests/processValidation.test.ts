import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processSchema = JSON.parse(
  readFileSync(join(__dirname, '../frontend/src/pages/processes/process.schema.json'), 'utf8')
);
const hardeningSchema = JSON.parse(
  readFileSync(join(__dirname, '../frontend/src/pages/sharedSchemas/hardening.json'), 'utf8')
);
const processes = JSON.parse(
  readFileSync(join(__dirname, '../frontend/src/generated/processes.json'), 'utf8')
);

test('processes conform to schema', () => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(hardeningSchema, hardeningSchema.$id);
  const validate = ajv.compile(processSchema);

  for (const process of processes) {
    const valid = validate(process);

    if (!valid) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  }
});
