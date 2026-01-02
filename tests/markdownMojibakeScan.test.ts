import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const mojibakePatterns: { pattern: RegExp; label: string }[] = [
  { pattern: /â€™/, label: 'mojibake apostrophe' },
  { pattern: /â€˜/, label: 'mojibake opening apostrophe' },
  { pattern: /â€œ/, label: 'mojibake opening quote' },
  { pattern: /â€�/, label: 'mojibake closing quote' },
  { pattern: /â€“/, label: 'mojibake en dash' },
  { pattern: /â€”/, label: 'mojibake em dash' },
  { pattern: /â€¦/, label: 'mojibake ellipsis' },
  { pattern: /Â\s/, label: 'stray Â with space' },
  { pattern: /Â/, label: 'stray Â' },
];

const docRoots = [
  path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs', 'md'),
  path.join(process.cwd(), 'docs'),
];

function collectMarkdownFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      return collectMarkdownFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

const markdownFiles = docRoots.flatMap(collectMarkdownFiles);

describe('docs markdown mojibake scan', () => {
  it('rejects common mojibake markers in source content', () => {
    const offenders: string[] = [];

    markdownFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      mojibakePatterns.forEach(({ pattern, label }) => {
        if (pattern.test(content)) {
          offenders.push(`${filePath} contains ${label} (${pattern.source})`);
        }
      });
    });

    expect(offenders).toEqual([]);
  });
});
