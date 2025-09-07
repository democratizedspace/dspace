import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      'svelte/store': path.resolve(__dirname, 'tests/svelte-store.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
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
