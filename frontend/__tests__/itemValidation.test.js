/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../src/pages/inventory/jsonSchemas/item.json');
const itemsFile = path.join(__dirname, '../src/pages/inventory/json/items.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe('item validation', () => {
    test('items.json conforms to schema', () => {
        const items = JSON.parse(fs.readFileSync(itemsFile));
        for (const item of items) {
            const valid = validate(item);
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);
        }
    });
});
