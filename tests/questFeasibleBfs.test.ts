import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { loadQuestPaths } from './utils/questPaths';

type ItemRef = { id: string; count: number };

type Quest = {
    id: string;
    start?: string;
    dialogue?: Array<{
        id?: string;
        options?: Array<{
            type?: string;
            goto?: string;
            requiresItems?: ItemRef[];
            grantsItems?: ItemRef[];
        }>;
    }>;
    rewards?: ItemRef[];
    requiresQuests?: string[];
};

const toIds = (entries: ItemRef[] | undefined) => (entries ?? []).map((entry) => entry.id);

const getRequiredIds = (option: any) => toIds(option?.requiresItems);

const getGrantedIds = (quest: Quest) => {
    const ids = new Set<string>(toIds(quest.rewards));
    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            for (const id of toIds(option.grantsItems)) ids.add(id);
        }
    }
    return ids;
};

describe('quest BFS feasibility', () => {
    it('requires every quest to have a feasible BFS path to finish with obtainable items', async () => {
        const allQuests = (await loadQuests()) as Quest[];
        const questPaths = await loadQuestPaths();
        const questById = new Map(allQuests.map((quest) => [quest.id, quest]));

        const itemById = new Map((items as Array<any>).map((item) => [item.id, item]));
        const processesByCreateItem = new Map<string, any[]>();
        for (const process of processes as Array<any>) {
            for (const created of process.createItems ?? []) {
                if (!processesByCreateItem.has(created.id)) {
                    processesByCreateItem.set(created.id, []);
                }
                processesByCreateItem.get(created.id)?.push(process);
            }
        }

        const dependencyIdsForQuest = (quest: Quest) => {
            const seen = new Set<string>();
            const stack = [...(quest.requiresQuests ?? [])];
            while (stack.length > 0) {
                const id = stack.pop();
                if (!id || seen.has(id)) continue;
                seen.add(id);
                const dependency = questById.get(id);
                for (const parent of dependency?.requiresQuests ?? []) stack.push(parent);
            }
            return seen;
        };

        const errors: string[] = [];

        for (const quest of allQuests) {
            const dependencyGranted = new Set<string>();
            for (const dependencyId of dependencyIdsForQuest(quest)) {
                const dependency = questById.get(dependencyId);
                if (!dependency) continue;
                for (const id of getGrantedIds(dependency)) dependencyGranted.add(id);
            }
            for (const id of getGrantedIds(quest)) dependencyGranted.add(id);

            const memo = new Map<string, boolean>();
            const visiting = new Set<string>();
            const isObtainable = (itemId: string): boolean => {
                if (!itemId) return false;
                if (dependencyGranted.has(itemId)) return true;
                if (memo.has(itemId)) return memo.get(itemId) ?? false;

                const item = itemById.get(itemId);
                if (!item) {
                    memo.set(itemId, false);
                    return false;
                }

                if (typeof item.price === 'string' && item.price.trim().length > 0) {
                    memo.set(itemId, true);
                    return true;
                }

                if (visiting.has(itemId)) return false;
                visiting.add(itemId);

                const producers = processesByCreateItem.get(itemId) ?? [];
                const fromProcess = producers.some((process) => {
                    const inputs = [...toIds(process.requireItems), ...toIds(process.consumeItems)];
                    return inputs.every((id) => isObtainable(id));
                });

                visiting.delete(itemId);
                memo.set(itemId, fromProcess);
                return fromProcess;
            };

            const dialogue = quest.dialogue ?? [];
            const nodes = new Map(
                dialogue
                    .filter((node) => typeof node.id === 'string' && node.id)
                    .map((node) => [node.id as string, node])
            );
            const startId = quest.start || 'start';
            if (!nodes.has(startId)) {
                errors.push(`Quest "${quest.id}" missing start node "${startId}".`);
                continue;
            }

            const reachable = new Set<string>();
            const queue = [startId];
            while (queue.length > 0) {
                const nodeId = queue.shift();
                if (!nodeId || reachable.has(nodeId)) continue;
                reachable.add(nodeId);
                const node = nodes.get(nodeId);
                if (!node) continue;
                for (const option of node.options ?? []) {
                    const optionFeasible = getRequiredIds(option).every((id) => isObtainable(id));
                    if (!optionFeasible) continue;
                    if (option.type === 'goto' && option.goto && nodes.has(option.goto)) {
                        queue.push(option.goto);
                    }
                }
            }

            const reverseEdges = new Map<string, string[]>();
            const finishNodes = new Set<string>();
            for (const node of dialogue) {
                const nodeId = node.id;
                if (!nodeId || !nodes.has(nodeId)) continue;
                for (const option of node.options ?? []) {
                    const optionFeasible = getRequiredIds(option).every((id) => isObtainable(id));
                    if (!optionFeasible) continue;
                    if (option.type === 'finish') finishNodes.add(nodeId);
                    if (option.type === 'goto' && option.goto && nodes.has(option.goto)) {
                        if (!reverseEdges.has(option.goto)) reverseEdges.set(option.goto, []);
                        reverseEdges.get(option.goto)?.push(nodeId);
                    }
                }
            }

            const canReachFinish = new Set<string>();
            const reverseQueue = [...finishNodes];
            while (reverseQueue.length > 0) {
                const nodeId = reverseQueue.shift();
                if (!nodeId || canReachFinish.has(nodeId)) continue;
                canReachFinish.add(nodeId);
                for (const parent of reverseEdges.get(nodeId) ?? []) reverseQueue.push(parent);
            }

            const deadEnds = [...reachable].filter((nodeId) => !canReachFinish.has(nodeId));
            if (!canReachFinish.has(startId) || deadEnds.length > 0) {
                const questPath = questPaths.get(quest.id) ?? 'unknown path';
                errors.push(
                    `Quest "${quest.id}" (${questPath}) has no feasible finish path from start. ` +
                        `Dead-end reachable nodes: ${deadEnds.join(', ') || 'none'}.`
                );
            }
        }

        expect(errors).toEqual([]);
    });
});
