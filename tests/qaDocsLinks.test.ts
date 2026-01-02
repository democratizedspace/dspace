import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

type LinkMatch = {
    filePath: string;
    testName: string;
    targetPath: string;
    startLine: number;
    endLine: number;
};

const QA_DOCS = ['docs/qa/v3.md', 'docs/qa/v3.1.md'];
const LINK_PATTERN =
    /\[<([^:>]+):([^>]+)>]\(([^)#]+)#L(\d+)(?:-L(\d+))?\)/g;

function parseLinks(docPath: string): LinkMatch[] {
    const contents = fs.readFileSync(docPath, 'utf8');
    const matches: LinkMatch[] = [];

    for (const match of contents.matchAll(LINK_PATTERN)) {
        const [, targetFile, testName, hrefPath, start, end] = match;
        matches.push({
            filePath: targetFile.trim(),
            testName: testName.trim(),
            targetPath: hrefPath.trim(),
            startLine: Number(start),
            endLine: end ? Number(end) : Number(start),
        });
    }

    return matches;
}

function resolveTarget(docPath: string, target: string): string {
    return path.resolve(path.dirname(docPath), target);
}

describe('QA docs test links stay fresh', () => {
    QA_DOCS.forEach((doc) => {
        it(`links in ${doc} point at the expected test lines`, () => {
            const links = parseLinks(doc);
            expect(links.length).toBeGreaterThan(0);

            for (const link of links) {
                const resolved = resolveTarget(doc, link.targetPath);
                expect(fs.existsSync(resolved)).toBe(true);

                const content = fs.readFileSync(resolved, 'utf8');
                const lines = content.split(/\r?\n/);
                const startIndex = link.startLine - 1;
                const endIndex = link.endLine - 1;

                expect(startIndex).toBeGreaterThanOrEqual(0);
                expect(endIndex).toBeGreaterThanOrEqual(startIndex);
                expect(endIndex).toBeLessThan(lines.length);

                const window = lines.slice(startIndex, endIndex + 1);
                const matchedLine = window.find((line) =>
                    line.includes(link.testName)
                );

                expect(
                    matchedLine,
                    `${link.filePath} expected to mention "${link.testName}" between L${link.startLine}-L${link.endLine}`
                ).toBeDefined();
            }
        });
    });
});
