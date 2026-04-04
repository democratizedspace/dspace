import { describe, expect, test } from 'vitest';
import {
  classifyQuestList,
  QUEST_LIST_STATUS,
} from '../frontend/src/utils/quests/listClassifier.js';

describe('quest list classifier', () => {
  const quests = [
    { id: 'welcome/start', requiresQuests: [] },
    { id: 'welcome/next', requiresQuests: ['welcome/start'] },
    { id: 'welcome/branch', requiresQuests: ['welcome/start', 'welcome/next'] },
  ];

  test('returns unknown status when no authoritative snapshot is available', () => {
    const result = classifyQuestList({ quests });
    expect(
      result.every((quest) => quest.status === QUEST_LIST_STATUS.UNKNOWN)
    ).toBe(true);
  });

  test('classifies from authoritative snapshot without optimistic fallback', () => {
    const result = classifyQuestList({
      quests,
      snapshot: {
        isAuthoritative: true,
        completedQuestIds: ['welcome/start'],
      },
    });

    expect(result.find((quest) => quest.id === 'welcome/start')?.status).toBe(
      QUEST_LIST_STATUS.COMPLETED
    );
    expect(result.find((quest) => quest.id === 'welcome/next')?.status).toBe(
      QUEST_LIST_STATUS.AVAILABLE
    );
    expect(result.find((quest) => quest.id === 'welcome/branch')?.status).toBe(
      QUEST_LIST_STATUS.LOCKED
    );
  });
});
