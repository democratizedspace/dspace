import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { loadQuestPaths } from './utils/questPaths';

type ItemRef = { id?: string } | string;

const toItemIds = (refs: ItemRef[] | undefined): string[] => {
    if (!Array.isArray(refs)) {
        return [];
    }

    return refs
        .map((entry) => {
            if (typeof entry === 'string') {
                return entry;
            }
            if (entry && typeof entry.id === 'string') {
                return entry.id;
            }
            return '';
        })
        .filter(Boolean);
};

describe('item reference integrity', () => {
    it('ensures quests and processes only reference inventory item ids that exist', async () => {
        const itemIds = new Set(items.map((item) => item.id));
        const quests = await loadQuests();
        const questPaths = await loadQuestPaths();
        const errors: string[] = [];

        for (const quest of quests) {
            const questPath = questPaths.get(quest.id) ?? 'unknown path';
            const questLevelRefs = [...toItemIds(quest.requiresItems), ...toItemIds(quest.rewards)];
            for (const itemId of questLevelRefs) {
                if (!itemIds.has(itemId)) {
                    errors.push(
                        `Quest ${quest.id} (${questPath}) has unknown quest-level item id ${itemId}.`
                    );
                }
            }

            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    const optionRefs = [
                        ...toItemIds(option.requiresItems),
                        ...toItemIds(option.grantsItems),
                    ];

                    for (const itemId of optionRefs) {
                        if (!itemIds.has(itemId)) {
                            errors.push(
                                `Quest ${quest.id} (${questPath}) node ${node.id} has unknown item id ${itemId}.`
                            );
                        }
                    }
                }
            }
        }

        for (const process of processes) {
            const processRefs = [
                ...toItemIds(process.requireItems),
                ...toItemIds(process.consumeItems),
                ...toItemIds(process.createItems),
            ];

            for (const itemId of processRefs) {
                if (!itemIds.has(itemId)) {
                    errors.push(`Process ${process.id} has unknown item id ${itemId}.`);
                }
            }
        }

        expect(errors).toEqual([]);
    });
});
