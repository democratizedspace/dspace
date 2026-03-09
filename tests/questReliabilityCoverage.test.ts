import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
  type?: string;
  process?: string;
};

type QuestData = {
  id: string;
  dialogue?: Array<{ options?: QuestOption[] }>;
};

const RELIABILITY_TEST_QUEST = /(^|\/)([^/]+-)?test(s)?$/i;

const hasProcessOption = (quest: QuestData) =>
  (quest.dialogue ?? []).some((node) =>
    (node.options ?? []).some(
      (option) =>
        option.type === 'process' &&
        typeof option.process === 'string' &&
        option.process.trim().length > 0
    )
  );

describe('quest reliability coverage', () => {
  it('requires process-backed execution steps in test-focused quests', async () => {
    const questPaths = await loadQuestPaths();
    const quests = await Promise.all(
      [...questPaths.values()].map(
        async (questPath) =>
          JSON.parse(await readFile(questPath, 'utf8')) as QuestData
      )
    );

    const testQuests = quests.filter((quest) =>
      RELIABILITY_TEST_QUEST.test(quest.id)
    );
    expect(testQuests.length).toBeGreaterThan(0);

    const flagged = testQuests
      .filter((quest) => !hasProcessOption(quest))
      .map((quest) => quest.id);

    expect(flagged).toEqual([]);
  });
});
