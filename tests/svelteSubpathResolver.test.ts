import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createSvelteSubpathResolver,
  resolveSvelteSubpath,
} from '../scripts/svelteSubpathResolver';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svelteSrcRoot = path.join(repoRoot, 'node_modules', 'svelte', 'src');
type ResolveHook = (
  source: string,
  importer?: string,
  options?: { attributes: Record<string, string>; isEntry: boolean }
) => unknown;

const asResolveHook = (hook: unknown): ResolveHook => {
  if (typeof hook === 'function') {
    return hook as ResolveHook;
  }

  if (hook && typeof (hook as { handler?: unknown }).handler === 'function') {
    return (hook as { handler: ResolveHook }).handler;
  }

  throw new Error('resolveId hook is missing or invalid');
};

describe('svelteSubpathResolver', () => {
  const resolver = createSvelteSubpathResolver();
  const resolveId = asResolveHook(resolver.resolveId);

  it('maps known Svelte internal subpaths to concrete files', () => {
    const asyncFlag = resolveSvelteSubpath('svelte/internal/flags/async');
    const clientInternal = resolveSvelteSubpath('svelte/internal/client');
    const resolveHookResult = resolveId('svelte/internal/flags/async', undefined, {
      attributes: {},
      isEntry: false,
    });

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
    const resolveHookResult = resolveId('svelte/internal/nonexistent', undefined, {
      attributes: {},
      isEntry: false,
    });

    expect(helperResult).toBeNull();
    expect(resolveHookResult).toBeNull();
  });
});
