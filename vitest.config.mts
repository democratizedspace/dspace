import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { createSvelteSubpathResolver } from './scripts/svelteSubpathResolver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sveltePackageDir = path.dirname(require.resolve('svelte/package.json'));
const svelteStorePath = require.resolve('svelte/store');
const svelteCompilerPath = require.resolve('svelte/compiler');
const svelteInternalServerPath = path.join(
  sveltePackageDir,
  'src/internal/server/index.js'
);

const svelteInternalPath = (() => {
  try {
    return require.resolve('svelte/internal/client');
  } catch (error) {
    return require.resolve('svelte/internal');
  }
})();

export default defineConfig({
  plugins: [
    createSvelteSubpathResolver(),
    svelte({
      configFile: path.resolve(__dirname, './svelte.config.js'),
    }),
  ],
  resolve: {
    alias: [
      {
        find: 'svelte/store',
        replacement: svelteStorePath,
      },
      {
        find: 'svelte/internal/client',
        replacement: svelteInternalPath,
      },
      {
        find: 'svelte/internal/server',
        replacement: svelteInternalServerPath,
      },
      {
        find: 'svelte/internal/disclose-version',
        replacement: path.join(
          sveltePackageDir,
          'src/internal/disclose-version.js'
        ),
      },
      {
        find: 'svelte/internal/flags/legacy',
        replacement: path.join(
          sveltePackageDir,
          'src/internal/flags/legacy.js'
        ),
      },
      {
        find: 'svelte/internal/flags/async',
        replacement: path.join(sveltePackageDir, 'src/internal/flags/async.js'),
      },
      {
        find: 'svelte/internal/flags/tracing',
        replacement: path.join(
          sveltePackageDir,
          'src/internal/flags/tracing.js'
        ),
      },
      {
        find: 'svelte/compiler',
        replacement: svelteCompilerPath,
      },
      {
        find: 'svelte',
        replacement: path.join(sveltePackageDir, 'src/index-client.js'),
      },
    ],
    dedupe: ['svelte'],
  },
  ssr: {
    noExternal: [
      'svelte',
      '@testing-library/svelte',
      /^svelte\//, // Include all svelte subpath imports
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['svelte'],
      },
    },
    include: [
      'tests/**/*.test.ts',
      'scripts/tests/**/*.test.ts',
      'backend/**/*.test.ts',
      'frontend/src/components/__tests__/**/*.spec.ts',
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
        'frontend/src/components/**/*.svelte',
      ],
      exclude: ['**/node_modules/**', '**/generated/**', '**/*.d.ts'],
    },
  },
});
