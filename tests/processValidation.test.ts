import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/processes/process.schema.json'), 'utf8')
);
const hardeningSchema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/sharedSchemas/hardening.json'), 'utf8')
);

describe('process validation', () => {
    it('conforms to the JSON schema for built-in processes', () => {
        const ajv = new Ajv({ allErrors: true, strict: false });
        ajv.addSchema(hardeningSchema, hardeningSchema.$id);
        const validate = ajv.compile(schema);

        for (const process of processes as Array<Record<string, unknown>>) {
            const valid = validate(process);
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);
        }
    });

    it('keeps recipe references valid with sane counts and durations', () => {
        const itemIds = new Set((items as Array<Record<string, any>>).map((item) => item.id));
        const durationPattern = /^(?:\d+(?:\.\d+)?[dhmsDHMS]\s*)+$/;

        for (const process of processes as Array<Record<string, any>>) {
            expect(typeof process.duration).toBe('string');
            expect(process.duration.trim().length).toBeGreaterThan(0);
            expect(durationPattern.test(process.duration)).toBe(true);

            for (const field of ['requireItems', 'consumeItems', 'createItems']) {
                for (const entry of process[field] ?? []) {
                    expect(itemIds.has(entry.id)).toBe(true);
                    expect(Number.isFinite(entry.count)).toBe(true);
                    expect(entry.count).toBeGreaterThan(0);
                }
            }
        }
    });
});
