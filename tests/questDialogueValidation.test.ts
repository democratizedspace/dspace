import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { loadQuestPaths } from './utils/questPaths';

type DialogueOption = {
    type?: string;
    goto?: string;
    text?: string;
};

type DialogueNode = {
    id?: string;
    text?: string;
    type?: string;
    terminal?: boolean;
    options?: DialogueOption[];
};

type QuestLike = {
    id?: string;
    title?: string;
    start?: string;
    dialogue?: DialogueNode[];
};

type DialogueValidationError = {
    questId: string;
    questPath: string;
    nodeId: string;
    reason: 'dead-end' | 'unreachable-finish' | 'invalid-start' | 'process-only-trap';
    snippet: string;
};

const normalizeNodeId = (id: string | undefined, index: number) =>
    id?.trim() ? id.trim() : `__missing_id_${index}`;

const isTerminalNode = (node: DialogueNode) => {
    const nodeType = node.type?.toLowerCase();
    return Boolean(node.terminal) || nodeType === 'terminal' || nodeType === 'exit';
};

const toNodeSnippet = (node: DialogueNode) => {
    const text = (node.text ?? '').replace(/\s+/g, ' ').trim();
    const compactText = text.length > 120 ? `${text.slice(0, 117)}...` : text;
    const options = (node.options ?? []).map((option) => {
        const type = option.type ?? 'unknown';
        const target = option.goto ? ` -> ${option.goto}` : '';
        const label = option.text ? ` (${option.text})` : '';
        return `${type}${target}${label}`;
    });
    return `text="${compactText}" options=[${options.join('; ')}]`;
};

export const validateQuestDialogueCompletable = (
    quest: QuestLike,
    questPath = 'unknown path'
): DialogueValidationError[] => {
    const dialogue = quest.dialogue ?? [];
    if (dialogue.length === 0) return [];

    const normalizedNodes = dialogue.map((node, index) => ({
        ...node,
        id: normalizeNodeId(node.id, index),
    }));
    const nodeMap = new Map(normalizedNodes.map((node) => [node.id as string, node]));
    const requestedStartId = quest.start?.trim();
    if (requestedStartId && !nodeMap.has(requestedStartId)) {
        return [
            {
                questId: quest.id ?? 'unknown-quest',
                questPath,
                nodeId: requestedStartId,
                reason: 'invalid-start',
                snippet: `start node "${requestedStartId}" was not found in dialogue node IDs`,
            },
        ];
    }

    const startId = requestedStartId || normalizedNodes[0]?.id;
    if (!startId) return [];

    const reachable = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId || reachable.has(nodeId)) continue;
        reachable.add(nodeId);
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        for (const option of node.options ?? []) {
            if (!option.goto) continue;
            if (nodeMap.has(option.goto) && !reachable.has(option.goto)) {
                queue.push(option.goto);
            }
        }
    }

    const errors: DialogueValidationError[] = [];
    let hasReachableFinish = false;
    const hasFinishDefinition = normalizedNodes.some((node) => {
        const isCanonicalFinish = node.id === 'finish';
        const hasFinishOption = (node.options ?? []).some((option) => option.type === 'finish');
        return isCanonicalFinish || hasFinishOption;
    });

    for (const nodeId of reachable) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const options = node.options ?? [];
        const hasFinishOption = options.some((option) => option.type === 'finish');
        if (hasFinishOption) {
            hasReachableFinish = true;
        }

        const hasTransition = options.some(
            (option) =>
                option.type === 'finish' || (option.goto ? nodeMap.has(option.goto) : false)
        );
        const hasProcessOption = options.some((option) => option.type === 'process');
        const hasNonProcessEscape = options.some(
            (option) =>
                option.type === 'finish' ||
                option.type === 'goto' ||
                (option.type && option.type !== 'process' && Boolean(option.goto))
        );

        if (!hasTransition && !isTerminalNode(node)) {
            errors.push({
                questId: quest.id ?? 'unknown-quest',
                questPath,
                nodeId,
                reason: 'dead-end',
                snippet: toNodeSnippet(node),
            });
        }

        if (hasProcessOption && !hasNonProcessEscape && !isTerminalNode(node)) {
            errors.push({
                questId: quest.id ?? 'unknown-quest',
                questPath,
                nodeId,
                reason: 'process-only-trap',
                snippet: toNodeSnippet(node),
            });
        }
    }

    if (hasFinishDefinition && !hasReachableFinish) {
        const startNode = nodeMap.get(startId);
        errors.push({
            questId: quest.id ?? 'unknown-quest',
            questPath,
            nodeId: startId,
            reason: 'unreachable-finish',
            snippet: toNodeSnippet(startNode ?? {}),
        });
    }

    return errors;
};

describe('quest dialogue completable validation', () => {
    it('flags reachable dialogue dead-ends and unreachable finish nodes', () => {
        const quest: QuestLike = {
            id: 'fixture/dead-end',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Entry',
                    options: [{ type: 'goto', goto: 'temp', text: 'Continue' }],
                },
                {
                    id: 'temp',
                    text: 'Probe is hot.',
                    options: [{ type: 'goto', goto: 'missing-node', text: 'Log temp' }],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest, 'fixtures/dead-end.json')).toEqual([
            {
                questId: 'fixture/dead-end',
                questPath: 'fixtures/dead-end.json',
                nodeId: 'temp',
                reason: 'dead-end',
                snippet: 'text="Probe is hot." options=[goto -> missing-node (Log temp)]',
            },
            {
                questId: 'fixture/dead-end',
                questPath: 'fixtures/dead-end.json',
                nodeId: 'start',
                reason: 'unreachable-finish',
                snippet: 'text="Entry" options=[goto -> temp (Continue)]',
            },
        ]);
    });

    it('flags process-only nodes without an escape route', () => {
        const quest: QuestLike = {
            id: 'fixture/process-trap',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Begin work',
                    options: [{ type: 'goto', goto: 'workbench', text: 'Begin' }],
                },
                {
                    id: 'workbench',
                    text: 'Try the operation',
                    options: [{ type: 'process', goto: 'finish', text: 'Run process' }],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest, 'fixtures/process-trap.json')).toEqual([
            {
                questId: 'fixture/process-trap',
                questPath: 'fixtures/process-trap.json',
                nodeId: 'workbench',
                reason: 'process-only-trap',
                snippet: 'text="Try the operation" options=[process -> finish (Run process)]',
            },
        ]);
    });

    it('keeps composting/turn-pile completable from temp node to finish', async () => {
        const quests = await loadQuests();
        const quest = quests.find((entry: QuestLike) => entry.id === 'composting/turn-pile');

        expect(quest).toBeDefined();
        expect(validateQuestDialogueCompletable(quest as QuestLike)).toEqual([]);
    });

    it('validates all quest dialogue trees as completable', async () => {
        const quests = await loadQuests();
        const questPaths = await loadQuestPaths();
        const errors = quests.flatMap((quest: QuestLike) =>
            validateQuestDialogueCompletable(
                quest,
                questPaths.get(quest.id ?? '') ?? 'unknown path'
            )
        );

        const report = errors
            .map(
                (error) =>
                    `${error.questId} :: ${error.questPath} :: ${error.nodeId} :: ${error.reason}\n  ${error.snippet}`
            )
            .join('\n');

        expect(report).toBe('');
    });
});
