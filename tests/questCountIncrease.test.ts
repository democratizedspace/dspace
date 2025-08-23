import { describe, it, expect } from 'vitest';
import compare from '../scripts/compareQuestCount.js';

const { listQuestFiles, BASE_COMMIT } = compare as {
  listQuestFiles: (ref?: string) => string[];
  BASE_COMMIT: string;
};

describe('quest count increase', () => {
  it('has at least 10x more quests than v2.1', () => {
    const base = listQuestFiles(BASE_COMMIT).length;
    const current = listQuestFiles().length;
    expect(current).toBeGreaterThanOrEqual(base * 10);
  });
});
