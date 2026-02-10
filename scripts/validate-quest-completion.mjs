import items from '../frontend/src/pages/inventory/json/items/index.js';
import processes from '../frontend/src/generated/processes.json' assert { type: 'json' };
import { loadQuests } from './gen-quest-tree.mjs';

const TERMINAL_OPTION_TYPES = new Set(['finish']);
const TERMINAL_NODE_TYPES = new Set(['finish', 'terminal', 'exit']);

const toItemIdsFromUnknown = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        if (value.length === 0) return [];
        if (typeof value[0] === 'string') {
            return value.filter(Boolean);
        }
        return value.map((entry) => entry?.id).filter(Boolean);
    }
    if (typeof value === 'string') return [value];
    if (typeof value === 'object' && 'id' in value) {
        return value.id ? [value.id] : [];
    }
    return [];
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const getRequiredItemIds = (entity) =>
    unique([
        ...toItemIdsFromUnknown(entity?.requiresItems),
        ...toItemIdsFromUnknown(entity?.requiredItems),
        ...toItemIdsFromUnknown(entity?.requiredItemIds),
        ...toItemIdsFromUnknown(entity?.requiredItemId),
    ]);

const describeNode = (node) => {
    const text = (node?.text ?? '').replace(/\s+/g, ' ').trim();
    const shortText = text.length > 90 ? `${text.slice(0, 87)}...` : text;
    const options = (node?.options ?? []).map((option) => {
        const label = option?.text ? `"${option.text}"` : '(no option text)';
        const target = option?.goto ? ` -> ${option.goto}` : '';
        return `${option?.type ?? 'unknown'} ${label}${target}`;
    });
    return { text: shortText || '(no node text)', options: options.length > 0 ? options : ['(no options)'] };
};

export function validateQuestDialogueFlow(quest) {
    const errors = [];
    const dialogue = Array.isArray(quest?.dialogue) ? quest.dialogue : [];

    if (!quest?.start || dialogue.length === 0) {
        return errors;
    }

    const nodesById = new Map(dialogue.map((node) => [node.id, node]));
    if (!nodesById.has(quest.start)) {
        errors.push({
            questId: quest.id,
            nodeId: quest.start,
            reason: `Quest start node "${quest.start}" is missing from dialogue.`,
            node: { text: '(missing start node)', options: [] },
        });
        return errors;
    }

    const edges = new Map();
    const reverseEdges = new Map();
    const terminalNodes = new Set();

    for (const node of dialogue) {
        const nodeEdges = [];
        const options = Array.isArray(node.options) ? node.options : [];
        if (
            node?.terminal === true ||
            node?.completesQuest === true ||
            TERMINAL_NODE_TYPES.has(node?.type)
        ) {
            terminalNodes.add(node.id);
        }

        for (const option of options) {
            if (TERMINAL_OPTION_TYPES.has(option?.type) || option?.completesQuest === true) {
                terminalNodes.add(node.id);
            }

            if (typeof option?.goto === 'string' && option.goto.length > 0) {
                nodeEdges.push(option.goto);
            }
        }

        edges.set(node.id, nodeEdges);
        for (const target of nodeEdges) {
            if (!reverseEdges.has(target)) {
                reverseEdges.set(target, []);
            }
            reverseEdges.get(target).push(node.id);
        }
    }

    const reachable = new Set();
    const queue = [quest.start];
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || reachable.has(current) || !nodesById.has(current)) continue;
        reachable.add(current);
        for (const next of edges.get(current) ?? []) {
            if (!reachable.has(next)) {
                queue.push(next);
            }
        }
    }

    const canReachTerminal = new Set();
    const reverseQueue = [...terminalNodes];
    while (reverseQueue.length > 0) {
        const current = reverseQueue.shift();
        if (!current || canReachTerminal.has(current)) continue;
        canReachTerminal.add(current);
        for (const prev of reverseEdges.get(current) ?? []) {
            if (!canReachTerminal.has(prev)) {
                reverseQueue.push(prev);
            }
        }
    }

    const hasFinishNode = nodesById.has('finish');
    if (hasFinishNode && !reachable.has('finish')) {
        const node = describeNode(nodesById.get('finish'));
        errors.push({
            questId: quest.id,
            nodeId: 'finish',
            reason: 'Finish node exists but is unreachable from start.',
            node,
        });
    }

    for (const nodeId of reachable) {
        const node = nodesById.get(nodeId);
        const nodeEdges = (edges.get(nodeId) ?? []).filter((target) => nodesById.has(target));
        const isTerminal = terminalNodes.has(nodeId);
        const hasOutgoing = nodeEdges.length > 0;

        if (isTerminal) {
            continue;
        }

        if (!hasOutgoing || !canReachTerminal.has(nodeId)) {
            errors.push({
                questId: quest.id,
                nodeId,
                reason: !hasOutgoing
                    ? 'Reachable node has no outgoing path and is not terminal.'
                    : 'Reachable node cannot reach any terminal/finish outcome.',
                node: describeNode(node),
            });
        }
    }

    return errors;
}

const computeObtainableItems = (quests) => {
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const obtainability = new Set();
    const completableQuests = new Set();
    const rewardSources = new Map();

    const addRewardSource = (itemId, questId) => {
        if (!rewardSources.has(itemId)) rewardSources.set(itemId, []);
        rewardSources.get(itemId).push(questId);
    };

    for (const quest of quests) {
        for (const reward of quest.rewards ?? []) {
            addRewardSource(reward.id, quest.id);
        }
        for (const node of quest.dialogue ?? []) {
            for (const option of node.options ?? []) {
                for (const granted of toItemIdsFromUnknown(option?.grantsItems)) {
                    addRewardSource(granted, quest.id);
                }
            }
        }
    }

    const getDependencies = (itemId) => {
        const item = itemMap.get(itemId);
        const dependencies = unique(toItemIdsFromUnknown(item?.dependencies));
        return {
            known: dependencies.filter((dependency) => itemMap.has(dependency)),
            unknown: dependencies.filter((dependency) => !itemMap.has(dependency)),
        };
    };

    const purchasable = new Set(items.filter((item) => item.price).map((item) => item.id));
    const betaPlaceholderItems = new Set(
        items
            .filter((item) => item.priceExemptionReason === 'BETA_PLACEHOLDER')
            .map((item) => item.id)
    );

    let changed = true;
    while (changed) {
        changed = false;

        for (const itemId of [...purchasable, ...betaPlaceholderItems]) {
            if (obtainability.has(itemId)) continue;
            const { known, unknown } = getDependencies(itemId);
            if (unknown.length === 0 && known.every((id) => obtainability.has(id))) {
                obtainability.add(itemId);
                changed = true;
            }
        }

        for (const process of processes) {
            const requirements = unique([
                ...toItemIdsFromUnknown(process.requireItems),
                ...toItemIdsFromUnknown(process.consumeItems),
            ]);
            if (requirements.every((id) => obtainability.has(id))) {
                for (const created of toItemIdsFromUnknown(process.createItems)) {
                    if (!obtainability.has(created)) {
                        obtainability.add(created);
                        changed = true;
                    }
                }
            }
        }

        for (const quest of quests) {
            if (completableQuests.has(quest.id)) continue;
            if ((quest.requiresQuests ?? []).some((id) => !completableQuests.has(id))) {
                continue;
            }

            const canFinish = (quest.dialogue ?? []).some((node) =>
                (node.options ?? []).some((option) => {
                    if (option.type !== 'finish') return false;
                    const required = getRequiredItemIds(option);
                    return required.every((id) => obtainability.has(id));
                })
            );

            if (!canFinish) continue;
            completableQuests.add(quest.id);

            const questRewards = unique([
                ...toItemIdsFromUnknown(quest.rewards),
                ...(quest.dialogue ?? []).flatMap((node) =>
                    (node.options ?? []).flatMap((option) => toItemIdsFromUnknown(option.grantsItems))
                ),
            ]);

            for (const reward of questRewards) {
                if (!obtainability.has(reward)) {
                    obtainability.add(reward);
                    changed = true;
                }
            }
        }
    }

    return {
        obtainability,
        completableQuests,
        rewardSources,
        itemMap,
    };
};

const getQuestRequiredItems = (quest) =>
    unique([
        ...getRequiredItemIds(quest),
        ...(quest.dialogue ?? []).flatMap((node) =>
            (node.options ?? []).flatMap((option) => getRequiredItemIds(option))
        ),
    ]);

export function validateQuestRequiredItemObtainability(quests) {
    const failures = [];
    const { obtainability, completableQuests, rewardSources, itemMap } = computeObtainableItems(quests);

    for (const quest of quests) {
        const missing = getQuestRequiredItems(quest).filter((itemId) => !obtainability.has(itemId));
        if (missing.length === 0) continue;

        const details = missing.slice(0, 3).map((itemId) => {
            const item = itemMap.get(itemId);
            if (!item) {
                return `Unknown item id ${itemId} is not in inventory definitions.`;
            }

            const processCount = processes.filter((process) =>
                toItemIdsFromUnknown(process.createItems).includes(itemId)
            ).length;
            const rewardCount = (rewardSources.get(itemId) ?? []).filter(
                (questId) => completableQuests.has(questId)
            ).length;
            if (processCount === 0 && rewardCount === 0) {
                return `${item.name} (${itemId}) has no purchasable path, process output, or completable quest reward.`;
            }
            if (processCount > 0) {
                return `${item.name} (${itemId}) exists but no process input closure can produce it from obtainable items.`;
            }
            return `${item.name} (${itemId}) is only rewarded by quests that are not completable.`;
        });

        failures.push({
            questId: quest.id,
            missingItems: missing,
            details,
        });
    }

    return failures;
}

export async function validateAllQuestCompletion() {
    const quests = await loadQuests();
    const dialogueFailures = quests.flatMap((quest) => validateQuestDialogueFlow(quest));
    const itemFailures = validateQuestRequiredItemObtainability(quests);
    return { dialogueFailures, itemFailures };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    const { dialogueFailures, itemFailures } = await validateAllQuestCompletion();

    if (dialogueFailures.length === 0 && itemFailures.length === 0) {
        console.log('Quest completion validation passed.');
        process.exit(0);
    }

    if (dialogueFailures.length > 0) {
        console.error('Dialogue completion failures:');
        for (const failure of dialogueFailures) {
            console.error(`- ${failure.questId} :: ${failure.nodeId} :: ${failure.reason}`);
            console.error(`  text: ${failure.node.text}`);
            console.error(`  options: ${failure.node.options.join(' | ')}`);
        }
    }

    if (itemFailures.length > 0) {
        console.error('Required item obtainability failures:');
        for (const failure of itemFailures.slice(0, 20)) {
            console.error(`- ${failure.questId} :: missing ${failure.missingItems.slice(0, 5).join(', ')}`);
            for (const detail of failure.details) {
                console.error(`  - ${detail}`);
            }
        }
    }

    process.exit(1);
}
