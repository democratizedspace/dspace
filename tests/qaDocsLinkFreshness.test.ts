import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const QA_DOCS = ['docs/qa/v3.md', 'docs/qa/v3.1.md'];
const linkPattern = /\[<([^:>]+):([^>]+)>\]\(([^#)]+)#L(\d+)(?:-L?(\d+))?\)/g;

const normalizePath = (filePath) => filePath.split(path.sep).join('/');

const docLineNumber = (markdown, matchIndex) =>
  markdown
    .slice(0, matchIndex)
    .split(/\r?\n/)
    .length;

describe('QA docs test link freshness', () => {
  for (const doc of QA_DOCS) {
    it(`${path.basename(doc)} links target the right test lines`, () => {
      const markdown = fs.readFileSync(doc, 'utf8');
      const matches = [...markdown.matchAll(linkPattern)];
      const docDir = path.dirname(doc);

      expect(matches.length, `${doc} should contain at least one test link`).toBeGreaterThan(0);

      for (const match of matches) {
        const [, fileLabel, testName, relativePath, startLineString, endLineString] = match;
        const absolutePath = path.resolve(docDir, relativePath);
        const relativeFromRoot = normalizePath(path.relative(process.cwd(), absolutePath));
        const docLine = docLineNumber(markdown, match.index ?? 0);

        expect(
          fs.existsSync(absolutePath),
          `Missing test file for ${fileLabel} at ${relativePath} (referenced from ${doc}:${docLine})`
        ).toBe(true);

        const labelMatches =
          fileLabel === path.basename(relativeFromRoot) || relativeFromRoot.endsWith(fileLabel);
        expect(
          labelMatches,
          `File label "${fileLabel}" in ${doc}:${docLine} should match ${path.basename(
            relativeFromRoot
          )} or the path suffix (${relativeFromRoot})`
        ).toBe(true);

        const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
        const startLine = Number(startLineString);
        const endLine = endLineString ? Number(endLineString) : startLine;

        expect(Number.isFinite(startLine)).toBe(true);
        expect(Number.isFinite(endLine)).toBe(true);
        expect(startLine).toBeGreaterThan(0);
        expect(endLine).toBeGreaterThan(0);
        expect(endLine).toBeGreaterThanOrEqual(startLine);
        expect(endLine).toBeLessThanOrEqual(lines.length);

        const rangeText = lines.slice(startLine - 1, endLine).join('\n');
        expect(
          rangeText.includes(testName),
          `Expected ${relativePath}#L${startLine}${endLineString ? `-L${endLine}` : ''} to include "${testName}" (from ${path.basename(
            doc
          )}:${docLine})`
        ).toBe(true);
      }
    });
  }
});
