import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sveltePackageDir = path.dirname(require.resolve('svelte/package.json'));
const svelteStorePath = require.resolve('svelte/store');
const svelteCompilerPath = require.resolve('svelte/compiler');

const svelteInternalPath = (() => {
  try {
    return require.resolve('svelte/internal/client');
  } catch (error) {
    return require.resolve('svelte/internal');
  }
})();

// Custom plugin to resolve Svelte subpath imports
// This runs before vite:import-analysis and resolves the imports correctly
function svelteSubpathResolver(): Plugin {
  const svelteBase = path.resolve(__dirname, './node_modules/svelte/src');
  
  return {
    name: 'svelte-subpath-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      // Map Svelte subpath imports to actual file locations
      // Return the resolved path directly
      const mapping: Record<string, string> = {
        'svelte/compiler': path.join(svelteBase, 'compiler/index.js'),
        'svelte/store': path.join(svelteBase, 'store/index-server.js'),
        'svelte/animate': path.join(svelteBase, 'animate/index.js'),
        'svelte/easing': path.join(svelteBase, 'easing/index.js'),
        'svelte/internal': path.join(svelteBase, 'internal/index.js'),
        'svelte/internal/client': path.join(svelteBase, 'internal/client/index.js'),
        'svelte/internal/server': path.join(svelteBase, 'internal/server/index.js'),
        'svelte/motion': path.join(svelteBase, 'motion/index.js'),
        'svelte/transition': path.join(svelteBase, 'transition/index.js'),
      };
      
      if (mapping[source]) {
        return { id: mapping[source], external: false };
      }
      
      return null;
    }
  };
}

export default defineConfig({
  plugins: [
    svelteSubpathResolver(),
    svelte({
      configFile: path.resolve(__dirname, './svelte.config.js')
    })
  ],
  resolve: {
    alias: [
      {
        find: 'svelte/store',
        replacement: svelteStorePath
      },
      {
        find: 'svelte/internal/client',
        replacement: svelteInternalPath
      },
      {
        find: 'svelte/compiler',
        replacement: svelteCompilerPath
      },
      {
        find: 'svelte',
        replacement: sveltePackageDir
      }
    ],
    dedupe: ['svelte']
  },
  ssr: {
    noExternal: [
      'svelte',
      '@testing-library/svelte',
      /^svelte\//  // Include all svelte subpath imports
    ]
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['svelte']
      }
    },
    include: [
      'tests/**/*.test.ts',
      'scripts/tests/**/*.test.ts',
      'backend/**/*.test.ts',
      'frontend/src/components/__tests__/**/*.spec.ts'
    ],
    exclude: ['frontend/e2e/**', 'frontend/__tests__/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './frontend/coverage',
      all: false,
      include: [
        'backend/**/*.ts',
        'common/**/*.ts',
        'frontend/src/components/**/*.svelte'
      ],
      exclude: [
        '**/node_modules/**',
        '**/generated/**',
        '**/*.d.ts'
      ]
    }
  }
});
