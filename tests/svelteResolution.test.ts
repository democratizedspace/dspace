import { describe, expect, it } from 'vitest';

describe('svelte resolution', () => {
  it('resolves svelte/compiler import', async () => {
    const compiler = await import('svelte/compiler');
    expect(compiler).toBeDefined();
  });

  it('resolves svelte/store import', async () => {
    const store = await import('svelte/store');
    expect(store).toBeDefined();
  });
});
