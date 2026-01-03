import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const mojibakeTokens = [
  'â€™',
  'â€˜',
  'â€œ',
  'â€�',
  'â€“',
  'â€”',
  'â€¦',
  'â€¢',
  'Â ',
  'Â',
];

const docRoots = [
  path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs'),
  path.join(process.cwd(), 'docs'),
];

const allowedExtensions = new Set(['.md', '.mdx', '.markdown', '.astro']);

function collectContentFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      return collectContentFiles(entryPath);
    }

    return entry.isFile() && allowedExtensions.has(path.extname(entry.name))
      ? [entryPath]
      : [];
  });
}

const contentFiles = Array.from(new Set(docRoots.flatMap(collectContentFiles)));

describe('docs markdown mojibake scan', () => {
  it('rejects common mojibake markers in source content', () => {
    const offenders: { file: string; tokens: string[] }[] = [];

    contentFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const matchedTokens = mojibakeTokens.filter((token) => content.includes(token));

      if (matchedTokens.length > 0) {
        offenders.push({
          file: path.relative(process.cwd(), filePath),
          tokens: matchedTokens,
        });
      }
    });

    const message =
      offenders.length === 0
        ? undefined
        : [
            'Mojibake detected in docs sources:',
            ...offenders.map(({ file, tokens }) => `- ${file}: ${tokens.join(', ')}`),
          ].join('\n');

    expect(offenders, message).toEqual([]);
  });
});
