import { describe, it, expect } from 'vitest';
import { isQuestTitleUnique } from '../frontend/src/utils/questHelpers.js';

describe('isQuestTitleUnique', () => {
  it('detects duplicate titles', () => {
    const quests = [
      { id: 'q1', title: 'Existing Quest' },
      { id: 'q2', title: 'Another Quest' },
    ];
    expect(isQuestTitleUnique('Existing Quest', quests)).toBe(false);
    expect(isQuestTitleUnique('New Quest', quests)).toBe(true);
    expect(isQuestTitleUnique('Existing Quest', quests, 'q1')).toBe(true);
  });
});
