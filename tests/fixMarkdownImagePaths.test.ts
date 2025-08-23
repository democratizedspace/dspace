import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { expect, test } from 'vitest';
import { fixFile } from '../scripts/fix-markdown-image-paths.js';

test('fixFile rewrites markdown image paths and front matter', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'md-'));
  const file = path.join(dir, 'example.md');
  const input = [
    '---',
    'title: Example',
    '---',
    '![alt](/assets/foo.png)',
    'Text',
    '【1†Image: secret.png】'
  ].join('\n');
  writeFileSync(file, input);

  fixFile(file);

  const output = readFileSync(file, 'utf8');
  expect(output).toBe([
    '---',
    'title: Example',
    '---',
    '',
    '![alt](../../../../../public/assets/foo.png)',
    'Text',
    '<!-- image removed: secret.png -->'
  ].join('\n'));

  rmSync(dir, { recursive: true, force: true });
});
