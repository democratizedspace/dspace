import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { loadQuestPaths } from './utils/questPaths';

type ItemCount = {
    id: string;
    count: number;
};

type DialogueOption = {
    type?: string;
    goto?: string;
    text?: string;
    process?: string;
    requiresItems?: ItemCount[];
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
    reason: 'dead-end' | 'unreachable-finish' | 'invalid-start' | 'state-locked';
    snippet: string;
};

const isGotoTransition = (option: DialogueOption, nodeMap: Map<string, DialogueNode>) =>
    option.type === 'goto' && Boolean(option.goto) && nodeMap.has(option.goto);

const processMap = new Map(processes.map((process) => [process.id, process]));

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

const toItemCountMap = (entries: ItemCount[] | undefined) => {
    const counts = new Map<string, number>();
    for (const entry of entries ?? []) {
        if (!entry?.id || typeof entry.count !== 'number') continue;
        counts.set(entry.id, (counts.get(entry.id) ?? 0) + entry.count);
    }

    return counts;
};

const requirementsForOption = (option: DialogueOption) => {
    if (option.type === 'process' && option.process) {
        const process = processMap.get(option.process);
        const requirements = toItemCountMap(option.requiresItems);

        for (const required of (process?.requireItems as ItemCount[] | undefined) ?? []) {
            requirements.set(required.id, (requirements.get(required.id) ?? 0) + required.count);
        }

        for (const consumed of (process?.consumeItems as ItemCount[] | undefined) ?? []) {
            requirements.set(consumed.id, (requirements.get(consumed.id) ?? 0) + consumed.count);
        }

        return requirements;
    }

    return toItemCountMap(option.requiresItems);
};

const transitionGuarantees = (option: DialogueOption) => {
    if (option.type === 'process' && option.process) {
        const process = processMap.get(option.process);
        if (!process) {
            return new Map<string, number>();
        }

        const guarantees = toItemCountMap(option.requiresItems);

        for (const required of (process.requireItems as ItemCount[] | undefined) ?? []) {
            guarantees.set(required.id, (guarantees.get(required.id) ?? 0) + required.count);
        }

        for (const consumed of (process.consumeItems as ItemCount[] | undefined) ?? []) {
            guarantees.set(consumed.id, (guarantees.get(consumed.id) ?? 0) + consumed.count);
        }

        for (const consumed of (process.consumeItems as ItemCount[] | undefined) ?? []) {
            const nextCount = (guarantees.get(consumed.id) ?? 0) - consumed.count;
            if (nextCount > 0) {
                guarantees.set(consumed.id, nextCount);
            } else {
                guarantees.delete(consumed.id);
            }
        }

        for (const created of (process.createItems as ItemCount[] | undefined) ?? []) {
            guarantees.set(created.id, (guarantees.get(created.id) ?? 0) + created.count);
        }

        return guarantees;
    }

    return toItemCountMap(option.requiresItems);
};

const satisfiesRequirements = (
    requirements: Map<string, number>,
    guarantees: Map<string, number>
) => {
    for (const [itemId, count] of requirements.entries()) {
        if ((guarantees.get(itemId) ?? 0) < count) {
            return false;
        }
    }

    return true;
};

const getStateLockErrors = (
    nodeMap: Map<string, DialogueNode>,
    reachable: Set<string>,
    quest: QuestLike,
    questPath: string,
    startId: string
): DialogueValidationError[] => {
    const incomingTransitions = new Map<string, { from: string; guarantees: Map<string, number> }[]>();

    for (const [nodeId, node] of nodeMap.entries()) {
        if (!reachable.has(nodeId)) continue;
        for (const option of node.options ?? []) {
            if (!isGotoTransition(option, nodeMap)) continue;
            const transitions = incomingTransitions.get(option.goto) ?? [];
            transitions.push({ from: nodeId, guarantees: transitionGuarantees(option) });
            incomingTransitions.set(option.goto, transitions);
        }
    }

    const errors: DialogueValidationError[] = [];

    for (const [targetNodeId, transitions] of incomingTransitions.entries()) {
        if (!reachable.has(targetNodeId)) continue;
        const targetNode = nodeMap.get(targetNodeId);
        if (!targetNode) continue;

        const targetOptions = targetNode.options ?? [];
        const hasEscapeOption = targetOptions.some((option) => option.type !== 'process');
        if (hasEscapeOption) continue;

        for (const transition of transitions) {
            if (transition.from === startId) continue;
            const hasActionableOption = targetOptions.some((option) =>
                satisfiesRequirements(requirementsForOption(option), transition.guarantees)
            );

            if (hasActionableOption) continue;

            errors.push({
                questId: quest.id ?? 'unknown-quest',
                questPath,
                nodeId: targetNodeId,
                reason: 'state-locked',
                snippet: `entered from "${transition.from}" but lacks guaranteed items for any option; ${toNodeSnippet(targetNode)}`,
            });
        }
    }

    return errors;
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
            if (isGotoTransition(option, nodeMap) && !reachable.has(option.goto as string)) {
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
            (option) => option.type === 'finish' || isGotoTransition(option, nodeMap)
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
    }

    errors.push(...getStateLockErrors(nodeMap, reachable, quest, questPath, startId));

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

    it('flags transitions that can enter an action-locked node', () => {
        const quest: QuestLike = {
            id: 'fixture/state-locked',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Entry',
                    options: [{ type: 'goto', goto: 'temp', text: 'Continue' }],
                },
                {
                    id: 'temp',
                    text: 'Core temp logged.',
                    options: [{ type: 'goto', goto: 'measure', text: 'Check moisture' }],
                },
                {
                    id: 'measure',
                    text: 'Need a moisture meter here.',
                    options: [
                        {
                            type: 'process',
                            process: 'measure-compost-moisture',
                            goto: 'finish',
                            text: 'Measure moisture',
                        },
                    ],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest, 'fixtures/state-locked.json')).toEqual([
            {
                questId: 'fixture/state-locked',
                questPath: 'fixtures/state-locked.json',
                nodeId: 'measure',
                reason: 'dead-end',
                snippet: 'text="Need a moisture meter here." options=[process -> finish (Measure moisture)]',
            },
            {
                questId: 'fixture/state-locked',
                questPath: 'fixtures/state-locked.json',
                nodeId: 'measure',
                reason: 'state-locked',
                snippet:
                    'entered from "temp" but lacks guaranteed items for any option; text="Need a moisture meter here." options=[process -> finish (Measure moisture)]',
            },
            {
                questId: 'fixture/state-locked',
                questPath: 'fixtures/state-locked.json',
                nodeId: 'start',
                reason: 'unreachable-finish',
                snippet: 'text="Entry" options=[goto -> temp (Continue)]',
            },
        ]);
    });

    it('flags process-only nodes as dead-ends when no goto dialogue option exists', () => {
        const quest: QuestLike = {
            id: 'fixture/process-goto-without-dialogue-goto',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Entry',
                    options: [{ type: 'goto', goto: 'setup', text: 'Continue' }],
                },
                {
                    id: 'setup',
                    text: 'Run process before finishing.',
                    options: [
                        {
                            type: 'process',
                            process: 'sift-compost',
                            goto: 'finish',
                            text: 'Run process',
                        },
                    ],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest, 'fixtures/process-goto-without-dialogue-goto.json'))
            .toEqual([
                {
                    questId: 'fixture/process-goto-without-dialogue-goto',
                    questPath: 'fixtures/process-goto-without-dialogue-goto.json',
                    nodeId: 'setup',
                    reason: 'dead-end',
                    snippet: 'text="Run process before finishing." options=[process -> finish (Run process)]',
                },
                {
                    questId: 'fixture/process-goto-without-dialogue-goto',
                    questPath: 'fixtures/process-goto-without-dialogue-goto.json',
                    nodeId: 'start',
                    reason: 'unreachable-finish',
                    snippet: 'text="Entry" options=[goto -> setup (Continue)]',
                },
            ]);
    });

    it('treats process consumeItems as required for actionability checks', () => {
        const quest: QuestLike = {
            id: 'fixture/state-locked-consume-items',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Entry',
                    options: [{ type: 'goto', goto: 'prep', text: 'Continue' }],
                },
                {
                    id: 'prep',
                    text: 'Gather your tools first.',
                    options: [{ type: 'goto', goto: 'craft', text: 'Ready' }],
                },
                {
                    id: 'craft',
                    text: 'Need consumables to proceed.',
                    options: [
                        {
                            type: 'process',
                            process: 'bucket-water-dechlorinated',
                            goto: 'finish',
                            text: 'Prepare water',
                        },
                    ],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(validateQuestDialogueCompletable(quest, 'fixtures/state-locked-consume-items.json')).toEqual(
            [
                {
                    questId: 'fixture/state-locked-consume-items',
                    questPath: 'fixtures/state-locked-consume-items.json',
                    nodeId: 'craft',
                    reason: 'dead-end',
                    snippet:
                        'text="Need consumables to proceed." options=[process -> finish (Prepare water)]',
                },
                {
                    questId: 'fixture/state-locked-consume-items',
                    questPath: 'fixtures/state-locked-consume-items.json',
                    nodeId: 'craft',
                    reason: 'state-locked',
                    snippet:
                        'entered from "prep" but lacks guaranteed items for any option; text="Need consumables to proceed." options=[process -> finish (Prepare water)]',
                },
                {
                    questId: 'fixture/state-locked-consume-items',
                    questPath: 'fixtures/state-locked-consume-items.json',
                    nodeId: 'start',
                    reason: 'unreachable-finish',
                    snippet: 'text="Entry" options=[goto -> prep (Continue)]',
                },
            ]
        );
    });

    it('treats process option requiresItems as required for actionability checks', () => {
        const quest: QuestLike = {
            id: 'fixture/state-locked-process-option-requires-items',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Entry',
                    options: [{ type: 'goto', goto: 'prep', text: 'Continue' }],
                },
                {
                    id: 'prep',
                    text: 'Proceed to process step.',
                    options: [{ type: 'goto', goto: 'craft', text: 'Ready' }],
                },
                {
                    id: 'craft',
                    text: 'Need quest-level required item to proceed.',
                    options: [
                        {
                            type: 'process',
                            process: 'bucket-water-dechlorinated',
                            requiresItems: [
                                {
                                    id: '4d21c498-9225-4d0b-9a1a-ed65e349f0a8',
                                    count: 1,
                                },
                            ],
                            goto: 'finish',
                            text: 'Prepare water',
                        },
                    ],
                },
                {
                    id: 'finish',
                    text: 'Done',
                    options: [{ type: 'finish', text: 'Complete' }],
                },
            ],
        };

        expect(
            validateQuestDialogueCompletable(
                quest,
                'fixtures/state-locked-process-option-requires-items.json'
            )
        ).toEqual([
            {
                questId: 'fixture/state-locked-process-option-requires-items',
                questPath: 'fixtures/state-locked-process-option-requires-items.json',
                nodeId: 'craft',
                reason: 'dead-end',
                snippet:
                    'text="Need quest-level required item to proceed." options=[process -> finish (Prepare water)]',
            },
            {
                questId: 'fixture/state-locked-process-option-requires-items',
                questPath: 'fixtures/state-locked-process-option-requires-items.json',
                nodeId: 'craft',
                reason: 'state-locked',
                snippet:
                    'entered from "prep" but lacks guaranteed items for any option; text="Need quest-level required item to proceed." options=[process -> finish (Prepare water)]',
            },
            {
                questId: 'fixture/state-locked-process-option-requires-items',
                questPath: 'fixtures/state-locked-process-option-requires-items.json',
                nodeId: 'start',
                reason: 'unreachable-finish',
                snippet: 'text="Entry" options=[goto -> prep (Continue)]',
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
