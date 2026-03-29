import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

const processFormSource = readFileSync('frontend/src/components/svelte/ProcessForm.svelte', 'utf8');
const itemFormSource = readFileSync('frontend/src/components/svelte/ItemForm.svelte', 'utf8');
const questFormSource = readFileSync('frontend/src/components/svelte/QuestForm.svelte', 'utf8');

describe('Form overflow guards', () => {
  it('uses border-box sizing in create/edit forms with narrow container layouts', () => {
    expect(processFormSource).toMatch(/\.process-form\s*{[\s\S]*box-sizing:\s*border-box/);
    expect(itemFormSource).toMatch(/\.item-form\s*{[\s\S]*box-sizing:\s*border-box/);
    expect(questFormSource).toMatch(/\.quest-form,\s*\.quest-form \*\s*{[\s\S]*box-sizing:\s*border-box/);
  });

  it('keeps text-entry controls capped to their container width', () => {
    expect(processFormSource).toMatch(/input\s*{[\s\S]*width:\s*100%/);
    expect(itemFormSource).toMatch(/input,\s*textarea,\s*select\s*{[\s\S]*width:\s*100%/);
    expect(questFormSource).toMatch(/input,\s*textarea\s*{[\s\S]*width:\s*95%/);
  });
});
