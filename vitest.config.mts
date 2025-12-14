import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to rewrite Svelte subpath imports before import analysis
const svelteImportRewritePlugin = (): Plugin => ({
  name: 'svelte-import-rewrite',
  enforce: 'pre',
  transform(code, id) {
    // Only process JS/TS files, not svelte files
    if (!/\.(js|ts|mjs|cjs)$/.test(id)) {
      return null;
    }
    
    let transformed = code;
    let changed = false;
    
    // Rewrite svelte/store imports
    if (transformed.includes('svelte/store')) {
      transformed = transformed.replace(
        /from\s+['"]svelte\/store['"]/g,
        `from '${path.resolve(__dirname, './node_modules/svelte/src/store/index-server.js')}'`
      );
      changed = true;
    }
    
    // Rewrite svelte/compiler imports
    if (transformed.includes('svelte/compiler')) {
      transformed = transformed.replace(
        /from\s+['"]svelte\/compiler['"]/g,
        `from '${path.resolve(__dirname, './node_modules/svelte/src/compiler/index.js')}'`
      );
      changed = true;
    }
    
    // Rewrite svelte/internal/client imports
    if (transformed.includes('svelte/internal/client')) {
      transformed = transformed.replace(
        /from\s+['"]svelte\/internal\/client['"]/g,
        `from '${path.resolve(__dirname, './node_modules/svelte/src/internal/client/index.js')}'`
      );
      changed = true;
    }
    
    // Rewrite svelte/internal/server imports
    if (transformed.includes('svelte/internal/server')) {
      transformed = transformed.replace(
        /from\s+['"]svelte\/internal\/server['"]/g,
        `from '${path.resolve(__dirname, './node_modules/svelte/src/internal/server/index.js')}'`
      );
      changed = true;
    }
    
    // Rewrite other svelte subpath imports
    const subpaths = ['animate', 'easing', 'internal', 'motion', 'transition'];
    for (const subpath of subpaths) {
      if (transformed.includes(`svelte/${subpath}`)) {
        transformed = transformed.replace(
          new RegExp(`from\\s+['"]svelte\\/${subpath}['"]`, 'g'),
          `from '${path.resolve(__dirname, `./node_modules/svelte/src/${subpath}/index.js`)}'`
        );
        changed = true;
      }
    }
    
    return changed ? { code: transformed, map: null } : null;
  }
});

export default defineConfig({
  plugins: [
    svelteImportRewritePlugin(),
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
      'svelte/motion': path.resolve(__dirname, './node_modules/svelte/src/motion/index.js'),
      'svelte/transition': path.resolve(__dirname, './node_modules/svelte/src/transition/index.js')
    }
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
