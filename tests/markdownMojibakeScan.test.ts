import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

type MojibakeToken = { token: string; label: string };
type Offender = { filePath: string; tokens: string[] };

const mojibakeTokens: MojibakeToken[] = [
  { token: 'â€™', label: 'mojibake apostrophe' },
  { token: 'â€˜', label: 'mojibake opening apostrophe' },
  { token: 'â€œ', label: 'mojibake opening quote' },
  { token: 'â€�', label: 'mojibake closing quote' },
  { token: 'â€“', label: 'mojibake en dash' },
  { token: 'â€”', label: 'mojibake em dash' },
  { token: 'â€¦', label: 'mojibake ellipsis' },
  { token: 'â€¢', label: 'mojibake bullet' },
  { token: 'Â ', label: 'stray Â with space' },
  { token: 'Â', label: 'stray Â' },
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

    if (entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      return [entryPath];
    }

    return [];
  });
}

const markdownFiles = docRoots.flatMap(collectContentFiles);

describe('docs markdown mojibake scan', () => {
  it('rejects common mojibake markers in source content', () => {
    const offenders: Offender[] = [];

    markdownFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const matchedTokens = mojibakeTokens
        .filter(({ token }) => content.includes(token))
        .map(({ token, label }) => `${label} ("${token}")`);

      if (matchedTokens.length > 0) {
        offenders.push({
          filePath: path.relative(process.cwd(), filePath),
          tokens: matchedTokens,
        });
      }
    });

    if (offenders.length > 0) {
      const message = [
        'Mojibake detected in docs sources:',
        ...offenders.map(
          ({ filePath, tokens }) => `- ${filePath}: ${tokens.join(', ')}`
        ),
      ].join('\n');
      expect.fail(message);
    }

    expect(offenders).toEqual([]);
  });
});
