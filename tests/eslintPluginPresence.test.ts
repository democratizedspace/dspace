import { describe, it, expect } from 'vitest';
import { join } from 'path';

describe('@typescript-eslint/eslint-plugin', () => {
  it('is installed', () => {
    const resolveFn = () =>
      require.resolve('@typescript-eslint/eslint-plugin', {
        paths: [join(__dirname, '..', 'frontend', 'node_modules')],
      });
    expect(resolveFn).not.toThrow();
  });
});
