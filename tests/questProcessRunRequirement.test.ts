import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

interface ItemCount {
    id: string;
    count: number;
}

type Inventory = Map<string, number>;

type Quest = {
    id: string;
    dialogue?: Array<{
        id: string;
        options?: Array<{
            type: string;
            text?: string;
            goto?: string;
            process?: string;
            requiresItems?: ItemCount[];
            grantsItems?: ItemCount[];
        }>;
    }>;
    start?: string;
    requiresQuests?: string[];
    rewards?: ItemCount[];
};

type ProcessDef = {
    id: string;
    requireItems?: ItemCount[];
    consumeItems?: ItemCount[];
    createItems?: ItemCount[];
};

type State = {
    nodeId: string;
    processRuns: number;
    inventory: Inventory;
};

const epsilon = 1e-9;

const normalizeEntries = (entries: ItemCount[] | undefined): ItemCount[] =>
    (entries ?? [])
        .filter((entry) => typeof entry?.id === 'string' && Number.isFinite(entry?.count))
        .map((entry) => ({ id: entry.id, count: Number(entry.count) }))
        .filter((entry) => entry.count > epsilon);

const getCount = (inventory: Inventory, itemId: string): number => inventory.get(itemId) ?? 0;

const setCount = (inventory: Inventory, itemId: string, count: number) => {
    if (count <= epsilon) {
        inventory.delete(itemId);
        return;
    }
    inventory.set(itemId, count);
};

const addCount = (inventory: Inventory, itemId: string, delta: number) => {
    setCount(inventory, itemId, getCount(inventory, itemId) + delta);
};

const cloneInventory = (inventory: Inventory): Inventory => new Map(inventory);

const mergeInventories = (inventories: Inventory[]): Inventory => {
    const merged: Inventory = new Map();
    for (const inventory of inventories) {
        for (const [itemId, count] of inventory.entries()) {
            addCount(merged, itemId, count);
        }
    }
    return merged;
};

const addToCap = (caps: Map<string, number>, itemId: string, count: number) => {
    if (!itemId || !Number.isFinite(count) || count <= epsilon) return;
    const current = caps.get(itemId) ?? 0;
    caps.set(itemId, Math.max(current, count));
};

const getQuestCaps = (quest: Quest, processMap: Map<string, ProcessDef>) => {
    const caps = new Map<string, number>();

    for (const reward of normalizeEntries(quest.rewards)) addToCap(caps, reward.id, reward.count + 1);

    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            for (const requirement of normalizeEntries(option.requiresItems)) {
                addToCap(caps, requirement.id, requirement.count + 1);
            }
            for (const grant of normalizeEntries(option.grantsItems)) {
                addToCap(caps, grant.id, grant.count + 1);
            }

            if (option.type === 'process' && option.process) {
                const process = processMap.get(option.process);
                if (!process) continue;

                for (const requirement of normalizeEntries(process.requireItems)) {
                    addToCap(caps, requirement.id, requirement.count + 1);
                }
                for (const consumed of normalizeEntries(process.consumeItems)) {
                    addToCap(caps, consumed.id, consumed.count + 1);
                }
                for (const created of normalizeEntries(process.createItems)) {
                    addToCap(caps, created.id, created.count + 1);
                }
            }
        }
    }

    return caps;
};

const projectInventoryWithCaps = (inventory: Inventory, caps: Map<string, number>) => {
    const projected: Inventory = new Map();
    for (const [itemId, cap] of caps.entries()) {
        const count = Math.min(getCount(inventory, itemId), cap);
        if (count > epsilon) projected.set(itemId, count);
    }
    return projected;
};

const inventoryKey = (nodeId: string, inventory: Inventory, caps: Map<string, number>) => {
    const parts: string[] = [nodeId];
    for (const itemId of [...caps.keys()].sort()) {
        parts.push(`${itemId}:${getCount(inventory, itemId).toFixed(6)}`);
    }
    return parts.join('|');
};

const canSatisfyRequirements = (inventory: Inventory, requirements: ItemCount[]) =>
    requirements.every((requirement) => getCount(inventory, requirement.id) + epsilon >= requirement.count);

const applyEntries = (
    inventory: Inventory,
    entries: ItemCount[],
    direction: 1 | -1,
    caps: Map<string, number>
): Inventory => {
    const next = cloneInventory(inventory);
    for (const entry of entries) {
        const cap = caps.get(entry.id);
        const raw = getCount(next, entry.id) + direction * entry.count;
        const nextCount = cap === undefined ? raw : Math.min(raw, cap);
        setCount(next, entry.id, nextCount);
    }
    return next;
};

const simulateQuest = ({
    quest,
    startingInventory,
    processMap,
}: {
    quest: Quest;
    startingInventory: Inventory;
    processMap: Map<string, ProcessDef>;
}): { minProcessRuns: number; endingInventory: Inventory } => {
    const dialogue = quest.dialogue ?? [];
    const nodeMap = new Map(dialogue.map((node) => [node.id, node]));
    const startId = quest.start?.trim() || dialogue[0]?.id;
    if (!startId || !nodeMap.has(startId)) {
        return { minProcessRuns: Number.POSITIVE_INFINITY, endingInventory: cloneInventory(startingInventory) };
    }

    const caps = getQuestCaps(quest, processMap);
    const projectedStart = projectInventoryWithCaps(startingInventory, caps);
    const queue: State[] = [{ nodeId: startId, processRuns: 0, inventory: projectedStart }];
    const bestRunByState = new Map<string, number>();

    let bestFinishRuns = Number.POSITIVE_INFINITY;
    let bestFinishInventory = cloneInventory(startingInventory);

    while (queue.length > 0) {
        queue.sort((left, right) => left.processRuns - right.processRuns);
        const current = queue.shift() as State;

        if (current.processRuns > bestFinishRuns) break;

        const stateKey = inventoryKey(current.nodeId, current.inventory, caps);
        const knownRuns = bestRunByState.get(stateKey);
        if (knownRuns !== undefined && knownRuns <= current.processRuns) {
            continue;
        }
        bestRunByState.set(stateKey, current.processRuns);

        const node = nodeMap.get(current.nodeId);
        if (!node) continue;

        for (const option of node.options ?? []) {
            const optionRequirements = normalizeEntries(option.requiresItems);
            if (!canSatisfyRequirements(current.inventory, optionRequirements)) {
                continue;
            }
            let optionInventory = cloneInventory(current.inventory);

            if (option.type === 'process') {
                if (!option.process) continue;
                const process = processMap.get(option.process);
                if (!process) continue;

                const processRequirements = [
                    ...normalizeEntries(process.requireItems),
                    ...normalizeEntries(process.consumeItems),
                ];

                if (!canSatisfyRequirements(optionInventory, processRequirements)) {
                    continue;
                }
                const consumedInventory = applyEntries(
                    optionInventory,
                    normalizeEntries(process.consumeItems),
                    -1,
                    caps
                );
                const createdInventory = applyEntries(
                    consumedInventory,
                    normalizeEntries(process.createItems),
                    1,
                    caps
                );

                queue.push({
                    nodeId: current.nodeId,
                    processRuns: current.processRuns + 1,
                    inventory: createdInventory,
                });
                continue;
            }

            const withGrants = applyEntries(
                optionInventory,
                normalizeEntries(option.grantsItems),
                1,
                caps
            );

            if (option.type === 'finish') {
                if (current.processRuns < bestFinishRuns) {
                    bestFinishRuns = current.processRuns;
                    const withRewards = applyEntries(
                        withGrants,
                        normalizeEntries(quest.rewards),
                        1,
                        new Map()
                    );
                    bestFinishInventory = mergeInventories([startingInventory, withRewards]);
                }
                continue;
            }

            if (option.type === 'goto' && option.goto && nodeMap.has(option.goto)) {
                queue.push({
                    nodeId: option.goto,
                    processRuns: current.processRuns,
                    inventory: withGrants,
                });
            }
        }
    }

    return { minProcessRuns: bestFinishRuns, endingInventory: bestFinishInventory };
};


const getProcessCreatedItemIds = (quest: Quest, processMap: Map<string, ProcessDef>) => {
    const created = new Set<string>();
    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.type !== 'process' || !option.process) continue;
            const process = processMap.get(option.process);
            if (!process) continue;
            for (const item of normalizeEntries(process.createItems)) {
                created.add(item.id);
            }
        }
    }
    return created;
};

const questCanBypassProcessViaCreatedItem = (quest: Quest, processMap: Map<string, ProcessDef>) => {
    const created = getProcessCreatedItemIds(quest, processMap);
    if (created.size === 0) return false;

    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.type === 'process') continue;
            for (const requirement of normalizeEntries(option.requiresItems)) {
                if (created.has(requirement.id)) {
                    return true;
                }
            }
        }
    }
    return false;
};

describe('quest progression requires process execution', () => {
    it('requires at least one process run after simulating prerequisite inventories', async () => {
        const allQuests = (await loadQuests()) as Quest[];
        const questMap = new Map(allQuests.map((quest) => [quest.id, quest]));
        const processMap = new Map((processes as ProcessDef[]).map((process) => [process.id, process]));

        const memo = new Map<string, { minProcessRuns: number; endingInventory: Inventory }>();
        const visiting = new Set<string>();

        const simulateQuestWithDependencies = (questId: string) => {
            const cached = memo.get(questId);
            if (cached) return cached;
            if (visiting.has(questId)) {
                throw new Error(`Dependency cycle while simulating quest inventory at ${questId}`);
            }

            const quest = questMap.get(questId);
            if (!quest) {
                throw new Error(`Missing quest definition for ${questId}`);
            }

            visiting.add(questId);
            const prerequisiteInventories = (quest.requiresQuests ?? []).map((requiredQuestId) =>
                simulateQuestWithDependencies(requiredQuestId).endingInventory
            );
            const startingInventory = mergeInventories(prerequisiteInventories);
            const result = simulateQuest({
                quest,
                startingInventory,
                processMap,
            });
            visiting.delete(questId);
            memo.set(questId, result);
            return result;
        };

        const candidateQuests = allQuests.filter(
            (quest) =>
                quest.id.startsWith('hydroponics/') &&
                questCanBypassProcessViaCreatedItem(quest, processMap)
        );
        expect(candidateQuests.some((quest) => quest.id === 'hydroponics/temp-check')).toBe(true);

        const failures: string[] = [];
        for (const quest of candidateQuests) {
            const prerequisiteInventories = (quest.requiresQuests ?? []).map((requiredQuestId) =>
                simulateQuestWithDependencies(requiredQuestId).endingInventory
            );
            const startingInventory = mergeInventories(prerequisiteInventories);
            const result = simulateQuest({
                quest,
                startingInventory,
                processMap,
            });

            if (result.minProcessRuns < 1) {
                failures.push(quest.id);
            }
        }

        expect(failures).toEqual([]);
    });
});
