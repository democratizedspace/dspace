import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fixFile } from '../scripts/fix-markdown-image-paths.js';

describe('fix-markdown-image-paths', () => {
  it('rewrites image paths and cleans markdown', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-'));
    const file = path.join(tmpDir, 'doc.md');
    const original = `---\ntitle: Test\n---\n![Alt](/assets/img.png)\nText\n【1†Image: sample.png】`;
    fs.writeFileSync(file, original, 'utf8');

    fixFile(file);

    const result = fs.readFileSync(file, 'utf8');
    expect(result).toContain('![Alt](../../../../../public/assets/img.png)');
    expect(result).toContain('<!-- image removed: sample.png -->');
    expect(result.startsWith('---\ntitle: Test\n---\n\n')).toBe(true);
  });
});
