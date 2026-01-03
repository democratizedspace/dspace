import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

type MojibakeToken = { token: string; label: string };
type Offender = { filePath: string; tokens: string[] };

const mojibakeTokens: MojibakeToken[] = [
  { token: '\u00e2\u0080\u0099', label: 'mojibake apostrophe' },
  { token: '\u00e2\u0080\u0098', label: 'mojibake opening apostrophe' },
  { token: '\u00e2\u0080\u009c', label: 'mojibake opening quote' },
  { token: '\u00e2\u0080\u009d', label: 'mojibake closing quote' },
  { token: '\u00e2\u0080\u0093', label: 'mojibake en dash' },
  { token: '\u00e2\u0080\u0094', label: 'mojibake em dash' },
  { token: '\u00e2\u0080\u00a6', label: 'mojibake ellipsis' },
  { token: '\u00e2\u20ac\u00a2', label: 'mojibake bullet' },
  { token: '\u00c2 ', label: 'stray U+00C2 with space' },
  { token: '\u00c2', label: 'stray U+00C2' },
];

const docRoots = [
  path.join(process.cwd(), 'frontend', 'src', 'pages', 'docs'),
  path.join(process.cwd(), 'docs'),
];

const allowedExtensions = new Set(['.md', '.mdx', '.markdown', '.astro', '.json']);

function collectContentFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

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

describe('docs markdown mojibake scan', () => {
  it('rejects common mojibake markers in source content', () => {
    const filesByRoot = docRoots.map((rootDir) => ({
      rootDir,
      files: collectContentFiles(rootDir),
    }));

    const markdownFiles = Array.from(
      new Set(filesByRoot.flatMap(({ files }) => files))
    ).sort();

    expect(
      markdownFiles.length,
      'Docs scan should include at least one content file'
    ).toBeGreaterThan(0);

    const missingRoots = filesByRoot
      .filter(({ files }) => files.length === 0)
      .map(({ rootDir }) => path.relative(process.cwd(), rootDir));
    expect(
      missingRoots,
      'Docs roots should each contain at least one content file'
    ).toEqual([]);

    const offenders: Offender[] = [];

    markdownFiles.forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const matchedTokens = mojibakeTokens
        .filter(({ token }) => content.includes(token))
        .map(({ token, label }) => `${label} ("${token}")`)
        .sort();

      if (matchedTokens.length > 0) {
        offenders.push({
          filePath: path.relative(process.cwd(), filePath),
          tokens: matchedTokens,
        });
      }
    });

    const sortedOffenders = offenders
      .map(({ filePath, tokens }) => ({
        filePath,
        tokens: [...tokens].sort(),
      }))
      .sort((a, b) => a.filePath.localeCompare(b.filePath));

    if (sortedOffenders.length > 0) {
      const message = [
        'Mojibake detected in docs sources:',
        ...sortedOffenders.map(
          ({ filePath, tokens }) => `- ${filePath}: ${tokens.join(', ')}`
        ),
      ].join('\n');
      expect.fail(message);
    }
  });
});
