import { describe, expect, it } from 'vitest';

const {
  addNodeWarningFilterToEnv,
  isKnownThirdPartyExperimentalWarning,
} = require('../scripts/node-warning-filter.cjs');

describe('node third-party warning filter', () => {
  it('matches npm debug/supports-color CommonJS-to-ESM experimental warning noise', () => {
    expect(
      isKnownThirdPartyExperimentalWarning(
        'CommonJS module /opt/homebrew/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /opt/homebrew/lib/node_modules/npm/node_modules/supports-color/index.js using require().'
      )
    ).toBe(true);
  });

  it('matches ESLint eslintrc/svelte-eslint-parser CommonJS-to-ESM experimental warning noise', () => {
    expect(
      isKnownThirdPartyExperimentalWarning(
        'CommonJS module /repo/node_modules/.pnpm/@eslint+eslintrc@3.3.1/node_modules/@eslint/eslintrc/dist/eslintrc.cjs is loading ES Module /repo/node_modules/.pnpm/svelte-eslint-parser@1.4.1_svelte@5.46.0/node_modules/svelte-eslint-parser/lib/index.js using require().'
      )
    ).toBe(true);
  });

  it('does not match unrelated application experimental warnings', () => {
    expect(
      isKnownThirdPartyExperimentalWarning(
        'CommonJS module /repo/src/app.cjs is loading ES Module /repo/src/app.mjs using require().'
      )
    ).toBe(false);
  });

  it('prepends its preload hook without dropping existing NODE_OPTIONS', () => {
    const env = addNodeWarningFilterToEnv({ NODE_OPTIONS: '--trace-warnings' });

    expect(env.NODE_OPTIONS).toContain('--require=');
    expect(env.NODE_OPTIONS).toContain('node-warning-filter.cjs');
    expect(env.NODE_OPTIONS).toContain('--trace-warnings');
  });
});
