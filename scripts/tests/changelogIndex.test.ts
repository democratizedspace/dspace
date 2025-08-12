import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CHANGELOG index', () => {
  test('includes links for all release notes', () => {
    const changelogPath = path.join(__dirname, '../../frontend/CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const docsDir = path.join(
      __dirname,
      '../../frontend/src/pages/docs/md/changelog'
    );
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const link = `src/pages/docs/md/changelog/${file}`;
      expect(changelog).toContain(link);
    }
  });
});
