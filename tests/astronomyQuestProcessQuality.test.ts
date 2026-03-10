import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
  type?: string;
  process?: string;
};

type QuestNode = {
  options?: QuestOption[];
};

type QuestData = {
  id: string;
  dialogue?: QuestNode[];
};

describe('astronomy quest process quality', () => {
  it('requires every astronomy quest to include at least one executable process option', async () => {
    const questPaths = await loadQuestPaths();

    const astronomyQuestPaths = [...questPaths.values()].filter((questPath) =>
      questPath.includes(path.join('quests', 'json', 'astronomy'))
    );
    expect(astronomyQuestPaths.length).toBeGreaterThan(0);

    const bareQuestIds: string[] = [];

    for (const questPath of astronomyQuestPaths) {
      const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;
      const processOptionCount = (quest.dialogue ?? []).flatMap((node) => node.options ?? []).filter(
        (option) => option.type === 'process' && typeof option.process === 'string' && option.process.trim()
      ).length;

      if (processOptionCount === 0) {
        bareQuestIds.push(quest.id);
      }
    }

    expect(bareQuestIds).toEqual([]);
  });

  it('forbids astronomy options from declaring process ids unless type is process', async () => {
    const questPaths = await loadQuestPaths();

    const leakedProcessRefs: string[] = [];

    for (const questPath of questPaths.values()) {
      if (!questPath.includes(path.join('quests', 'json', 'astronomy'))) continue;
      const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;

      for (const [nodeIndex, node] of (quest.dialogue ?? []).entries()) {
        for (const [optionIndex, option] of (node.options ?? []).entries()) {
          if (!option.process) continue;
          if (option.type === 'process') continue;
          leakedProcessRefs.push(`${quest.id}#${nodeIndex}:${optionIndex}`);
        }
      }
    }

    expect(leakedProcessRefs).toEqual([]);
  });
});
