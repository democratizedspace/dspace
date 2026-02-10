import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

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
    nodeId: string;
    reason: 'dead-end' | 'unreachable-finish';
    snippet: string;
};

const normalizeNodeId = (id: string | undefined, index: number) =>
    id?.trim() ? id : `__missing_id_${index}`;

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
    quest: QuestLike
): DialogueValidationError[] => {
    const dialogue = quest.dialogue ?? [];
    if (dialogue.length === 0) return [];

    const normalizedNodes = dialogue.map((node, index) => ({
        ...node,
        id: normalizeNodeId(node.id, index),
    }));
    const nodeMap = new Map(normalizedNodes.map((node) => [node.id as string, node]));
    const startId = quest.start && nodeMap.has(quest.start)
        ? quest.start
        : normalizedNodes[0]?.id;
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

    for (const nodeId of reachable) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const options = node.options ?? [];
        const hasFinishOption = options.some((option) => option.type === 'finish');
        if (hasFinishOption) {
            hasReachableFinish = true;
        }

        const hasTransition = options.some(
            (option) => option.type === 'finish' || (option.goto ? nodeMap.has(option.goto) : false)
        );

        if (!hasTransition && !isTerminalNode(node)) {
            errors.push({
                questId: quest.id ?? 'unknown-quest',
                nodeId,
                reason: 'dead-end',
                snippet: toNodeSnippet(node),
            });
        }
    }

    if (!hasReachableFinish) {
        const startNode = nodeMap.get(startId);
        errors.push({
            questId: quest.id ?? 'unknown-quest',
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
                    options: [{ type: 'process', text: 'Log temp' }],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest)).toEqual([
            {
                questId: 'fixture/dead-end',
                nodeId: 'temp',
                reason: 'dead-end',
                snippet: 'text="Probe is hot." options=[process (Log temp)]',
            },
            {
                questId: 'fixture/dead-end',
                nodeId: 'start',
                reason: 'unreachable-finish',
                snippet: 'text="Entry" options=[goto -> temp (Continue)]',
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
        const errors = quests.flatMap((quest: QuestLike) =>
            validateQuestDialogueCompletable(quest)
        );

        const report = errors
            .map(
                (error) =>
                    `${error.questId} :: ${error.nodeId} :: ${error.reason}\n  ${error.snippet}`
            )
            .join('\n');

        expect(report).toBe('');
    });
});
