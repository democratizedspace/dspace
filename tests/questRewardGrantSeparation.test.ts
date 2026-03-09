import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

type ItemRef = { id?: string };
type QuestOption = { grantsItems?: ItemRef[] };
type QuestNode = { options?: QuestOption[] };
type QuestDefinition = {
    id?: string;
    rewards?: ItemRef[];
    dialogue?: QuestNode[];
};

describe('quest reward/grant separation', () => {
    it('does not duplicate the same item in both option grants and quest-level rewards', () => {
        const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
        const files = globSync(path.join(questDir, '**/*.json')).sort();
        const duplicates: string[] = [];

        for (const file of files) {
            const quest = JSON.parse(readFileSync(file, 'utf8')) as QuestDefinition;
            const rewardIds = new Set((quest.rewards ?? []).map((reward) => reward.id).filter(Boolean));
            if (rewardIds.size === 0) {
                continue;
            }

            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    for (const grant of option.grantsItems ?? []) {
                        if (grant.id && rewardIds.has(grant.id)) {
                            duplicates.push(
                                `${quest.id ?? 'unknown quest'} :: duplicated item ${grant.id} in ${path.relative(
                                    questDir,
                                    file
                                )}`
                            );
                        }
                    }
                }
            }
        }

        expect(
            duplicates,
            `Items should not be awarded in both grantsItems and rewards in the same quest:\n${duplicates.join('\n')}`
        ).toEqual([]);
    });
});
