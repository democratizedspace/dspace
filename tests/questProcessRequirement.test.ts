import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';

type ItemStack = { id: string; count?: number };
type QuestOption = {
    type: string;
    goto?: string;
    process?: string;
    requiresItems?: ItemStack[];
    grantsItems?: ItemStack[];
};

type QuestNode = {
    id: string;
    options?: QuestOption[];
};

type Quest = {
    id: string;
    start: string;
    requiresQuests?: string[];
    rewards?: ItemStack[];
    dialogue?: QuestNode[];
};

type ProcessDef = {
    id: string;
    requireItems?: ItemStack[];
    consumeItems?: ItemStack[];
    createItems?: ItemStack[];
};

type Inventory = Map<string, number>;

const repoRoot = path.resolve(__dirname, '..');
const questDir = path.join(repoRoot, 'frontend/src/pages/quests/json');
const processPath = path.join(repoRoot, 'frontend/src/generated/processes.json');
const questFiles = globSync(path.join(questDir, '**/*.json')).sort();

const toCount = (entry: ItemStack): number => (typeof entry.count === 'number' ? entry.count : 1);

const hasItems = (inventory: Inventory, stacks: ItemStack[] | undefined): boolean => {
    if (!Array.isArray(stacks) || stacks.length === 0) {
        return true;
    }
    return stacks.every((stack) => (inventory.get(stack.id) ?? 0) + 1e-9 >= toCount(stack));
};

const addItems = (inventory: Inventory, stacks: ItemStack[] | undefined): boolean => {
    if (!Array.isArray(stacks) || stacks.length === 0) {
        return false;
    }

    let changed = false;
    for (const stack of stacks) {
        const id = stack?.id;
        if (!id) {
            continue;
        }
        const current = inventory.get(id) ?? 0;
        const next = current + toCount(stack);
        if (Math.abs(next - current) > 1e-9) {
            changed = true;
        }
        inventory.set(id, next);
    }

    return changed;
};

const consumeItems = (inventory: Inventory, stacks: ItemStack[] | undefined): void => {
    if (!Array.isArray(stacks) || stacks.length === 0) {
        return;
    }

    for (const stack of stacks) {
        const id = stack?.id;
        if (!id) {
            continue;
        }
        inventory.set(id, (inventory.get(id) ?? 0) - toCount(stack));
    }
};

const loadQuestMap = (): Map<string, Quest> => {
    const map = new Map<string, Quest>();
    for (const file of questFiles) {
        const quest = JSON.parse(readFileSync(file, 'utf8')) as Quest;
        map.set(quest.id, quest);
    }
    return map;
};

const collectDependencyOrder = (
    questId: string,
    questMap: Map<string, Quest>,
    stack: Set<string>,
    visited: Set<string>,
    order: string[]
): void => {
    if (visited.has(questId)) {
        return;
    }
    if (stack.has(questId)) {
        throw new Error(`Cycle detected in requiresQuests while simulating ${questId}`);
    }

    const quest = questMap.get(questId);
    if (!quest) {
        throw new Error(`Quest not found: ${questId}`);
    }

    stack.add(questId);
    for (const dep of quest.requiresQuests ?? []) {
        collectDependencyOrder(dep, questMap, stack, visited, order);
    }
    stack.delete(questId);

    visited.add(questId);
    order.push(questId);
};

const getTransitiveDependencies = (
    questId: string,
    questMap: Map<string, Quest>,
    memo: Map<string, Set<string>>,
    stack: Set<string>
): Set<string> => {
    const cached = memo.get(questId);
    if (cached) {
        return cached;
    }

    if (stack.has(questId)) {
        return new Set<string>();
    }

    const deps = new Set<string>();
    const quest = questMap.get(questId);

    stack.add(questId);
    for (const depId of quest?.requiresQuests ?? []) {
        deps.add(depId);
        const nested = getTransitiveDependencies(depId, questMap, memo, stack);
        for (const nestedDepId of nested) {
            deps.add(nestedDepId);
        }
    }
    stack.delete(questId);

    memo.set(questId, deps);
    return deps;
};

const dependsOnQuest = (
    questId: string,
    targetId: string,
    questMap: Map<string, Quest>,
    memo: Map<string, Set<string>>
): boolean => {
    if (questId === targetId) {
        return true;
    }

    const deps = getTransitiveDependencies(questId, questMap, memo, new Set<string>());
    return deps.has(targetId);
};

const simulateQuestInventory = (
    quest: Quest,
    inventory: Inventory,
    processMap: Map<string, ProcessDef>
): void => {
    const executedProcessOptions = new Set<string>();
    const executedGrantOptions = new Set<string>();

    let progressed = true;
    while (progressed) {
        progressed = false;

        for (const node of quest.dialogue ?? []) {
            for (let optionIndex = 0; optionIndex < (node.options ?? []).length; optionIndex += 1) {
                const option = (node.options ?? [])[optionIndex] as QuestOption;
                const optionKey = `${node.id}:${optionIndex}`;

                if (!hasItems(inventory, option.requiresItems)) {
                    continue;
                }

                if (option.type === 'process' && option.process) {
                    if (executedProcessOptions.has(optionKey)) {
                        continue;
                    }

                    const process = processMap.get(option.process);
                    if (!process) {
                        continue;
                    }
                    if (!hasItems(inventory, process.requireItems) || !hasItems(inventory, process.consumeItems)) {
                        continue;
                    }

                    consumeItems(inventory, process.consumeItems);
                    progressed = addItems(inventory, process.createItems) || progressed;
                    progressed = addItems(inventory, option.grantsItems) || progressed;
                    executedProcessOptions.add(optionKey);
                    continue;
                }

                if (option.type !== 'goto' && option.type !== 'finish') {
                    if (executedGrantOptions.has(optionKey)) {
                        continue;
                    }
                    progressed = addItems(inventory, option.grantsItems) || progressed;
                    executedGrantOptions.add(optionKey);
                }
            }
        }
    }

    addItems(inventory, quest.rewards);
};

const canReachFinishWithoutProcess = (quest: Quest, inventory: Inventory): boolean => {
    const nodeMap = new Map((quest.dialogue ?? []).map((node) => [node.id, node]));
    const visitedNodes = new Set<string>();
    const queue: string[] = [quest.start];

    while (queue.length > 0) {
        const nodeId = queue.shift() as string;
        if (visitedNodes.has(nodeId)) {
            continue;
        }
        visitedNodes.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) {
            continue;
        }

        for (const option of node.options ?? []) {
            if (!hasItems(inventory, option.requiresItems)) {
                continue;
            }
            if (option.type === 'finish') {
                return true;
            }
            if (option.type === 'goto' && option.goto) {
                queue.push(option.goto);
            }
        }
    }

    return false;
};

describe('quest progression process-gate validation', () => {
    it('requires at least one process run in every non-root quest after prerequisite simulation', () => {
        const questMap = loadQuestMap();
        const processMap = new Map(
            (JSON.parse(readFileSync(processPath, 'utf8')) as ProcessDef[]).map((process) => [process.id, process])
        );

        const violations: string[] = [];
        const dependencyMemo = new Map<string, Set<string>>();

        for (const [questId, quest] of [...questMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
            if (questId === 'welcome/howtodoquests') {
                continue;
            }

            const processOptions = (quest.dialogue ?? []).flatMap((node) =>
                (node.options ?? []).filter((option) => option.type === 'process' && option.process)
            );
            if (processOptions.length === 0) {
                continue;
            }

            const hasInventoryAffectingProcess = processOptions.some((option) => {
                const process = processMap.get(option.process as string);
                const creates = (process?.createItems?.length ?? 0) + (option.grantsItems?.length ?? 0);
                return creates > 0;
            });
            if (!hasInventoryAffectingProcess) {
                continue;
            }

            const dependencyOrder: string[] = [];
            const stack = new Set<string>();
            const visited = new Set<string>();
            for (const dep of quest.requiresQuests ?? []) {
                collectDependencyOrder(dep, questMap, stack, visited, dependencyOrder);
            }

            const simulatedInventory: Inventory = new Map();
            const completedQuests = new Set<string>();
            for (const depId of dependencyOrder) {
                const dependencyQuest = questMap.get(depId);
                if (!dependencyQuest) {
                    throw new Error(`Missing dependency quest while simulating ${questId}: ${depId}`);
                }
                simulateQuestInventory(dependencyQuest, simulatedInventory, processMap);
                completedQuests.add(depId);
            }

            let unlockedProgress = true;
            while (unlockedProgress) {
                unlockedProgress = false;

                for (const [candidateId, candidateQuest] of questMap) {
                    if (candidateId === questId || completedQuests.has(candidateId)) {
                        continue;
                    }

                    if (dependsOnQuest(candidateId, questId, questMap, dependencyMemo)) {
                        continue;
                    }

                    const prerequisitesSatisfied = (candidateQuest.requiresQuests ?? []).every((requiredQuestId) =>
                        completedQuests.has(requiredQuestId)
                    );
                    if (!prerequisitesSatisfied) {
                        continue;
                    }

                    simulateQuestInventory(candidateQuest, simulatedInventory, processMap);
                    completedQuests.add(candidateId);
                    unlockedProgress = true;
                }
            }

            if (canReachFinishWithoutProcess(quest, simulatedInventory)) {
                violations.push(questId);
            }
        }

        expect(
            violations,
            `Quests completable with zero in-quest process runs:\n${violations.join('\n')}`
        ).toEqual([]);
    });
});
