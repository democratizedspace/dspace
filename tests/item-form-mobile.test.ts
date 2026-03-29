import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  'frontend/src/components/svelte/ItemForm.svelte',
  'utf8',
);

describe('ItemForm mobile layout', () => {
  it('stacks submit button on narrow screens', () => {
    expect(source).toMatch(/\.form-submit\s*{[\s\S]*display:\s*flex/);
    expect(source).toMatch(
      /@media \(max-width: 480px\)[\s\S]*\.form-submit\s*{[\s\S]*flex-direction:\s*column/,
    );
  });

  it('keeps form controls constrained with border-box sizing', () => {
    expect(source).toMatch(/\.item-form\s*{[\s\S]*box-sizing:\s*border-box/);
    expect(source).toMatch(/input,\s*[\r\n]+\s*textarea,\s*[\r\n]+\s*select\s*{[\s\S]*box-sizing:\s*border-box/);
  });
});
