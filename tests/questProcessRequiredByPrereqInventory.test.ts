import { describe, expect, it } from 'vitest';
import { globSync } from 'glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';

type ItemStack = { id: string; count?: number };
type QuestOption = {
    type?: string;
    goto?: string;
    process?: string;
    requiresItems?: ItemStack[];
    requiredItems?: ItemStack[];
    requiredItemIds?: ItemStack[];
    requiredItemId?: string;
};
type QuestNode = { id?: string; options?: QuestOption[] };
type Quest = { id: string; start?: string; requiresQuests?: string[]; dialogue?: QuestNode[] };
type ProcessDef = { id: string; consumeItems?: ItemStack[]; createItems?: ItemStack[]; requireItems?: ItemStack[] };
type Inventory = Map<string, number>;
type TraceStep = { nodeId: string; option: QuestOption; before: Inventory };

const questDir = path.join(process.cwd(), 'frontend', 'src', 'pages', 'quests', 'json');
const questFiles = globSync(path.join(questDir, '**/*.json')).sort();
const quests = questFiles.map((file) => JSON.parse(readFileSync(file, 'utf8')) as Quest);
const questById = new Map(quests.map((quest) => [quest.id, quest]));
const processById = new Map((processes as ProcessDef[]).map((process) => [process.id, process]));
const inventoryItems = (items as any).default ?? items;
const purchasableItemIds = new Set(
    (inventoryItems as Array<{ id: string; price?: number; priceExemptionReason?: string }>)
        .filter((item) => (item.price ?? 0) > 0 || item.priceExemptionReason === 'BETA_PLACEHOLDER')
        .map((item) => item.id)
);

const epsilon = 1e-9;
const maxIterations = 500;

const countOf = (value: unknown) => (typeof value === 'number' && !Number.isNaN(value) ? value : 1);
const normalize = (value: unknown): ItemStack[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .flatMap((entry) => {
                if (typeof entry === 'string') return [{ id: entry, count: 1 }];
                if (entry && typeof entry === 'object' && 'id' in entry) {
                    const stack = entry as ItemStack;
                    return stack.id ? [{ id: stack.id, count: countOf(stack.count) }] : [];
                }
                return [];
            })
            .filter((entry) => entry.id);
    }
    if (typeof value === 'string') return [{ id: value, count: 1 }];
    if (typeof value === 'object' && value && 'id' in value) {
        const stack = value as ItemStack;
        return stack.id ? [{ id: stack.id, count: countOf(stack.count) }] : [];
    }
    return [];
};
const optionRequires = (option: QuestOption) => [
    ...normalize(option.requiresItems),
    ...normalize(option.requiredItems),
    ...normalize(option.requiredItemIds),
    ...normalize(option.requiredItemId),
];

const hasItems = (inventory: Inventory, required: ItemStack[]) =>
    required.every((item) => (inventory.get(item.id) ?? 0) + epsilon >= countOf(item.count));

const ensurePurchasableItems = (inventory: Inventory, required: ItemStack[]) => {
    for (const item of required) {
        const needed = countOf(item.count);
        const current = inventory.get(item.id) ?? 0;
        if (current + epsilon >= needed) continue;
        if (!purchasableItemIds.has(item.id)) return false;
        inventory.set(item.id, needed);
    }
    return true;
};

const add = (inventory: Inventory, itemId: string, delta: number) => {
    const next = (inventory.get(itemId) ?? 0) + delta;
    if (next <= epsilon) inventory.delete(itemId);
    else inventory.set(itemId, next);
};

const dependencyClosure = (questId: string, memo: Map<string, Set<string>>, visiting = new Set<string>()) => {
    if (memo.has(questId)) return memo.get(questId) as Set<string>;
    if (visiting.has(questId)) throw new Error(`Quest dependency cycle detected at ${questId}`);
    const quest = questById.get(questId);
    if (!quest) throw new Error(`Unknown quest ${questId}`);

    visiting.add(questId);
    const closure = new Set<string>();
    for (const prereqId of quest.requiresQuests ?? []) {
        if (!questById.has(prereqId)) throw new Error(`Quest ${questId} requires missing quest ${prereqId}`);
        closure.add(prereqId);
        for (const nested of dependencyClosure(prereqId, memo, visiting)) closure.add(nested);
    }
    visiting.delete(questId);
    memo.set(questId, closure);
    return closure;
};

const topoSort = (subset: Set<string>) => {
    const ordered: string[] = [];
    const temp = new Set<string>();
    const perm = new Set<string>();

    const visit = (questId: string) => {
        if (perm.has(questId)) return;
        if (temp.has(questId)) throw new Error(`Cycle while ordering prerequisite subset at ${questId}`);
        temp.add(questId);
        for (const prereqId of questById.get(questId)?.requiresQuests ?? []) {
            if (subset.has(prereqId)) visit(prereqId);
        }
        temp.delete(questId);
        perm.add(questId);
        ordered.push(questId);
    };

    for (const questId of [...subset].sort()) visit(questId);
    return ordered;
};

const simulateQuest = ({ quest, inventory, allowProcesses }: { quest: Quest; inventory: Inventory; allowProcesses: boolean }) => {
    const nodes = new Map(
        (quest.dialogue ?? [])
            .map((node) => ({ ...node, id: String(node.id ?? '').trim() }))
            .filter((node) => node.id)
            .map((node) => [node.id as string, node as QuestNode & { id: string }])
    );
    const startId = String(quest.start ?? quest.dialogue?.[0]?.id ?? '').trim();
    if (!startId || !nodes.has(startId)) throw new Error(`Invalid start node for ${quest.id}`);

    let nodeId = startId;
    let processRuns = 0;
    const seen = new Set<string>();
    const trace: TraceStep[] = [];

    const fingerprint = (inv: Inventory) =>
        [...inv.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, count]) => `${id}:${count.toFixed(6)}`)
            .join('|');

    for (let i = 0; i < maxIterations; i++) {
        const state = `${nodeId}|${fingerprint(inventory)}`;
        if (seen.has(state)) return { finished: false, processRuns, trace };
        seen.add(state);

        const node = nodes.get(nodeId);
        if (!node) return { finished: false, processRuns, trace };

        for (const option of node.options ?? []) {
            if (option.type === 'finish' && hasItems(inventory, optionRequires(option))) {
                trace.push({ nodeId, option, before: new Map(inventory) });
                return { finished: true, processRuns, trace };
            }
        }

        const gotoOptions = (node.options ?? []).filter(
            (option) => option.type === 'goto' && typeof option.goto === 'string' && nodes.has(String(option.goto).trim())
        );

        const reachable = gotoOptions.find((option) => hasItems(inventory, optionRequires(option)));
        if (reachable) {
            trace.push({ nodeId, option: reachable, before: new Map(inventory) });
            nodeId = String(reachable.goto).trim();
            continue;
        }

        const purchasableReachable = gotoOptions.find((option) => {
            const sandbox = new Map(inventory);
            return ensurePurchasableItems(sandbox, optionRequires(option));
        });
        if (purchasableReachable) {
            ensurePurchasableItems(inventory, optionRequires(purchasableReachable));
            trace.push({ nodeId, option: purchasableReachable, before: new Map(inventory) });
            nodeId = String(purchasableReachable.goto).trim();
            continue;
        }

        if (!allowProcesses) return { finished: false, processRuns, trace };

        const processOption = (node.options ?? []).find(
            (option) => option.type === 'process' && typeof option.process === 'string'
        );
        if (!processOption) return { finished: false, processRuns, trace };

        const processDef = processById.get(String(processOption.process));
        if (!processDef) throw new Error(`Quest ${quest.id} references unknown process ${String(processOption.process)}`);

        const required = [...optionRequires(processOption), ...normalize(processDef.requireItems), ...normalize(processDef.consumeItems)];
        if (!ensurePurchasableItems(inventory, required)) return { finished: false, processRuns, trace };

        const beforeProcess = fingerprint(inventory);
        trace.push({ nodeId, option: processOption, before: new Map(inventory) });
        for (const stack of normalize(processDef.consumeItems)) add(inventory, stack.id, -countOf(stack.count));
        for (const stack of normalize(processDef.createItems)) add(inventory, stack.id, countOf(stack.count));
        processRuns += 1;

        const gotoAfterProcess = String(processOption.goto ?? '').trim();
        if (gotoAfterProcess && nodes.has(gotoAfterProcess)) {
            nodeId = gotoAfterProcess;
            continue;
        }

        if (beforeProcess === fingerprint(inventory)) {
            return { finished: false, processRuns, trace };
        }
    }

    return { finished: false, processRuns, trace };
};

const findBypassedProcessRequirement = (quest: Quest, prereqInventory: Inventory, trace: TraceStep[]) => {
    const nodeById = new Map(
        (quest.dialogue ?? [])
            .map((node) => ({ ...node, id: String(node.id ?? '').trim() }))
            .filter((node) => node.id)
            .map((node) => [node.id as string, node as QuestNode & { id: string }])
    );

    for (const step of trace) {
        if (step.option.type !== 'goto') continue;
        const node = nodeById.get(step.nodeId);
        if (!node) continue;
        const processOptions = (node.options ?? []).filter(
            (option) => option.type === 'process' && typeof option.process === 'string'
        );
        if (processOptions.length === 0) continue;

        const gotoReqs = optionRequires(step.option);
        for (const processOption of processOptions) {
            const processDef = processById.get(String(processOption.process));
            if (!processDef) continue;
            for (const created of normalize(processDef.createItems)) {
                const required = gotoReqs.find((requirement) => requirement.id === created.id);
                if (!required) continue;
                const baseline = prereqInventory.get(created.id) ?? 0;
                if (baseline + epsilon >= countOf(required.count)) {
                    return { questId: quest.id, nodeId: step.nodeId, processId: processDef.id, itemId: created.id };
                }
            }
        }
    }

    return null;
};

describe('quest process requirements against prerequisite inventory simulation', () => {
    it('prevents bypassing process-created evidence on the completion path', () => {
        const closureMemo = new Map<string, Set<string>>();
        const violations: string[] = [];

        for (const quest of quests) {
            const closure = dependencyClosure(quest.id, closureMemo);
            const orderedPrerequisites = topoSort(closure);
            const inventory: Inventory = new Map();

            for (const prereqId of orderedPrerequisites) {
                const prereq = questById.get(prereqId);
                if (!prereq) continue;
                simulateQuest({ quest: prereq, inventory, allowProcesses: true });
            }

            const result = simulateQuest({ quest, inventory: new Map(inventory), allowProcesses: false });
            if (!result.finished) continue;

            const bypass = findBypassedProcessRequirement(quest, inventory, result.trace);
            if (bypass) {
                violations.push(`${bypass.questId} (${bypass.nodeId}, ${bypass.processId}, ${bypass.itemId})`);
            }
        }

        expect(violations).toEqual([]);
    });
});
