import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const warningFilterPath = path.join(
  process.cwd(),
  'scripts',
  'node-warning-filter.cjs'
);

function runWarningProbe(script: string) {
  return spawnSync(
    process.execPath,
    ['--no-warnings', '--require', warningFilterPath, '-e', script],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    }
  );
}

describe('node warning filter', () => {
  it('suppresses known npm debug/supports-color ExperimentalWarning noise', () => {
    const result = runWarningProbe(`
            process.emitWarning(
                'CommonJS module /opt/homebrew/lib/node_modules/npm/node_modules/debug/src/node.js is loading ES Module /opt/homebrew/lib/node_modules/npm/node_modules/supports-color/index.js using require().',
                { type: 'ExperimentalWarning' }
            );
        `);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('suppresses known ESLint eslintrc/svelte-parser ExperimentalWarning noise', () => {
    const result = runWarningProbe(`
            process.emitWarning(
                'CommonJS module /workspace/dspace/node_modules/.pnpm/@eslint+eslintrc@3.3.1/node_modules/@eslint/eslintrc/dist/eslintrc.cjs is loading ES Module /workspace/dspace/node_modules/.pnpm/svelte-eslint-parser@1.4.1_svelte@5.46.0/node_modules/svelte-eslint-parser/lib/index.js using require().',
                { type: 'ExperimentalWarning' }
            );
        `);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('re-emits unrelated warnings so failures remain diagnosable', () => {
    const result = runWarningProbe(`
            process.emitWarning('keep this warning visible', { type: 'ExperimentalWarning' });
        `);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain(
      'ExperimentalWarning: keep this warning visible'
    );
  });
});
