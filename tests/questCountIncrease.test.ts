import { describe, it, expect } from 'vitest';
import { listQuestFiles, BASE_COMMIT } from '../scripts/compareQuestCount.mjs';

describe('quest count increase', () => {
  it('has at least 10x more quests than v2.1', () => {
    const base = listQuestFiles(BASE_COMMIT).length;
    const current = listQuestFiles().length;
    expect(current).toBeGreaterThanOrEqual(base * 10);
  });
});
