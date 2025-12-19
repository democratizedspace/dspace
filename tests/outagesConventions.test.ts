import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const TIME_API_URL = 'https://worldtimeapi.org/api/timezone/Etc/UTC';

async function resolveCurrentUtcDate(): Promise<Date> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(TIME_API_URL, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
            const payload = await response.json();
            const raw = payload?.utc_datetime as string | undefined;
            if (raw) {
                const normalized = raw.replace('Z', '+00:00');
                return new Date(normalized);
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            // fall back to system time below
        }
    }

    return new Date();
}

function loadJsonFile(filePath: string) {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

describe('outages', () => {
    const repoRoot = process.cwd();
    const outagesDir = path.join(repoRoot, 'outages');

    it('dates are not in the future and filenames align', async () => {
        const today = await resolveCurrentUtcDate();
        const files = readdirSync(outagesDir).filter((file) => file.endsWith('.json'));

        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
            if (file === 'schema.json') {
                continue;
            }

            const fullPath = path.join(outagesDir, file);
            const content = loadJsonFile(fullPath);
            const recordedDate = content.date as string | undefined;
            expect(recordedDate).toBeTruthy();

            const outageDate = new Date(`${recordedDate}T00:00:00Z`);
            expect(Number.isNaN(outageDate.getTime())).toBe(false);
            expect(outageDate.getTime()).toBeLessThanOrEqual(today.getTime());

            const filenamePrefix = file.split('-').slice(0, 3).join('-');
            expect(filenamePrefix).toBe(recordedDate);
        }
    });

    it('markdown outages have JSON counterparts and longForm references', () => {
        const files = readdirSync(outagesDir);
        const jsonRecords = new Map(
            files
                .filter((file) => file.endsWith('.json') && file !== 'schema.json')
                .map((file) => [file, path.join(outagesDir, file)])
        );

        files
            .filter((file) => file.endsWith('.md'))
            .forEach((markdownFile) => {
                const jsonName = markdownFile.replace(/\.md$/, '.json');
                expect(jsonRecords.has(jsonName)).toBe(true);

                const record = loadJsonFile(jsonRecords.get(jsonName)!);
                const longForm = record.longForm as string | undefined;
                if (longForm) {
                    expect(longForm).toBe(`outages/${markdownFile}`);
                }
            });
    });

    it('outage records conform to the schema', () => {
        const schemaPath = path.join(outagesDir, 'schema.json');
        const schema = loadJsonFile(schemaPath);
        const requiredFields = (schema.required as string[]) ?? [];

        expect(requiredFields.length).toBeGreaterThan(0);

        const properties = (schema.properties as Record<string, { type?: string }>) ?? {};
        const files = readdirSync(outagesDir).filter(
            (file) => file.endsWith('.json') && file !== 'schema.json'
        );

        files.forEach((file) => {
            const content = loadJsonFile(path.join(outagesDir, file));
            const missingFields = requiredFields.filter((field) => !(field in content));
            expect(missingFields).toEqual([]);

            Object.entries(content).forEach(([fieldName, value]) => {
                if (properties[fieldName]?.type) {
                    const expectedType = properties[fieldName].type;
                    const actualType = Array.isArray(value) ? 'array' : typeof value;
                    expect(actualType).toBe(expectedType);
                }
            });
        });
    });

    it('documents the processes CI long-tail outage', () => {
        const expectedId = 'processes-ci-long-tail';
        const matching = readdirSync(outagesDir).filter(
            (file) => file.includes(expectedId) && file.endsWith('.json')
        );

        expect(matching.length).toBeGreaterThan(0);

        const outage = loadJsonFile(path.join(outagesDir, matching[0]));
        expect(outage.id).toBe(expectedId);
        expect(outage.references).toBeInstanceOf(Array);
        expect((outage.references as unknown[]).length).toBeGreaterThan(0);
    });
});
