import { describe, expect, it } from 'vitest';

const dynamicImport = async (specifier: string) => import(specifier);

describe('svelte package resolution', () => {
  it('imports svelte/compiler', async () => {
    const compiler = await dynamicImport('svelte/compiler');
    expect(compiler).toBeDefined();
  });

  it('imports svelte/store', async () => {
    const store = await dynamicImport('svelte/store');
    expect(store).toBeDefined();
  });
});
