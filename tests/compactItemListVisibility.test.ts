import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('frontend/src/components/svelte/CompactItemList.svelte', 'utf8');

describe('CompactItemList rendering conditions', () => {
  it('keeps item rows visible even when inventory counts are zero', () => {
    expect(source).toMatch(/\$:\s*isEmpty\s*=\s*itemList\.length\s*===\s*0/);
    expect(source).not.toMatch(/Object\.values\(\$itemCounts\)\.every\(\(qty\) => qty === 0\)/);
  });
});
