import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('shop index page', () => {
  it('does not hardcode numeric item id', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../frontend/src/pages/shop/index.astro'),
      'utf8'
    );
    expect(source).not.toMatch(/item\.id\s*===\s*['"]\d+['"]/);
  });
});
