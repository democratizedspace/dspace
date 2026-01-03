import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import { durationInSeconds, prettyPrintDuration } from '../frontend/src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/processes/process.schema.json'), 'utf8')
);
const hardeningSchema = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/pages/sharedSchemas/hardening.json'), 'utf8')
);
const processes = JSON.parse(
    readFileSync(join(__dirname, '../frontend/src/generated/processes.json'), 'utf8')
) as Array<Record<string, unknown>>;

describe('process validation', () => {
    it('conforms to the JSON schema for built-in processes', () => {
        const ajv = new Ajv({ allErrors: true, strict: false });
        ajv.addSchema(hardeningSchema, hardeningSchema.$id);
        const validate = ajv.compile(schema);

        for (const process of processes) {
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
        const canonicalizeDuration = (duration: string) =>
            prettyPrintDuration(durationInSeconds(duration));

        for (const process of processes as Array<Record<string, any>>) {
            expect(typeof process.duration).toBe('string');
            expect(process.duration.trim().length).toBeGreaterThan(0);
            expect(durationPattern.test(process.duration)).toBe(true);

            const canonicalDuration = canonicalizeDuration(process.duration);
            const reparsedDuration = durationInSeconds(canonicalDuration);

            expect(canonicalDuration).toBe(canonicalizeDuration(canonicalDuration));
            expect(reparsedDuration).toBeGreaterThan(0);
            expect(reparsedDuration).toBe(durationInSeconds(process.duration));

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
