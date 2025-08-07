import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { expect, test } from 'vitest';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = JSON.parse(
  readFileSync(
    join(__dirname, '../frontend/src/pages/inventory/jsonSchemas/item.json'),
    'utf8'
  )
);
const itemsDir = join(__dirname, '../frontend/src/pages/inventory/json/items');
const items = readdirSync(itemsDir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(join(itemsDir, f), 'utf8')));

test('items conform to schema', () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  for (const item of items) {
    const valid = validate(item);
    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  }
});
