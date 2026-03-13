import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

type ItemRef = { id?: string; count?: number };

const toRequiredIds = (value: unknown): string[] => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) {
        return value
            .flatMap((entry) => {
                if (!entry) return [];
                if (typeof entry === 'string') return [entry];
                if (typeof entry === 'object' && 'id' in entry) {
                    const id = (entry as ItemRef).id;
                    return typeof id === 'string' && id.trim() ? [id.trim()] : [];
                }
                return [];
            })
            .filter(Boolean);
    }
    if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
        const id = (value as ItemRef).id;
        return typeof id === 'string' && id.trim() ? [id.trim()] : [];
    }
    return [];
};

const getOptionRequiredItemIds = (option: any) =>
    [
        ...toRequiredIds(option?.requiresItems),
        ...toRequiredIds(option?.requiredItems),
        ...toRequiredIds(option?.requiredItemIds),
        ...toRequiredIds(option?.requiredItemId),
    ].filter(Boolean);

const hasPositivePrice = (value: unknown) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value > 0;
    }
    if (typeof value === 'string') {
        const match = value.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (!match) return false;
        const parsed = Number.parseFloat(match[1]);
        return Number.isFinite(parsed) && parsed > 0;
    }
    return false;
};

describe('required item obtainability guardrail', () => {
    it('ensures every quest-required item is buyable, process-created, or quest-granted', async () => {
        const quests = await loadQuests();
        const itemMap = new Map((items as Array<any>).map((item) => [item.id, item]));

        const requiredByItem = new Map<string, Set<string>>();
        for (const quest of quests) {
            const addUse = (itemId: string) => {
                if (!itemId) return;
                if (!requiredByItem.has(itemId)) requiredByItem.set(itemId, new Set<string>());
                requiredByItem.get(itemId)?.add(quest.id);
            };

            for (const itemId of toRequiredIds(quest?.requiresItems)) addUse(itemId);
            for (const itemId of toRequiredIds(quest?.requiredItems)) addUse(itemId);
            for (const itemId of toRequiredIds(quest?.requiredItemIds)) addUse(itemId);
            for (const itemId of toRequiredIds(quest?.requiredItemId)) addUse(itemId);

            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    for (const itemId of getOptionRequiredItemIds(option)) addUse(itemId);
                }
            }
        }

        const processCreated = new Set<string>();
        for (const process of processes as Array<any>) {
            for (const item of process.createItems ?? []) {
                if (typeof item?.id === 'string' && item.id.trim()) {
                    processCreated.add(item.id);
                }
            }
        }

        const questGranted = new Set<string>();
        for (const quest of quests) {
            for (const reward of quest.rewards ?? []) {
                if (typeof reward?.id === 'string' && reward.id.trim()) {
                    questGranted.add(reward.id);
                }
            }
            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    for (const grant of option.grantsItems ?? []) {
                        if (typeof grant?.id === 'string' && grant.id.trim()) {
                            questGranted.add(grant.id);
                        }
                    }
                }
            }
        }

        const unobtainable: string[] = [];
        for (const [itemId, questIds] of requiredByItem.entries()) {
            const item = itemMap.get(itemId);
            if (!item) {
                unobtainable.push(`Unknown item ${itemId} required by: ${[...questIds].join(', ')}`);
                continue;
            }

            const buyable = hasPositivePrice(item.price);
            const viaProcess = processCreated.has(itemId);
            const viaQuest = questGranted.has(itemId);

            if (!buyable && !viaProcess && !viaQuest) {
                unobtainable.push(
                    `${item.name} (${itemId}) required by ${[...questIds].join(', ')} is not buyable and has no process/quest source.`
                );
            }
        }

        expect(unobtainable).toEqual([]);
    });
});
