import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const QA_DOCS = ['docs/qa/v3.md', 'docs/qa/v3.1.md'];
const linkPattern = /\[<([^:]+?):([^>]+)>\]\(([^#)]+)#L(\d+)\)/g;

describe('QA docs test link freshness', () => {
  for (const doc of QA_DOCS) {
    it(`${path.basename(doc)} links target the right test lines`, () => {
      const markdown = fs.readFileSync(doc, 'utf8');
      const matches = [...markdown.matchAll(linkPattern)];
      const docDir = path.dirname(doc);

      for (const match of matches) {
        const [, fileLabel, testName, relativePath, lineString] = match;
        const absolutePath = path.resolve(docDir, relativePath);
        expect(
          fs.existsSync(absolutePath),
          `Missing test file for ${fileLabel} at ${relativePath}`
        ).toBe(true);

        const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
        const lineNumber = Number(lineString);

        expect(Number.isFinite(lineNumber)).toBe(true);
        expect(lineNumber).toBeGreaterThan(0);
        expect(lineNumber).toBeLessThanOrEqual(lines.length);

        const sourceLine = lines[lineNumber - 1];
        expect(
          sourceLine.includes(testName),
          `Expected line ${lineNumber} in ${relativePath} to include "${testName}" (from ${path.basename(
            doc
          )})`
        ).toBe(true);
      }
    });
  }
});
