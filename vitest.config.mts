import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to resolve Svelte subpath imports before import analysis
const svelteImportResolverPlugin = (): Plugin => ({
  name: 'svelte-import-resolver',
  enforce: 'pre',
  resolveId(id, importer) {
    // Map Svelte subpath imports to their actual file locations
    const svelteMap: Record<string, string> = {
      'svelte/compiler': path.resolve(__dirname, './node_modules/svelte/src/compiler/index.js'),
      'svelte/store': path.resolve(__dirname, './node_modules/svelte/src/store/index-server.js'),
      'svelte/animate': path.resolve(__dirname, './node_modules/svelte/src/animate/index.js'),
      'svelte/easing': path.resolve(__dirname, './node_modules/svelte/src/easing/index.js'),
      'svelte/internal': path.resolve(__dirname, './node_modules/svelte/src/internal/index.js'),
      'svelte/internal/client': path.resolve(__dirname, './node_modules/svelte/src/internal/client/index.js'),
      'svelte/internal/server': path.resolve(__dirname, './node_modules/svelte/src/internal/server/index.js'),
      'svelte/motion': path.resolve(__dirname, './node_modules/svelte/src/motion/index.js'),
      'svelte/transition': path.resolve(__dirname, './node_modules/svelte/src/transition/index.js')
    };
    
    if (svelteMap[id]) {
      return svelteMap[id];
    }
    
    return null;
  }
});

export default defineConfig({
  plugins: [
    svelteImportResolverPlugin(),
    svelte({
      configFile: path.resolve(__dirname, './svelte.config.js')
    })
  ],
  resolve: {
    alias: {
      'svelte': path.resolve(__dirname, './node_modules/svelte/src/index-server.js'),
      'svelte/compiler': path.resolve(__dirname, './node_modules/svelte/src/compiler/index.js'),
      'svelte/store': path.resolve(__dirname, './node_modules/svelte/src/store/index-server.js'),
      'svelte/animate': path.resolve(__dirname, './node_modules/svelte/src/animate/index.js'),
      'svelte/easing': path.resolve(__dirname, './node_modules/svelte/src/easing/index.js'),
      'svelte/internal': path.resolve(__dirname, './node_modules/svelte/src/internal/index.js'),
      'svelte/internal/client': path.resolve(__dirname, './node_modules/svelte/src/internal/client/index.js'),
      'svelte/internal/server': path.resolve(__dirname, './node_modules/svelte/src/internal/server/index.js'),
      'svelte/motion': path.resolve(__dirname, './node_modules/svelte/src/motion/index.js'),
      'svelte/transition': path.resolve(__dirname, './node_modules/svelte/src/transition/index.js')
    },
    conditions: ['default', 'import']
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
