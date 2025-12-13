/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const schema = require('../src/pages/quests/jsonSchemas/quest.json');
const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateFile(filepath) {
    const data = JSON.parse(fs.readFileSync(filepath));
    return validate(data);
}

describe('quest template validation', () => {
    test('templates conform to quest schema', () => {
        const dir = path.join(__dirname, '../src/pages/quests/templates');
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
        for (const file of files) {
            const filepath = path.join(dir, file);
            const valid = validateFile(filepath);
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);
        }
    });
});
