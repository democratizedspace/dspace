import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const TIME_API_URL = 'https://worldtimeapi.org/api/timezone/Etc/UTC';

async function resolveCurrentUtcDate(): Promise<string> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(TIME_API_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
            const payload = (await response.json()) as Record<string, unknown>;
            const raw = typeof payload.utc_datetime === 'string' ? payload.utc_datetime : null;
            if (raw) {
                const normalized = raw.replace('Z', '+00:00');
                return new Date(normalized).toISOString().slice(0, 10);
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            // ignore network timeout and fall back to system time
        }
    }

    return new Date().toISOString().slice(0, 10);
}

function loadJson(filePath: string): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

describe('outage records', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const outagesDir = path.join(repoRoot, 'outages');

    it('uses non-future dates that match filename prefixes', async () => {
        expect(fs.existsSync(outagesDir)).toBe(true);

        const today = await resolveCurrentUtcDate();
        const todayDate = new Date(`${today}T00:00:00Z`);

        const outageFiles = fs
            .readdirSync(outagesDir)
            .filter((file) => file.endsWith('.json') && file !== 'schema.json');

        for (const file of outageFiles) {
            const content = loadJson(path.join(outagesDir, file));
            const recordedDate = content.date;
            expect(typeof recordedDate).toBe('string');

            const parsedDate = new Date(`${recordedDate as string}T00:00:00Z`);
            expect(Number.isNaN(parsedDate.getTime())).toBe(false);
            expect(parsedDate.getTime()).toBeLessThanOrEqual(todayDate.getTime());

            const filenamePrefix = path.basename(file, '.json').split('-', 3);
            expect(filenamePrefix.length).toBeGreaterThanOrEqual(3);
            const expectedPrefix = filenamePrefix.slice(0, 3).join('-');
            expect(expectedPrefix).toBe(recordedDate);
        }
    });

    it('has Markdown companions for long-form outage write-ups', () => {
        expect(fs.existsSync(outagesDir)).toBe(true);

        const jsonRecords = new Map(
            fs
                .readdirSync(outagesDir)
                .filter((file) => file.endsWith('.json') && file !== 'schema.json')
                .map((file) => [file, path.join(outagesDir, file)])
        );

        const markdownFiles = fs
            .readdirSync(outagesDir)
            .filter((file) => /^\d{4}-\d{2}-\d{2}-/.test(file) && file.endsWith('.md'));

        for (const markdownName of markdownFiles) {
            const jsonName = markdownName.replace(/\.md$/, '.json');
            expect(jsonRecords.has(jsonName)).toBe(true);

            const record = loadJson(jsonRecords.get(jsonName) as string);
            if (record.longForm !== undefined) {
                expect(record.longForm).toBe(`outages/${markdownName}`);
            }
        }
    });

    it('matches the declared outage schema', () => {
        const schemaPath = path.join(outagesDir, 'schema.json');
        expect(fs.existsSync(schemaPath)).toBe(true);

        const schema = loadJson(schemaPath);
        const requiredFields = Array.isArray(schema.required) ? schema.required : [];
        expect(requiredFields.length).toBeGreaterThan(0);

        const outageFiles = fs
            .readdirSync(outagesDir)
            .filter((file) => file.endsWith('.json') && file !== 'schema.json');

        const typeMapping: Record<string, string> = {
            string: 'string',
            number: 'number',
            boolean: 'boolean',
            object: 'object',
            undefined: 'undefined'
        };

        for (const file of outageFiles) {
            const content = loadJson(path.join(outagesDir, file));

            const missingFields = requiredFields.filter((field) => !(field in content));
            expect(missingFields).toEqual([]);

            const properties =
                schema.properties && typeof schema.properties === 'object'
                    ? (schema.properties as Record<string, Record<string, string>>)
                    : {};

            for (const [fieldName, fieldValue] of Object.entries(content)) {
                if (properties[fieldName] && properties[fieldName].type) {
                    const expectedType = properties[fieldName].type;
                    const actual = Array.isArray(fieldValue)
                        ? 'array'
                        : fieldValue === null
                          ? 'null'
                          : typeof fieldValue;
                    const mapped = typeMapping[actual] ?? actual;
                    expect(mapped).toBe(expectedType);
                }
            }

            if (content.longForm) {
                const markdownPath = path.join(repoRoot, content.longForm as string);
                expect(fs.existsSync(markdownPath)).toBe(true);
            }
        }
    });

    it('documents the processes CI long tail outage', () => {
        const matching = fs
            .readdirSync(outagesDir)
            .filter((file) => file.includes('processes-ci-long-tail') && file.endsWith('.json'));
        expect(matching.length).toBeGreaterThan(0);

        const outage = loadJson(path.join(outagesDir, matching[0]));
        expect(outage.id).toBe('processes-ci-long-tail');
        expect(String(outage.component)).toContain('processes');
        expect(String(outage.rootCause)).toMatch(/svelte 5/i);
        expect(Array.isArray(outage.references)).toBe(true);
        expect((outage.references as unknown[]).length).toBeGreaterThan(0);
    });
});
