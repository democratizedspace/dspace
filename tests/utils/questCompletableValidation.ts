import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ItemRequirement = { id: string; count?: number };

export type DialogueOption = {
    type?: string;
    text?: string;
    goto?: string;
    process?: string;
    requiresItems?: unknown;
    requiredItems?: unknown;
    requiredItemIds?: unknown;
    requiredItemId?: unknown;
    grantsItems?: ItemRequirement[];
    requiresGitHub?: boolean;
};

export type DialogueNode = {
    id: string;
    text?: string;
    terminal?: boolean;
    options?: DialogueOption[];
};

export type QuestData = {
    id: string;
    path?: string;
    start?: string;
    requiresItems?: unknown;
    requiredItems?: unknown;
    requiredItemIds?: unknown;
    requiredItemId?: unknown;
    rewards?: ItemRequirement[];
    requiresQuests?: string[];
    dialogue?: DialogueNode[];
};

export type DialogueValidationIssue = {
    questId: string;
    questPath: string;
    nodeId: string;
    reason: 'missing-node' | 'dead-end' | 'unreachable-finish';
    snippet: string;
};

export const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');

export const toItemIds = (entries: ItemRequirement[] | undefined) =>
    (entries ?? []).map((entry) => entry.id).filter(Boolean);

export const toItemIdsFromUnknown = (value: unknown) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        if (value.length === 0) return [];
        if (typeof value[0] === 'string') {
            return (value as string[]).filter(Boolean);
        }
        return (value as ItemRequirement[])
            .map((entry) => entry?.id)
            .filter((id): id is string => Boolean(id));
    }
    if (typeof value === 'string') return [value];
    if (typeof value === 'object' && value && 'id' in value) {
        const id = (value as ItemRequirement).id;
        return id ? [id] : [];
    }
    return [];
};

export const getRequiredItemIds = (value: {
    requiresItems?: unknown;
    requiredItems?: unknown;
    requiredItemIds?: unknown;
    requiredItemId?: unknown;
}) => {
    const required = [
        ...toItemIdsFromUnknown(value?.requiresItems),
        ...toItemIdsFromUnknown(value?.requiredItems),
        ...toItemIdsFromUnknown(value?.requiredItemIds),
        ...toItemIdsFromUnknown(value?.requiredItemId),
    ];

    return [...new Set(required)];
};

export const uniqueItemIds = (itemIds: string[]) => [...new Set(itemIds.filter(Boolean))];

export const describeNode = (node: DialogueNode | undefined) => {
    if (!node) return 'node missing';
    const text = (node.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const options = (node.options ?? []).map((option) => {
        const parts = [option.type ?? 'unknown'];
        if (option.goto) parts.push(`goto:${option.goto}`);
        if (option.process) parts.push(`process:${option.process}`);
        if (option.text) parts.push(`text:${option.text}`);
        return parts.join(' ');
    });

    return [
        `text: "${text}"`,
        options.length > 0 ? `options: ${options.join(' | ')}` : 'options: none',
    ].join(', ');
};

const nodeIsTerminal = (node: DialogueNode) => {
    if (node.terminal === true) return true;
    return (node.options ?? []).some((option) => option.type === 'finish');
};

const optionTargetsNode = (option: DialogueOption) =>
    option.type === 'goto' || option.type === 'process' || Boolean(option.goto);

export const validateQuestDialogueGraph = (
    quest: QuestData,
    questPath = 'unknown path'
): DialogueValidationIssue[] => {
    const issues: DialogueValidationIssue[] = [];
    const nodes = new Map((quest.dialogue ?? []).map((node) => [node.id, node]));
    const startId = quest.start;

    if (!startId || !nodes.has(startId)) {
        issues.push({
            questId: quest.id,
            questPath,
            nodeId: startId ?? 'missing-start',
            reason: 'missing-node',
            snippet: `Quest start node "${startId ?? 'undefined'}" is missing from dialogue.`,
        });
        return issues;
    }

    const reachable = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || reachable.has(currentId)) continue;
        reachable.add(currentId);

        const node = nodes.get(currentId);
        if (!node) {
            issues.push({
                questId: quest.id,
                questPath,
                nodeId: currentId,
                reason: 'missing-node',
                snippet: `Node "${currentId}" is referenced but not defined.`,
            });
            continue;
        }

        for (const option of node.options ?? []) {
            if (!optionTargetsNode(option)) continue;
            if (option.goto) {
                queue.push(option.goto);
            }
        }
    }

    for (const nodeId of reachable) {
        const node = nodes.get(nodeId);
        if (!node) {
            continue;
        }

        const options = node.options ?? [];
        const hasTransition = options.some((option) => option.type !== 'finish');

        if (options.length === 0 || (!nodeIsTerminal(node) && !hasTransition)) {
            issues.push({
                questId: quest.id,
                questPath,
                nodeId,
                reason: 'dead-end',
                snippet: describeNode(node),
            });
        }

        for (const option of options) {
            if (!optionTargetsNode(option) || !option.goto) continue;
            if (!nodes.has(option.goto)) {
                issues.push({
                    questId: quest.id,
                    questPath,
                    nodeId,
                    reason: 'missing-node',
                    snippet: `Option target "${option.goto}" is missing. ${describeNode(node)}`,
                });
            }
        }
    }

    const reachableFinishNode = [...reachable].some((nodeId) => {
        const node = nodes.get(nodeId);
        return Boolean(node && (node.options ?? []).some((option) => option.type === 'finish'));
    });

    if (!reachableFinishNode) {
        issues.push({
            questId: quest.id,
            questPath,
            nodeId: startId,
            reason: 'unreachable-finish',
            snippet: `No finish option is reachable from start node "${startId}".`,
        });
    }

    return issues;
};

export const formatDialogueIssues = (issues: DialogueValidationIssue[]) =>
    issues
        .map(
            (issue) =>
                `Quest "${issue.questId}" (${issue.questPath}) -> node "${issue.nodeId}" [${issue.reason}]: ${issue.snippet}`
        )
        .join('\n');

export const loadQuestPaths = async (baseDir = QUESTS_DIR) => {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const paths = new Map<string, string>();

    for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            const nested = await loadQuestPaths(fullPath);
            for (const [id, filePath] of nested) {
                paths.set(id, filePath);
            }
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const raw = await fs.readFile(fullPath, 'utf8');
        const quest = JSON.parse(raw);
        if (quest?.id) {
            paths.set(quest.id, path.relative(process.cwd(), fullPath));
        }
    }

    return paths;
};
