import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const QA_DOCS = ['docs/qa/v3.md', 'docs/qa/v3.1.md'];
const LINK_REGEX = /\[<([^>]+)>\]\(([^)]+)\)/g;

function parseLink(target: string, baseDir: string) {
    const [rawPath, rawLine] = target.split('#L');
    const filePath = path.resolve(baseDir, rawPath);
    const lineNumber = Number.parseInt(rawLine, 10);
    return { filePath, lineNumber };
}

for (const doc of QA_DOCS) {
    const docPath = path.join(__dirname, '..', doc);
    const content = fs.readFileSync(docPath, 'utf8');
    const baseDir = path.dirname(docPath);
    const matches = [...content.matchAll(LINK_REGEX)].filter(([, , href]) =>
        href.includes('tests/') && href.includes('#L')
    );

    describe(`${doc} test anchors`, () => {
        it('has anchored test links to keep QA items tied to coverage', () => {
            expect(matches.length).toBeGreaterThan(0);
        });

        for (const match of matches) {
            const [, display, target] = match;
            const parts = display.split(':');
            it(`links ${display} to a real test line`, () => {
                expect(parts.length).toBe(2);
                const [filename, testLabel] = parts;
                const { filePath, lineNumber } = parseLink(target, baseDir);

                expect(fs.existsSync(filePath)).toBe(true);
                expect(path.basename(filePath)).toBe(filename);
                const lines = fs.readFileSync(filePath, 'utf8').split('\n');
                expect(lineNumber).toBeGreaterThan(0);
                expect(lineNumber).toBeLessThanOrEqual(lines.length);
                const line = lines[lineNumber - 1];
                expect(line).toContain(testLabel);
            });
        }
    });
}
