import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

const DOCS_MARKDOWN_GLOB = path.join(
  __dirname,
  '../frontend/src/pages/docs/md/**/*.md'
);

const isStandaloneImageLine = (line: string): boolean =>
  /^<img\b[^>]*>\s*$/.test(line.trim());

const isBlank = (line: string | undefined): boolean => {
  if (typeof line !== 'string') {
    return true;
  }
  return line.trim().length === 0;
};

describe('docs markdown image spacing', () => {
  it('keeps standalone image tags separated by blank lines outside figure blocks', () => {
    const markdownPaths = globSync(DOCS_MARKDOWN_GLOB, { nodir: true });
    const violations: string[] = [];

    for (const markdownPath of markdownPaths) {
      const lines = fs.readFileSync(markdownPath, 'utf8').split(/\r?\n/);
      let inFigure = false;

      for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim();

        if (/^<figure\b/i.test(trimmed)) {
          inFigure = true;
        }

        if (isStandaloneImageLine(lines[index]) && !inFigure) {
          if (!isBlank(lines[index - 1])) {
            violations.push(
              `${markdownPath}:${index + 1} missing blank line before <img>`
            );
          }
          if (!isBlank(lines[index + 1])) {
            violations.push(
              `${markdownPath}:${index + 1} missing blank line after <img>`
            );
          }
        }

        if (/^<\/figure>/i.test(trimmed)) {
          inFigure = false;
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
