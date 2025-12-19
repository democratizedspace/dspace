import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';

const TIME_API_URL = 'https://worldtimeapi.org/api/timezone/Etc/UTC';

async function resolveCurrentUtcDate(): Promise<Date> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(TIME_API_URL, { signal: controller.signal });
        if (response.ok) {
            const payload = (await response.json()) as { utc_datetime?: string };
            const rawDatetime = payload.utc_datetime;
            if (rawDatetime) {
                const normalized = rawDatetime.replace('Z', '+00:00');
                return new Date(normalized);
            }
        }
    } catch (error) {
        const abortErrorName = (error as Error).name;
        if (abortErrorName !== 'AbortError') {
            // Network failures fall through to system time fallback.
        }
    } finally {
        clearTimeout(timeoutId);
    }

    return new Date();
}

function normalizeUtcDate(date: Date): Date {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
}

describe('outage metadata parity and schema', () => {
    const repoRoot = process.cwd();
    const outagesDir = join(repoRoot, 'outages');

    it('ensures outage dates are not in the future and match filenames', async () => {
        const today = normalizeUtcDate(await resolveCurrentUtcDate());

        for (const entry of readdirSync(outagesDir)) {
            if (!entry.endsWith('.json') || entry === 'schema.json') {
                continue;
            }

            const outagePath = join(outagesDir, entry);
            const content = JSON.parse(
                readFileSync(outagePath, 'utf-8')
            ) as Record<string, unknown>;
            const recordedDate = content.date as string | undefined;

            expect(recordedDate, `${entry} is missing a date field`).toBeTruthy();

            const outageDate = new Date(`${recordedDate}T00:00:00Z`);
            if (Number.isNaN(outageDate.getTime())) {
                throw new Error(`${entry} has invalid date: ${recordedDate}`);
            }

            expect(outageDate.getTime()).toBeLessThanOrEqual(today.getTime());

            const filenamePrefix = parse(entry).name.split('-', 3);
            expect(filenamePrefix.length).toBeGreaterThanOrEqual(3);
            const expectedPrefix = filenamePrefix.slice(0, 3).join('-');
            expect(expectedPrefix).toBe(recordedDate);
        }
    });

    it('requires Markdown outages to have JSON counterparts and matching longForm', () => {
        const jsonRecords = new Map(
            readdirSync(outagesDir)
                .filter((name) => name.endsWith('.json') && name !== 'schema.json')
                .map((name) => [name, join(outagesDir, name)])
        );

        for (const entry of readdirSync(outagesDir)) {
            if (!entry.endsWith('.md') || entry === 'README.md') {
                continue;
            }

            const jsonName = `${parse(entry).name}.json`;
            expect(jsonRecords.has(jsonName)).toBe(true);

            const record = JSON.parse(
                readFileSync(jsonRecords.get(jsonName)!, 'utf-8')
            ) as Record<string, unknown>;
            const longForm = record.longForm as string | undefined;
            if (longForm !== undefined && longForm !== null) {
                const expectedLongForm = `outages/${entry}`;
                expect(longForm).toBe(expectedLongForm);
            }
        }
    });

    it('validates outage records against the declared schema', () => {
        const schemaPath = join(outagesDir, 'schema.json');
        const schema = JSON.parse(
            readFileSync(schemaPath, 'utf-8')
        ) as Record<string, unknown>;
        const requiredFields = (schema.required as string[]) ?? [];
        const properties = (schema.properties as Record<string, { type?: string }>) ?? {};

        expect(requiredFields.length).toBeGreaterThan(0);

        for (const entry of readdirSync(outagesDir)) {
            if (!entry.endsWith('.json') || entry === 'schema.json') {
                continue;
            }

            const outage = JSON.parse(
                readFileSync(join(outagesDir, entry), 'utf-8')
            ) as Record<string, unknown>;
            const missingFields = requiredFields.filter((field) => !(field in outage));
            expect(missingFields, `${entry} is missing required schema fields`).toHaveLength(0);

            for (const [fieldName, fieldValue] of Object.entries(outage)) {
                if (!(fieldName in properties)) {
                    continue;
                }

                const expectedType = properties[fieldName]?.type;
                if (!expectedType) {
                    continue;
                }

                const typeMapping: Record<string, string> = {
                    string: 'string',
                    object: 'object',
                    number: 'number',
                    boolean: 'boolean',
                    undefined: 'undefined',
                    bigint: 'integer',
                    null: 'null'
                };

                const actualType = Array.isArray(fieldValue)
                    ? 'array'
                    : fieldValue === null
                      ? 'null'
                      : typeof fieldValue;
                const mappedType = typeMapping[actualType] ?? actualType;
                expect(
                    mappedType,
                    `${entry}: field '${fieldName}' should be type '${expectedType}' but got '${mappedType}'`
                ).toBe(expectedType);
            }
        }
    });

    it('tracks the processes and CI long-tail outage record', () => {
        const expectedId = 'processes-ci-long-tail';
        const matchingFiles = readdirSync(outagesDir).filter(
            (name) => name.endsWith('.json') && name.includes(expectedId)
        );

        expect(matchingFiles.length).toBeGreaterThan(0);

        const outage = JSON.parse(readFileSync(join(outagesDir, matchingFiles[0]), 'utf-8')) as Record<
            string,
            unknown
        >;

        expect(outage.id).toBe(expectedId);
        expect(outage.component).toBe('processes and CI');
        expect(Array.isArray(outage.references)).toBe(true);
    });
});
