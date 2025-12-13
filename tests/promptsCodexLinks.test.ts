import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

describe('prompts-codex links', () => {
  const filePath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'prompts-codex.md'
  );
  const content = readFileSync(filePath, 'utf8');
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  const links = Array.from(content.matchAll(linkRegex), (m) => m[1]);

  it('uses relative links for internal docs', () => {
    for (const link of links) {
      if (link.startsWith('http') || link.startsWith('#')) continue;
      expect(link.startsWith('/')).toBe(false);
      const target = link.split('#')[0];
      const targetPath = join(dirname(filePath), target);
      expect(existsSync(targetPath)).toBe(true);
    }
  });
});
