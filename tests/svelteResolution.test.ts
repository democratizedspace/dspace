import { expect, test } from 'vitest';

const loadModule = async (specifier: string) => {
  const module = await import(specifier);
  expect(module).toBeDefined();
};

test('resolves svelte compiler in vitest', async () => {
  await loadModule('svelte/compiler');
});

test('resolves svelte store utilities in vitest', async () => {
  await loadModule('svelte/store');
});

test('resolves svelte client internals in vitest', async () => {
  await loadModule('svelte/internal/client');
});
