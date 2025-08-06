import { describe, it, expect } from 'vitest';

const lintStagedConfig = require('../../.lintstagedrc.js');

describe('lint-staged quest validation', () => {
  it('runs schema validation for quest JSON files', () => {
    const rule = lintStagedConfig['frontend/src/pages/quests/json/**/*.json'];
    expect(rule).toBeDefined();
    const cmd = typeof rule === 'function'
      ? rule(['frontend/src/pages/quests/json/test.json'])
      : rule;
    expect(cmd).toContain('scripts/validate-quest.js');
    expect(cmd).toContain('frontend/src/pages/quests/json/test.json');
  });
});
