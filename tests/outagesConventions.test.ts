import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import Ajv from 'ajv';

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
            } else {
                console.warn(
                    'Warning: Time API response missing "utc_datetime"; falling back to system UTC time.'
                );
            }
        } else {
            console.warn(
                `Warning: Time API responded with HTTP ${response.status}; falling back to system UTC time.`
            );
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('Warning: Time API request aborted (timeout); falling back to system UTC time.');
        }
        console.warn(
            'Warning: Failed to fetch current UTC time from time API; falling back to system UTC time.',
            error
        );
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

            const dateRanges = content.dateRanges as
                | { start?: string; end?: string }[]
                | undefined;

            if (dateRanges) {
                dateRanges.forEach((window) => {
                    const { start, end } = window;
                    expect(start).toBeTruthy();
                    expect(end).toBeTruthy();

                    const startDate = new Date(`${start}T00:00:00Z`);
                    const endDate = new Date(`${end}T23:59:59Z`);

                    expect(Number.isNaN(startDate.getTime())).toBe(false);
                    expect(Number.isNaN(endDate.getTime())).toBe(false);

                    expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
                    expect(startDate.getTime()).toBeLessThanOrEqual(today.getTime());
                    expect(endDate.getTime()).toBeLessThanOrEqual(today.getTime());
                });
            }
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
                expect(longForm).toBe(`outages/${markdownFile}`);
            });

        jsonRecords.forEach((recordPath, fileName) => {
            const record = loadJsonFile(recordPath);
            const longForm = record.longForm as string | undefined;

            if (longForm) {
                expect(files.includes(path.basename(longForm))).toBe(true);
            } else {
                expect(files.includes(fileName.replace(/\.json$/, '.md'))).toBe(false);
            }
        });
    });

    it('outage records conform to the schema', () => {
        const schemaPath = path.join(outagesDir, 'schema.json');
        const schema = loadJsonFile(schemaPath);
        const ajv = new Ajv({ allErrors: true, strict: false });
        ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);

        const validate = ajv.compile(schema);
        const files = readdirSync(outagesDir).filter(
            (file) => file.endsWith('.json') && file !== 'schema.json'
        );

        files.forEach((file) => {
            const content = loadJsonFile(path.join(outagesDir, file));
            const valid = validate(content);
            if (!valid) {
                console.error(validate.errors);
            }
            expect(valid).toBe(true);
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

        const references = outage.references as string[];
        references.forEach((reference) => {
            const isHttpUrl = reference.startsWith('http://') || reference.startsWith('https://');
            const isRelativePath =
                !reference.includes('://') &&
                !path.isAbsolute(reference) &&
                /^[A-Za-z0-9._\-/]+$/.test(reference);

            expect(isHttpUrl || isRelativePath).toBe(true);
        });
    });
});
