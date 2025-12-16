import { expect, test } from 'vitest';

const loadModule = async (specifier: string) => {
  const module = await import(specifier);
  expect(module).toBeDefined();
  return module;
};

test('resolves svelte compiler in vitest', async () => {
  await loadModule('svelte/compiler');
});

test('resolves svelte store utilities in vitest', async () => {
  await loadModule('svelte/store');
});

test('resolves svelte client internals in vitest', async () => {
  try {
    await loadModule('svelte/internal/client');
  } catch (error) {
    await loadModule('svelte/internal');
  }
});

test('SSR compiled Svelte components expose a render function', async () => {
  const { compile } = await import('svelte/compiler');
  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const { pathToFileURL } = await import('node:url');
  const { js } = compile('<h1>Hello!</h1>', { generate: 'ssr' });

  const tempDir = path.join(process.cwd(), '.vitest-tmp');
  await fs.mkdir(tempDir, { recursive: true });
  const modulePath = path.join(tempDir, `Component-${Date.now()}.mjs`);
  await fs.writeFile(modulePath, js.code, 'utf8');

  const compiled = await import(`${pathToFileURL(modulePath).href}?cachebust=${Date.now()}`);
  await fs.rm(modulePath, { force: true });

  const renderFn = typeof compiled.default === 'function' ? compiled.default : (compiled.default as any)?.render;
  expect(typeof renderFn).toBe('function');
});
