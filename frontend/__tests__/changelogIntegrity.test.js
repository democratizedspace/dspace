import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_DIR = path.join(__dirname, '../src/pages/docs/md/changelog');
const SNAPSHOT_PATH = path.join(__dirname, 'fixtures/changelogBodies.json');
const ALLOWED_REASONS = new Set(['typo', 'broken_link']);

const loadSnapshot = () => {
    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
};

const extractSections = (raw) => {
    if (!raw.startsWith('---')) {
        return { body: raw.replace(/\r\n/g, '\n'), frontMatter: '', reasons: [] };
    }

    const closingIndex = raw.indexOf('\n---', 3);
    if (closingIndex === -1) {
        return { body: raw.replace(/\r\n/g, '\n'), frontMatter: raw.slice(3), reasons: [] };
    }

    const frontMatterText = raw.slice(3, closingIndex).trim();
    let body = raw.slice(closingIndex + 4);
    if (body.startsWith('\n')) {
        body = body.slice(1);
    }

    return {
        body: body.replace(/\r\n/g, '\n'),
        frontMatter: frontMatterText,
        reasons: extractReasons(frontMatterText),
    };
};

const extractReasons = (frontMatterText) => {
    if (!frontMatterText) {
        return [];
    }

    const lines = frontMatterText.split('\n');
    const reasons = [];
    let collecting = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (collecting) {
            if (!trimmed) {
                continue;
            }

            if (trimmed.startsWith('- ')) {
                const value = trimmed.slice(2).trim();
                if (value) {
                    reasons.push(stripQuotes(value));
                }
                continue;
            }

            collecting = false;
        }

        if (!trimmed.startsWith('bodyChangeJustification')) {
            continue;
        }

        const afterColon = trimmed.slice('bodyChangeJustification'.length).trimStart();
        const value = afterColon.startsWith(':') ? afterColon.slice(1).trim() : '';

        if (!value) {
            collecting = true;
            continue;
        }

        if (value.startsWith('[')) {
            const normalizedValue = value.replace(/'/g, '"');
            try {
                const parsed = JSON.parse(normalizedValue);
                if (Array.isArray(parsed)) {
                    parsed
                        .map((entry) => (typeof entry === 'string' ? entry : ''))
                        .filter(Boolean)
                        .forEach((entry) => reasons.push(entry));
                }
            } catch (error) {
                // Fall back to treating this as a raw string if JSON parsing fails.
                if (value.length > 2) {
                    reasons.push(stripQuotes(value));
                }
            }
            continue;
        }

        reasons.push(stripQuotes(value));
    }

    return reasons.filter(Boolean);
};

const stripQuotes = (value) => value.replace(/^['"]/, '').replace(/['"]$/, '');

const getLineDiffCount = (expected, actual) => {
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const maxLength = Math.max(expectedLines.length, actualLines.length);

    let differences = 0;
    for (let index = 0; index < maxLength; index += 1) {
        const expectedLine = expectedLines[index] ?? '';
        const actualLine = actualLines[index] ?? '';
        if (expectedLine !== actualLine) {
            differences += 1;
        }
    }

    return differences;
};

describe('Changelog integrity', () => {
    const snapshot = loadSnapshot();
    const files = fs
        .readdirSync(CHANGELOG_DIR)
        .filter((file) => file.endsWith('.md') && file !== '20251101.md')
        .sort();

    files.forEach((fileName) => {
        const slug = fileName.replace(/\.md$/, '');

        it(`preserves the historical body for ${slug}`, () => {
            const raw = fs.readFileSync(path.join(CHANGELOG_DIR, fileName), 'utf8');
            const { body, reasons } = extractSections(raw);

            const expectedBody = snapshot[slug];
            expect(expectedBody).toBeDefined();

            if (!expectedBody) {
                return;
            }

            const normalizedExpected = expectedBody.replace(/\r\n/g, '\n');
            const normalizedActual = body.replace(/\r\n/g, '\n');

            if (normalizedExpected === normalizedActual) {
                expect(reasons.length).toBe(0);
                return;
            }

            const normalizedReasons = reasons.filter((reason) => ALLOWED_REASONS.has(reason));
            expect(normalizedReasons.length).toBeGreaterThan(0);

            const diffCount = getLineDiffCount(normalizedExpected, normalizedActual);
            expect(diffCount).toBeLessThanOrEqual(2);
        });
    });
});
