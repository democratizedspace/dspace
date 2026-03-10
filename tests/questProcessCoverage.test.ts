import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import { loadQuestPaths } from './utils/questPaths';

type ItemCount = {
    id: string;
    count: number;
};

type QuestOption = {
    type?: string;
    process?: string;
    goto?: string;
    requiresItems?: ItemCount[];
};

type QuestNode = {
    id?: string;
    options?: QuestOption[];
};

type QuestData = {
    id: string;
    title?: string;
    description?: string;
    start?: string;
    dialogue?: QuestNode[];
};

type ProcessData = {
    id: string;
    createItems?: ItemCount[];
};

const processMap = new Map((processes as ProcessData[]).map((process) => [process.id, process]));
const BUILD_OR_STRUCTURE_TITLE = /^(build|construct|assemble|install|make|add)\b/i;
const BUILD_OR_STRUCTURE_DESCRIPTION =
    /\b(build|construct|assemble|install|mount|set up|setup|enclosure|rig|reactor|digester|gripper|tracker|turbine|frame|chassis|fixture|structure)\b/i;

const IMMERSION_EXCEPTION_IDS = new Set<string>([
    'aquaria/guppy',
    'aquaria/shrimp',
    'aquaria/floating-plants',
]);

const hasRequiredProcessStep = (quest: QuestData) =>
    (quest.dialogue ?? []).some((node) =>
        (node.options ?? []).some(
            (option) =>
                option.type === 'process' &&
                typeof option.process === 'string' &&
                option.process.trim().length > 0
        )
    );

const isBuildOrStructureQuest = (quest: QuestData) => {
    const combinedText = `${quest.title ?? ''} ${quest.description ?? ''}`;
    return BUILD_OR_STRUCTURE_TITLE.test(combinedText) && BUILD_OR_STRUCTURE_DESCRIPTION.test(combinedText);
};

const canFinishWithoutRunningProcess = (quest: QuestData) => {
    const nodes = new Map<string, QuestNode>();
    for (const node of quest.dialogue ?? []) {
        if (typeof node.id === 'string' && node.id.trim()) {
            nodes.set(node.id.trim(), node);
        }
    }

    const startId =
        typeof quest.start === 'string' && quest.start.trim()
            ? quest.start.trim()
            : typeof quest.dialogue?.[0]?.id === 'string' && quest.dialogue[0].id.trim()
              ? quest.dialogue[0].id.trim()
              : '';

    if (!startId || !nodes.has(startId)) return true;

    const processCreatedItems = new Set<string>();
    for (const node of quest.dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (option.type !== 'process' || typeof option.process !== 'string') continue;
            const process = processMap.get(option.process);
            for (const created of process?.createItems ?? []) {
                if (created.id) processCreatedItems.add(created.id);
            }
        }
    }

    type State = {
        nodeId: string;
        processRan: boolean;
        inventory: Set<string>;
    };

    const queue: State[] = [{ nodeId: startId, processRan: false, inventory: new Set<string>() }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const state = queue.shift() as State;
        const signature = `${state.nodeId}|${state.processRan}|${[...state.inventory].sort().join(',')}`;
        if (visited.has(signature)) continue;
        visited.add(signature);

        const node = nodes.get(state.nodeId);
        if (!node) continue;

        for (const option of node.options ?? []) {
            if (option.type === 'finish') {
                if (!state.processRan) return true;
                continue;
            }

            if (option.type === 'process' && typeof option.process === 'string') {
                const nextInventory = new Set(state.inventory);
                const process = processMap.get(option.process);
                for (const created of process?.createItems ?? []) {
                    if (created.id) nextInventory.add(created.id);
                }

                queue.push({
                    nodeId:
                        typeof option.goto === 'string' && nodes.has(option.goto)
                            ? option.goto
                            : state.nodeId,
                    processRan: true,
                    inventory: nextInventory,
                });
                continue;
            }

            if (option.type !== 'goto' || typeof option.goto !== 'string' || !nodes.has(option.goto)) {
                continue;
            }

            const blockedByProcessOutput = (option.requiresItems ?? []).some(
                (entry) => processCreatedItems.has(entry.id) && !state.inventory.has(entry.id)
            );
            if (blockedByProcessOutput) continue;

            queue.push({
                nodeId: option.goto,
                processRan: state.processRan,
                inventory: new Set(state.inventory),
            });
        }
    }

    return false;
};

describe('quest process coverage quality gates', () => {
    it('enforces mandatory process-backed immersion for build/install quest titles', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) =>
                JSON.parse(await readFile(questPath, 'utf8')) as QuestData
            )
        );

        const buildOrStructureQuests = quests.filter(
            (quest) => isBuildOrStructureQuest(quest) && !IMMERSION_EXCEPTION_IDS.has(quest.id)
        );
        expect(buildOrStructureQuests.length).toBeGreaterThan(0);

        const flagged = buildOrStructureQuests
            .filter((quest) => !hasRequiredProcessStep(quest))
            .map((quest) => quest.id);

        expect(flagged).toEqual([]);
    });

    it('requires astronomy process fields to be encoded as process options', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const invalid: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(path.join(process.cwd(), questPath), 'utf8')) as QuestData;
            if (!quest.id.startsWith('astronomy/')) continue;
            for (const node of quest.dialogue ?? []) {
                for (const option of node.options ?? []) {
                    if (option.process && option.type !== 'process') {
                        invalid.push(`${quest.id}:${node.id ?? 'unknown-node'}`);
                    }
                }
            }
        }

        expect(invalid).toEqual([]);
    });

    it('blocks astronomy quests from finishing without at least one process step', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const [questId, questPath] of questPaths.entries()) {
            if (!questId.startsWith('astronomy/')) continue;
            const quest = JSON.parse(await readFile(path.join(process.cwd(), questPath), 'utf8')) as QuestData;
            if (canFinishWithoutRunningProcess(quest)) {
                flagged.push(quest.id);
            }
        }

        expect(flagged).toEqual([]);
    });
});
