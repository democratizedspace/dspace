import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type ItemRef = {
    id: string;
};

type QuestOption = {
    type?: string;
    grantsItems?: ItemRef[];
};

type QuestNode = {
    options?: QuestOption[];
};

type QuestData = {
    id: string;
    rewards?: ItemRef[];
    dialogue?: QuestNode[];
};

describe('quest reward/grant separation', () => {
    it('prevents quests from awarding the same item via grantsItems and top-level rewards', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;
            const rewardIds = new Set((quest.rewards ?? []).map((reward) => reward.id));
            if (rewardIds.size === 0) continue;

            const grantedIds = new Set<string>();
            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    if (option.type !== 'grantsItems') continue;
                    for (const grant of option.grantsItems ?? []) {
                        grantedIds.add(grant.id);
                    }
                }
            }

            const duplicates = [...rewardIds].filter((id) => grantedIds.has(id));
            if (duplicates.length === 0) continue;

            flagged.push(`${quest.id}: ${duplicates.join(', ')}`);
        }

        expect(flagged).toEqual([]);
    });
});
