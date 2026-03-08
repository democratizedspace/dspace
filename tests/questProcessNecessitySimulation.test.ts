import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadQuestPaths } from './utils/questPaths';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import items from '../frontend/src/pages/inventory/json/items';

type ItemCount = { id: string; count: number };
type QuestOption = {
    type?: 'goto' | 'process' | 'finish' | string;
    goto?: string;
    process?: string;
    requiresItems?: ItemCount[];
    grantsItems?: ItemCount[];
};

type QuestNode = { id?: string; options?: QuestOption[] };
type QuestData = {
    id: string;
    start?: string;
    requiresQuests?: string[];
    requiresItems?: ItemCount[];
    rewards?: ItemCount[];
    dialogue?: QuestNode[];
};

type ProcessData = {
    id: string;
    consumeItems?: ItemCount[];
    createItems?: ItemCount[];
};

type ItemSource = {
    questId: string;
    nodeId?: string;
    optionType?: string;
    processId?: string;
    count: number;
};

type InventoryState = {
    counts: Map<string, number>;
    sources: Map<string, ItemSource[]>;
};

const processMap = new Map((processes as ProcessData[]).map((p) => [p.id, p]));
const purchasableItems = new Set(
    (items as Array<{ id: string; price?: number; priceExemptionReason?: string }>)
        .filter(
            (item) =>
                (typeof item.price === 'number' && item.price > 0) ||
                item.priceExemptionReason === 'BETA_PLACEHOLDER'
        )
        .map((item) => item.id)
);

const addItem = (inventory: Map<string, number>, id: string, count: number) => {
    if (!id || !Number.isFinite(count) || count === 0) return;
    inventory.set(id, (inventory.get(id) ?? 0) + count);
};

const applyItems = (inventory: Map<string, number>, entries: ItemCount[] = [], sign = 1) => {
    for (const entry of entries) {
        addItem(inventory, entry.id, sign * Number(entry.count ?? 0));
    }
};

const hasItems = (inventory: Map<string, number>, requirements: ItemCount[] = []) =>
    requirements.every((entry) => (inventory.get(entry.id) ?? 0) >= Number(entry.count ?? 0));

const buyMissingRequirements = (inventory: Map<string, number>, requirements: ItemCount[] = []) => {
    let changed = false;
    for (const entry of requirements) {
        const required = Number(entry.count ?? 0);
        const current = inventory.get(entry.id) ?? 0;
        if (current >= required) continue;
        if (!purchasableItems.has(entry.id)) continue;
        inventory.set(entry.id, required);
        changed = true;
    }
    return changed;
};

const cloneState = (state: InventoryState): InventoryState => ({
    counts: new Map(state.counts.entries()),
    sources: new Map(
        [...state.sources.entries()].map(([id, entries]) => [id, [...entries]])
    ),
});

const recordSources = (
    state: InventoryState,
    entries: ItemCount[] = [],
    sourceBase: Omit<ItemSource, 'count'>
) => {
    for (const entry of entries) {
        const count = Number(entry.count ?? 0);
        if (!Number.isFinite(count) || count <= 0 || !entry.id) continue;
        if (!state.sources.has(entry.id)) state.sources.set(entry.id, []);
        state.sources.get(entry.id)?.push({ ...sourceBase, count });
    }
};

const buildReachability = (quest: QuestData) => {
    const nodeById = new Map<string, QuestNode>();
    for (const node of quest.dialogue ?? []) {
        if (typeof node.id === 'string' && node.id.trim()) {
            nodeById.set(node.id.trim(), node);
        }
    }

    const reverseEdges = new Map<string, Set<string>>();
    const finishNodes = new Set<string>();

    for (const [nodeId, node] of nodeById.entries()) {
        for (const option of node.options ?? []) {
            if (option.type === 'finish') finishNodes.add(nodeId);
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!nodeById.has(target)) continue;
            if (!reverseEdges.has(target)) reverseEdges.set(target, new Set<string>());
            reverseEdges.get(target)?.add(nodeId);
        }
    }

    const canReachFinish = new Set<string>();
    const queue = [...finishNodes];
    while (queue.length > 0) {
        const current = queue.shift() as string;
        if (canReachFinish.has(current)) continue;
        canReachFinish.add(current);
        for (const previous of reverseEdges.get(current) ?? []) {
            if (!canReachFinish.has(previous)) queue.push(previous);
        }
    }

    return { nodeById, canReachFinish };
};

const simulateQuestBody = (quest: QuestData, startingState: InventoryState) => {
    const state = cloneState(startingState);
    const inventory = state.counts;
    const { nodeById, canReachFinish } = buildReachability(quest);
    const startId =
        typeof quest.start === 'string' && quest.start.trim()
            ? quest.start.trim()
            : (quest.dialogue?.[0]?.id ?? '').trim();

    if (!startId || !nodeById.has(startId)) {
        return state;
    }

    buyMissingRequirements(inventory, quest.requiresItems ?? []);

    const executedProcesses = new Set<string>();
    let current = startId;
    let guard = 0;

    while (guard++ < 1000) {
        const node = nodeById.get(current);
        if (!node) break;
        const options = node.options ?? [];

        for (const option of options) {
            buyMissingRequirements(inventory, option.requiresItems ?? []);
        }

        const processOptions = options.filter(
            (option) => option.type === 'process' && typeof option.process === 'string'
        );
        for (const option of processOptions) {
            const processKey = `${current}:${option.process}`;
            if (executedProcesses.has(processKey)) continue;
            if (!hasItems(inventory, option.requiresItems ?? [])) continue;
            const process = processMap.get(option.process as string);
            if (!process) continue;
            if (!hasItems(inventory, process.consumeItems ?? [])) continue;

            executedProcesses.add(processKey);
            applyItems(inventory, option.grantsItems ?? [], 1);
            recordSources(state, option.grantsItems ?? [], {
                questId: quest.id,
                nodeId: node.id,
                optionType: option.type,
                processId: option.process,
            });
            applyItems(inventory, process.consumeItems ?? [], -1);
            applyItems(inventory, process.createItems ?? [], 1);
            recordSources(state, process.createItems ?? [], {
                questId: quest.id,
                nodeId: node.id,
                optionType: option.type,
                processId: option.process,
            });
        }

        const finishOption = options.find(
            (option) => option.type === 'finish' && hasItems(inventory, option.requiresItems ?? [])
        );
        if (finishOption) {
            applyItems(inventory, finishOption.grantsItems ?? [], 1);
            recordSources(state, finishOption.grantsItems ?? [], {
                questId: quest.id,
                nodeId: node.id,
                optionType: finishOption.type,
            });
            applyItems(inventory, quest.rewards ?? [], 1);
            recordSources(state, quest.rewards ?? [], {
                questId: quest.id,
                optionType: 'reward',
            });
            return state;
        }

        const gotoOption = options.find(
            (option) =>
                option.type === 'goto' &&
                typeof option.goto === 'string' &&
                canReachFinish.has(option.goto.trim()) &&
                hasItems(inventory, option.requiresItems ?? [])
        );
        if (gotoOption && typeof gotoOption.goto === 'string') {
            applyItems(inventory, gotoOption.grantsItems ?? [], 1);
            recordSources(state, gotoOption.grantsItems ?? [], {
                questId: quest.id,
                nodeId: node.id,
                optionType: gotoOption.type,
            });
            current = gotoOption.goto.trim();
            continue;
        }

        break;
    }

    return state;
};

const sortByTopo = (quests: QuestData[]) => {
    const indegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    for (const quest of quests) {
        indegree.set(quest.id, indegree.get(quest.id) ?? 0);
        for (const prereq of quest.requiresQuests ?? []) {
            if (!outgoing.has(prereq)) outgoing.set(prereq, []);
            outgoing.get(prereq)?.push(quest.id);
            indegree.set(quest.id, (indegree.get(quest.id) ?? 0) + 1);
        }
    }

    const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
    const sorted: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift() as string;
        sorted.push(current);
        for (const next of outgoing.get(current) ?? []) {
            const nextDegree = (indegree.get(next) ?? 0) - 1;
            indegree.set(next, nextDegree);
            if (nextDegree === 0) queue.push(next);
        }
    }

    return sorted;
};

const computePrereqClosure = (questsById: Map<string, QuestData>) => {
    const memo = new Map<string, Set<string>>();
    const visiting = new Set<string>();

    const visit = (questId: string): Set<string> => {
        if (memo.has(questId)) return memo.get(questId) as Set<string>;
        if (visiting.has(questId)) throw new Error(`Quest dependency cycle detected at ${questId}`);
        visiting.add(questId);

        const closure = new Set<string>();
        const quest = questsById.get(questId);
        for (const prereq of quest?.requiresQuests ?? []) {
            if (!questsById.has(prereq)) continue;
            closure.add(prereq);
            for (const nested of visit(prereq)) closure.add(nested);
        }

        visiting.delete(questId);
        memo.set(questId, closure);
        return closure;
    };

    for (const questId of questsById.keys()) {
        visit(questId);
    }

    return memo;
};

const simulateInventoryBeforeQuest = ({
    questId,
    questsById,
    topoIndex,
    prereqClosure,
}: {
    questId: string;
    questsById: Map<string, QuestData>;
    topoIndex: Map<string, number>;
    prereqClosure: Map<string, Set<string>>;
}) => {
    const prerequisiteIds = [...(prereqClosure.get(questId) ?? new Set<string>())].sort(
        (a, b) => (topoIndex.get(a) ?? 0) - (topoIndex.get(b) ?? 0)
    );

    let state: InventoryState = {
        counts: new Map<string, number>(),
        sources: new Map<string, ItemSource[]>(),
    };
    for (const prereqId of prerequisiteIds) {
        const prereq = questsById.get(prereqId);
        if (!prereq) continue;
        state = simulateQuestBody(prereq, state);
    }

    return { prerequisiteIds, ...state };
};

const getBlockingGotoRequirements = (quest: QuestData) => {
    const { nodeById, canReachFinish } = buildReachability(quest);
    const startId =
        typeof quest.start === 'string' && quest.start.trim()
            ? quest.start.trim()
            : (quest.dialogue?.[0]?.id ?? '').trim();

    if (!startId || !nodeById.has(startId)) return [] as ItemCount[];

    const queue = [startId];
    const seen = new Set<string>();
    const required = new Map<string, number>();

    while (queue.length > 0) {
        const nodeId = queue.shift() as string;
        if (seen.has(nodeId)) continue;
        seen.add(nodeId);
        const node = nodeById.get(nodeId);
        if (!node) continue;

        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!canReachFinish.has(target) || !nodeById.has(target)) continue;

            for (const req of option.requiresItems ?? []) {
                const count = Number(req.count ?? 0);
                if (!Number.isFinite(count) || count <= 0) continue;
                required.set(req.id, Math.min(required.get(req.id) ?? Infinity, count));
            }

            if (!seen.has(target)) queue.push(target);
        }
    }

    return [...required.entries()].map(([id, count]) => ({ id, count }));
};

const getCreatedItemIds = (quest: QuestData) => {
    const created = new Set<string>();
    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.type !== 'process' || typeof option.process !== 'string') continue;
            const process = processMap.get(option.process);
            for (const item of process?.createItems ?? []) {
                if (item.id) created.add(item.id);
            }
        }
    }
    return created;
};

describe('quest process necessity simulation', () => {
    const knownBypassQuestIds = [
        '3dprinting/spool-holder',
        'geothermal/backflush-loop-filter',
        'geothermal/check-loop-outlet-temp',
        'geothermal/check-loop-temp-delta',
        'geothermal/compare-depth-ground-temps',
        'geothermal/compare-seasonal-ground-temps',
        'geothermal/log-heat-pump-warmup',
        'geothermal/monitor-heat-pump-energy',
        'geothermal/purge-loop-air',
        'hydroponics/ec-calibrate',
        'hydroponics/ec-check',
        'hydroponics/top-off',
    ];

    it('uses only recursive requiresQuests ancestry for hydroponics/temp-check baseline', async () => {
        const questPaths = await loadQuestPaths();
        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) => {
                const raw = await readFile(path.join(process.cwd(), questPath), 'utf8');
                return JSON.parse(raw) as QuestData;
            })
        );

        const questsById = new Map(quests.map((quest) => [quest.id, quest]));
        const topoOrder = sortByTopo(quests);
        const topoIndex = new Map(topoOrder.map((id, index) => [id, index]));
        const prereqClosure = computePrereqClosure(questsById);

        const probeItemId = '6305ae99-c0b2-49f8-8d58-a1d81b765342';
        const tempCheckState = simulateInventoryBeforeQuest({
            questId: 'hydroponics/temp-check',
            questsById,
            topoIndex,
            prereqClosure,
        });

        expect(tempCheckState.prerequisiteIds).toEqual([
            'welcome/howtodoquests',
            'hydroponics/basil',
            'hydroponics/nutrient-check',
        ]);
        expect(tempCheckState.counts.get(probeItemId) ?? 0).toBe(0);
        expect(tempCheckState.sources.get(probeItemId) ?? []).toEqual([]);
    });

    it('requires at least one process run for quests that gate progression with process outputs', async () => {
        const questPaths = await loadQuestPaths();
        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) => {
                const raw = await readFile(path.join(process.cwd(), questPath), 'utf8');
                return JSON.parse(raw) as QuestData;
            })
        );

        const questsById = new Map(quests.map((quest) => [quest.id, quest]));
        const topoOrder = sortByTopo(quests);
        const topoIndex = new Map(topoOrder.map((id, index) => [id, index]));
        const prereqClosure = computePrereqClosure(questsById);

        const violations: string[] = [];

        for (const quest of quests) {
            const createdItemIds = getCreatedItemIds(quest);
            if (createdItemIds.size === 0) continue;

            const gatingRequirements = getBlockingGotoRequirements(quest).filter((item) =>
                createdItemIds.has(item.id)
            );
            if (gatingRequirements.length === 0) continue;

            const inventoryBeforeQuest = simulateInventoryBeforeQuest({
                questId: quest.id,
                questsById,
                topoIndex,
                prereqClosure,
            });

            const bypassed = gatingRequirements.filter((item) => {
                const available = inventoryBeforeQuest.counts.get(item.id) ?? 0;
                return available >= item.count;
            });

            if (bypassed.length === 0) continue;

            const ancestry = inventoryBeforeQuest.prerequisiteIds.join(' -> ');
            const perItem = bypassed
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id) || a.count - b.count)
                .map((item) => {
                    const available = inventoryBeforeQuest.counts.get(item.id) ?? 0;
                    const sources = (inventoryBeforeQuest.sources.get(item.id) ?? [])
                        .map(
                            (source) =>
                                `${source.questId}${
                                    source.processId ? `::${source.processId}` : ''
                                } (+${source.count})`
                        )
                        .sort();

                    return `item=${item.id} available=${available} required=${item.count} sources=${
                        sources.length > 0 ? sources.join(',') : 'none'
                    }`;
                })
                .join('; ');

            violations.push(
                `quest=${quest.id} ancestry=[${ancestry}] bypass=[${perItem}]`
            );
        }

        const violatedQuestIds = violations
            .map((entry) => entry.match(/^quest=([^\s]+)/)?.[1])
            .filter((questId): questId is string => Boolean(questId))
            .sort();

        expect(violatedQuestIds).toEqual(knownBypassQuestIds.slice().sort());
    });
});
