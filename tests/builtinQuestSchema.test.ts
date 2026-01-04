import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questSchema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/quests/jsonSchemas/quest.json'), 'utf8')
);
const hardeningSchema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/sharedSchemas/hardening.json'), 'utf8')
);
const questFiles = globSync(join(__dirname, '../frontend/src/pages/quests/json/**/*.json')).sort();

describe('built-in quest schema validation', () => {
    it('quests conform to the JSON schema', () => {
        const ajv = new Ajv({ allErrors: true, strict: false });
        ajv.addSchema(hardeningSchema, hardeningSchema.$id);
        const validate = ajv.compile(questSchema);

        for (const file of questFiles) {
            const quest = JSON.parse(readFileSync(file, 'utf8'));
            const valid = validate(quest);
            if (!valid) {
                console.error(`Quest schema errors in ${file}`, validate.errors);
            }
            expect(valid).toBe(true);
        }
    });
});
