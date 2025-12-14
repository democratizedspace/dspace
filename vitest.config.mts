import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Custom plugin to resolve Svelte subpath imports
// This runs before vite:import-analysis and resolves the imports correctly
function svelteSubpathResolver(): Plugin {
  const svelteBase = path.resolve(__dirname, './node_modules/svelte/src');
  
  return {
    name: 'svelte-subpath-resolver',
    enforce: 'pre',
    resolveId(source, importer, options) {
      // Map Svelte subpath imports to actual file locations
      if (source === 'svelte/compiler') {
        return this.resolve(path.join(svelteBase, 'compiler/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/store') {
        return this.resolve(path.join(svelteBase, 'store/index-server.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/animate') {
        return this.resolve(path.join(svelteBase, 'animate/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/easing') {
        return this.resolve(path.join(svelteBase, 'easing/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/internal') {
        return this.resolve(path.join(svelteBase, 'internal/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/internal/client') {
        return this.resolve(path.join(svelteBase, 'internal/client/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/internal/server') {
        return this.resolve(path.join(svelteBase, 'internal/server/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/motion') {
        return this.resolve(path.join(svelteBase, 'motion/index.js'), importer, { skipSelf: true, ...options });
      }
      if (source === 'svelte/transition') {
        return this.resolve(path.join(svelteBase, 'transition/index.js'), importer, { skipSelf: true, ...options });
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
    alias: {
      'svelte': path.resolve(__dirname, './node_modules/svelte/src/index-server.js')
    }
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
