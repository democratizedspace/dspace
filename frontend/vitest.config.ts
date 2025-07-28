import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '..',
  test: {
    include: ['tests/**/*.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
  },
  coverage: {
    provider: 'v8'
  }
});
