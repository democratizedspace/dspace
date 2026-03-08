import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { loadQuestPaths } from './utils/questPaths';

type ItemCount = { id: string; count?: number };

type QuestOption = {
    type?: string;
    text?: string;
    requiresItems?: ItemCount[];
    grantsItems?: ItemCount[];
};

type QuestNode = {
    id?: string;
    options?: QuestOption[];
};

type QuestData = {
    id?: string;
    dialogue?: QuestNode[];
};

const findSameStepGrantGateViolations = (quest: QuestData) => {
    const violations: string[] = [];

    for (const node of quest.dialogue ?? []) {
        const grantsByItem = new Map<string, number>();

        for (const option of node.options ?? []) {
            if (option.type !== 'grantsItems') continue;
            for (const grant of option.grantsItems ?? []) {
                if (!grant?.id) continue;
                const count = Number(grant.count ?? 0);
                if (!Number.isFinite(count) || count <= 0) continue;
                grantsByItem.set(grant.id, (grantsByItem.get(grant.id) ?? 0) + count);
            }
        }

        if (grantsByItem.size === 0) continue;

        for (const option of node.options ?? []) {
            if (option.type !== 'goto') continue;
            for (const requirement of option.requiresItems ?? []) {
                if (!requirement?.id) continue;
                if (!grantsByItem.has(requirement.id)) continue;

                const requiredCount = Number(requirement.count ?? 0);
                const grantedCount = grantsByItem.get(requirement.id) ?? 0;

                if (!Number.isFinite(requiredCount) || requiredCount <= grantedCount) {
                    continue;
                }

                violations.push(
                    [
                        `quest=${quest.id ?? 'unknown'}`,
                        `node=${node.id ?? 'unknown'}`,
                        `item=${requirement.id}`,
                        `required=${requiredCount}`,
                        `grantedInNode=${grantedCount}`,
                        `option=${option.text ?? 'unknown'}`,
                    ].join(' ')
                );
            }
        }
    }

    return violations;
};

describe('quest gate consistency for same-step grants', () => {
    it('catches the top-off style regression in a minimal fixture', () => {
        const brokenFixture: QuestData = {
            id: 'regression/top-off-like',
            dialogue: [
                {
                    id: 'start',
                    options: [
                        {
                            type: 'grantsItems',
                            grantsItems: [{ id: 'hydro-tub', count: 1 }],
                        },
                        {
                            type: 'goto',
                            text: 'Continue',
                            requiresItems: [{ id: 'hydro-tub', count: 2 }],
                        },
                    ],
                },
            ],
        };

        expect(findSameStepGrantGateViolations(brokenFixture)).toEqual([
            'quest=regression/top-off-like node=start item=hydro-tub required=2 grantedInNode=1 option=Continue',
        ]);
    });

    it('prevents requiring more of an item than can be claimed in the same step', async () => {
        const questPaths = await loadQuestPaths();
        const violations: string[] = [];

        for (const questPath of questPaths.values()) {
            const raw = await readFile(path.join(process.cwd(), questPath), 'utf8');
            const quest = JSON.parse(raw) as QuestData;
            violations.push(...findSameStepGrantGateViolations(quest));
        }

        expect(violations).toEqual([]);
    });
});
