import { describe, expect, it } from 'vitest';

import {
  formatUnsupportedNodeVersionMessage,
  isSupportedNodeVersion,
  resolvePlaywrightCli,
} from '../scripts/run-remote-completionist-award-iii.mjs';

describe('resolvePlaywrightCli', () => {
  it('looks up the Playwright CLI package via require.resolve search paths', () => {
    const calls = [];
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (id, options) => {
      calls.push({ id, options });
      return '/repo/node_modules/@playwright/test/cli.js';
    });

    expect(resolved).toBe('/repo/node_modules/@playwright/test/cli.js');
    expect(calls).toEqual([
      {
        id: '@playwright/test/cli',
        options: {
          paths: ['/repo/frontend', '/repo'],
        },
      },
    ]);
  });

  it('resolves when Playwright CLI is available from repo root', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (_id, options) => {
      if (options?.paths?.[1] === '/repo') {
        return '/repo/node_modules/@playwright/test/cli.js';
      }
      throw new Error('not found');
    });

    expect(resolved).toBe('/repo/node_modules/@playwright/test/cli.js');
  });

  it('resolves when Playwright CLI is available from frontend', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], (_id, options) => {
      if (options?.paths?.[0] === '/repo/frontend') {
        return '/repo/frontend/node_modules/@playwright/test/cli.js';
      }
      throw new Error('not found');
    });

    expect(resolved).toBe('/repo/frontend/node_modules/@playwright/test/cli.js');
  });

  it('returns null when Playwright CLI is not resolvable from either path', () => {
    const resolved = resolvePlaywrightCli(['/repo/frontend', '/repo'], () => {
      throw new Error('MODULE_NOT_FOUND');
    });

    expect(resolved).toBeNull();
  });
});

describe('remote completionist harness node preflight', () => {
  it('rejects unsupported Node.js versions', () => {
    expect(isSupportedNodeVersion('18.18.0')).toBe(false);
    expect(isSupportedNodeVersion('22.0.0')).toBe(false);
  });

  it('accepts supported Node.js versions', () => {
    expect(isSupportedNodeVersion('20.0.0')).toBe(true);
    expect(isSupportedNodeVersion('21.9.1')).toBe(true);
  });

  it('surfaces a harness-prefixed remediation message for unsupported versions', () => {
    const message = formatUnsupportedNodeVersionMessage('18.18.0');

    expect(message).toContain('[qa:remote-completionist-award-iii]');
    expect(message).toContain('Unsupported Node.js version 18.18.0');
    expect(message).toContain('requires >=20 <22');
    expect(message).toContain('nvm use');
    expect(message).toContain('pnpm install');
  });
});
