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

  it('matches titles case-insensitively', () => {
    const quests = [{ id: 'q1', title: 'Existing Quest' }];
    expect(isQuestTitleUnique('existing quest', quests)).toBe(false);
    expect(isQuestTitleUnique('EXISTING QUEST', quests)).toBe(false);
  });

  it('ignores surrounding whitespace', () => {
    const quests = [{ id: 'q1', title: '  Existing Quest  ' }];
    expect(isQuestTitleUnique('Existing Quest', quests)).toBe(false);
    expect(isQuestTitleUnique('  Existing Quest  ', quests)).toBe(false);
  });
});
