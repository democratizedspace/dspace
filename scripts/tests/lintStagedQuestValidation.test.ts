import { describe, it, expect } from 'vitest';

const config = require('../../.lintstagedrc.js');

describe('lint-staged quest validation', () => {
  it('runs quest schema validation on staged quest files', () => {
    const rule = config['frontend/src/pages/quests/json/**/*.json'];
    expect(rule).toBeDefined();
    const commands = typeof rule === 'function'
      ? rule(['frontend/src/pages/quests/json/foo.json'])
      : rule;
    const list = Array.isArray(commands) ? commands : [commands];
    expect(list.some((cmd) => String(cmd).includes('scripts/validate-quest.js'))).toBe(true);
  });
});
