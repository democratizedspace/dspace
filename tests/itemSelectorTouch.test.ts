import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  'frontend/src/components/svelte/ItemSelector.svelte',
  'utf8'
);

describe('ItemSelector touch interactions', () => {
  it('includes touch handler on edit button', () => {
    expect(source).toMatch(/on:touchstart={toggleExpanded}/);
  });

  it('emits select event on item touch', () => {
    expect(source).toMatch(/on:touchstart=\{\(\) => handleItemSelect/);
  });
});
