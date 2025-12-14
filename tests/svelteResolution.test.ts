import { describe, expect, test } from 'vitest';

describe('svelte module resolution', () => {
  test('resolves svelte/compiler', async () => {
    const compiler = await import('svelte/compiler');

    expect(compiler).toBeTruthy();
  });

  test('resolves svelte/store', async () => {
    const store = await import('svelte/store');

    expect(store).toBeTruthy();
  });
});
