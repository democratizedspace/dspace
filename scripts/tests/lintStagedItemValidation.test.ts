import { describe, it, expect } from 'vitest';

const config = require('../../.lintstagedrc.js');

describe('lint-staged item validation', () => {
  it('runs item schema validation on staged item files', () => {
    const rule = config['frontend/src/pages/inventory/json/**/*.json'];
    expect(rule).toBeDefined();
    const commands = typeof rule === 'function'
      ? rule(['frontend/src/pages/inventory/json/foo.json'])
      : rule;
    const list = Array.isArray(commands) ? commands : [commands];
    expect(list.some((cmd) => String(cmd).includes('scripts/validate-item.js'))).toBe(true);
  });
});
