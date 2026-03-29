import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  'frontend/src/components/svelte/ProcessForm.svelte',
  'utf8'
);

describe('ProcessForm mobile layout', () => {
  it('keeps form and text inputs within container width', () => {
    expect(source).toMatch(/\.process-form\s*{[\s\S]*width:\s*min\(100%,\s*600px\)/);
    expect(source).toMatch(/input\s*{[\s\S]*width:\s*100%[\s\S]*box-sizing:\s*border-box/);
  });

  it('stacks submit buttons on narrow screens', () => {
    expect(source).toMatch(/\.form-submit\s*{[\s\S]*display:\s*flex/);
    expect(source).toMatch(
      /@media \(max-width: 480px\)[\s\S]*\.form-submit\s*{[\s\S]*flex-direction:\s*column/
    );
  });
});
