import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSvelteBasePath = path.resolve(__dirname, '../node_modules/svelte/src');

type SvelteSubpathMap = Record<string, string>;

const svelteSubpathMap = (basePath: string): SvelteSubpathMap => ({
  'svelte/compiler': path.join(basePath, 'compiler/index.js'),
  'svelte/store': path.join(basePath, 'store/index-server.js'),
  'svelte/animate': path.join(basePath, 'animate/index.js'),
  'svelte/easing': path.join(basePath, 'easing/index.js'),
  'svelte/internal': path.join(basePath, 'internal/index.js'),
  'svelte/internal/client': path.join(basePath, 'internal/client/index.js'),
  'svelte/internal/server': path.join(basePath, 'internal/server/index.js'),
  'svelte/internal/disclose-version': path.join(
    basePath,
    'internal/disclose-version.js'
  ),
  'svelte/internal/flags/legacy': path.join(
    basePath,
    'internal/flags/legacy.js'
  ),
  'svelte/internal/flags/async': path.join(
    basePath,
    'internal/flags/async.js'
  ),
  'svelte/internal/flags/tracing': path.join(
    basePath,
    'internal/flags/tracing.js'
  ),
  'svelte/motion': path.join(basePath, 'motion/index.js'),
  'svelte/transition': path.join(basePath, 'transition/index.js'),
});

export function resolveSvelteSubpath(
  source: string,
  basePath: string = defaultSvelteBasePath
): string | null {
  const mapping: SvelteSubpathMap = svelteSubpathMap(basePath);
  return mapping[source] ?? null;
}

type SvelteSubpathResolverPlugin = Plugin & {
  resolveId: (source: string) => { id: string; external: false } | null;
};

export function createSvelteSubpathResolver(
  basePath: string = defaultSvelteBasePath
): SvelteSubpathResolverPlugin {
  const mapping = svelteSubpathMap(basePath);

  return {
    name: 'svelte-subpath-resolver',
    enforce: 'pre',
    resolveId(source) {
      const resolvedPath = mapping[source];

      if (resolvedPath) {
        return { id: resolvedPath, external: false };
      }

      return null;
    },
  };
}
