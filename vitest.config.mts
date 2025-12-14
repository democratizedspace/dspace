import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sveltePackageDir = path.dirname(require.resolve('svelte/package.json'));
const svelteStorePath = require.resolve('svelte/store');
const svelteInternalClientPath = require.resolve('svelte/internal/client');
const svelteCompilerPath = require.resolve('svelte/compiler');

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      {
        find: 'svelte/store',
        replacement: svelteStorePath
      },
      {
        find: 'svelte/internal/client',
        replacement: svelteInternalClientPath
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['svelte']
      }
    },
    include: ['tests/**/*.test.ts', 'scripts/tests/**/*.test.ts', 'backend/**/*.test.ts'],
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
