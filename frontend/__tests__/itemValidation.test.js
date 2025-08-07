/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../src/pages/inventory/jsonSchemas/item.json');
const itemsDir = path.join(__dirname, '../src/pages/inventory/json/items');

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe('item validation', () => {
    test('item files conform to schema', () => {
        const items = fs
            .readdirSync(itemsDir)
            .filter((f) => f.endsWith('.json'))
            .flatMap((f) => JSON.parse(fs.readFileSync(path.join(itemsDir, f))));
        const ids = new Set(items.map((it) => it.id));
        for (const item of items) {
            const valid = validate(item);
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);

            if (item.dependencies) {
                for (const dep of item.dependencies) {
                    expect(ids.has(dep)).toBe(true);
                }
            }
        }
    });
});
