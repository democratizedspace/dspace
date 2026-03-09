import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

type QuestOption = {
    type?: string;
};

type QuestNode = {
    id?: string;
    options?: QuestOption[];
};

type QuestDefinition = {
    id?: string;
    dialogue?: QuestNode[];
};

describe('quest process recovery paths', () => {
    it('requires a non-process fallback option on nodes that run processes', () => {
        const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
        const files = globSync(path.join(questDir, '**/*.json')).sort();
        const issues: string[] = [];

        for (const file of files) {
            const quest = JSON.parse(readFileSync(file, 'utf8')) as QuestDefinition;
            for (const node of quest.dialogue ?? []) {
                const options = node.options ?? [];
                const hasProcessOption = options.some((option) => option.type === 'process');
                if (!hasProcessOption) {
                    continue;
                }

                const hasRecoveryOption = options.some(
                    (option) => option.type && option.type !== 'process' && option.type !== 'finish'
                );

                if (!hasRecoveryOption) {
                    issues.push(
                        `${quest.id ?? 'unknown quest'} :: ${node.id ?? 'unknown node'} in ${path.relative(
                            questDir,
                            file
                        )}`
                    );
                }
            }
        }

        expect(
            issues,
            `Process nodes need an explicit recovery/retry option (goto/grantsItems/etc):\n${issues.join('\n')}`
        ).toEqual([]);
    });
});
