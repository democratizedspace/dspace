import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createSvelteSubpathResolver,
  resolveSvelteSubpath,
} from '../scripts/svelteSubpathResolver';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svelteSrcRoot = path.join(repoRoot, 'node_modules', 'svelte', 'src');

describe('svelteSubpathResolver', () => {
  const resolver = createSvelteSubpathResolver();
  const resolveId = resolver.resolveId as any;

  it('maps known Svelte internal subpaths to concrete files', () => {
    const asyncFlag = resolveSvelteSubpath('svelte/internal/flags/async');
    const clientInternal = resolveSvelteSubpath('svelte/internal/client');
    const resolveHookResult = resolveId?.('svelte/internal/flags/async');

    expect(asyncFlag).toBe(path.join(svelteSrcRoot, 'internal/flags/async.js'));
    expect(clientInternal).toBe(
      path.join(svelteSrcRoot, 'internal/client/index.js')
    );
    expect(resolveHookResult).toEqual({
      external: false,
      id: path.join(svelteSrcRoot, 'internal/flags/async.js'),
    });
  });

  it('leaves unknown subpaths unresolved', () => {
    const helperResult = resolveSvelteSubpath('svelte/internal/nonexistent');
    const resolveHookResult = resolveId?.('svelte/internal/nonexistent');

    expect(helperResult).toBeNull();
    expect(resolveHookResult).toBeNull();
  });
});
