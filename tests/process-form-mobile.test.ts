import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  'frontend/src/components/svelte/ProcessForm.svelte',
  'utf8'
);

describe('ProcessForm mobile layout', () => {
  it('stacks submit buttons on narrow screens', () => {
    expect(source).toMatch(/\.form-submit\s*{[\s\S]*display:\s*flex/);
    expect(source).toMatch(
      /@media \(max-width: 480px\)[\s\S]*\.form-submit\s*{[\s\S]*flex-direction:\s*column/
    );
  });
});
