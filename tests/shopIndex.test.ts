import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('shop index page', () => {
  it('does not hardcode numeric item id or array index', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/shop/index.astro'),
      'utf8'
    );
    expect(source).not.toMatch(/item\.id\s*===\s*['"]\d+['"]/);
    expect(source).not.toMatch(/items\s*\[\s*\d+\s*]/);
  });
});
