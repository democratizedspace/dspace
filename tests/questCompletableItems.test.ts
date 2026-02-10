import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

type ItemEntry = { id: string; count: number };
type DialogueOption = {
    type?: string;
    text?: string;
    goto?: string;
    process?: string;
    requiresItems?: ItemEntry[];
    requiredItems?: ItemEntry[];
    requiredItemIds?: string[];
    requiredItemId?: string;
};
type DialogueNode = { id?: string; text?: string; options?: DialogueOption[] };

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');

const toItemIds = (entries: ItemEntry[] | undefined) =>
    (entries ?? []).map((entry) => entry.id);

const toItemIdsFromUnknown = (value: unknown) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        if (value.length === 0) return [];
        if (typeof value[0] === 'string') {
            return (value as string[]).filter(Boolean);
        }
        return (value as ItemEntry[]).map((entry) => entry.id).filter(Boolean);
    }
    if (typeof value === 'string') return [value];
    if (typeof value === 'object' && value && 'id' in value) {
        const entry = value as ItemEntry;
        return entry.id ? [entry.id] : [];
    }
    return [];
};

const getRequiredItemIds = (option: any) => {
    const required = [
        ...toItemIdsFromUnknown(option?.requiresItems),
        ...toItemIdsFromUnknown(option?.requiredItems),
        ...toItemIdsFromUnknown(option?.requiredItemIds),
        ...toItemIdsFromUnknown(option?.requiredItemId),
    ];
    return [...new Set(required)];
};

const getGrantedItems = (quest: any) =>
    (quest.dialogue ?? []).flatMap((node: any) =>
        (node.options ?? []).flatMap((option: any) => toItemIds(option.grantsItems))
    );

const getFinishOptions = (quest: any) =>
    (quest.dialogue ?? []).flatMap((node: any) =>
        (node.options ?? []).filter((option: any) => option.type === 'finish')
    );

const getNodeSnippet = (node: DialogueNode) => {
    const text = (node?.text ?? '').trim().replace(/\s+/g, ' ');
    const optionTexts = (node?.options ?? [])
        .map((option) => option?.text?.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' | ');
    return `text="${text.slice(0, 140)}" options="${optionTexts.slice(0, 140)}"`;
};

const collectReachableNodes = (quest: any) => {
    const nodes = new Map<string, DialogueNode>();
    for (const node of quest?.dialogue ?? []) {
        if (node?.id) {
            nodes.set(node.id, node);
        }
    }

    const startId = quest?.start ?? 'start';
    const visited = new Set<string>();
    if (!nodes.has(startId)) {
        return { nodes, visited, startId, missingStart: true };
    }

    const queue = [startId];
    while (queue.length > 0) {
        const nodeId = queue.shift() as string;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        const node = nodes.get(nodeId);
        if (!node) continue;

        for (const option of node.options ?? []) {
            if (option?.goto && nodes.has(option.goto)) {
                queue.push(option.goto);
            }
        }
    }

    return { nodes, visited, startId, missingStart: false };
};

const validateDialogueGraph = (quest: any) => {
    const { nodes, visited, startId, missingStart } = collectReachableNodes(quest);
    const deadEnds: string[] = [];
    let reachableFinishFound = false;

    for (const nodeId of visited) {
        const node = nodes.get(nodeId);
        if (!node) continue;
        const options = node.options ?? [];
        const hasFinishOption = options.some((option) => option?.type === 'finish');
        if (hasFinishOption) {
            reachableFinishFound = true;
        }

        const hasProgressOption = options.some(
            (option) =>
                option?.type === 'finish' ||
                (typeof option?.goto === 'string' && option.goto.length > 0 && nodes.has(option.goto))
        );

        if (!hasProgressOption) {
            deadEnds.push(
                `node "${nodeId}" ${getNodeSnippet(node)} in quest "${quest.id}"`
            );
        }
    }

    const finishNodeIds = [...nodes.entries()]
        .filter(([, node]) => (node.options ?? []).some((option) => option?.type === 'finish'))
        .map(([nodeId]) => nodeId);

    const unreachableFinishNodes = finishNodeIds.filter((nodeId) => !visited.has(nodeId));

    return {
        deadEnds,
        missingStart,
        startId,
        reachableFinishFound,
        unreachableFinishNodes,
    };
};

const getReachableRequiredItemIds = (quest: any) => {
    const { nodes, visited } = collectReachableNodes(quest);
    const reverseEdges = new Map<string, Set<string>>();
    const canReachFinish = new Set<string>();

    for (const [nodeId, node] of nodes.entries()) {
        for (const option of node.options ?? []) {
            if (option?.type === 'finish') {
                canReachFinish.add(nodeId);
            }
            if (!option?.goto || !nodes.has(option.goto)) continue;
            if (!reverseEdges.has(option.goto)) {
                reverseEdges.set(option.goto, new Set());
            }
            reverseEdges.get(option.goto)?.add(nodeId);
        }
    }

    const queue = [...canReachFinish];
    while (queue.length > 0) {
        const nodeId = queue.shift() as string;
        for (const predecessor of reverseEdges.get(nodeId) ?? []) {
            if (canReachFinish.has(predecessor)) continue;
            canReachFinish.add(predecessor);
            queue.push(predecessor);
        }
    }

    const required = new Set<string>();
    for (const nodeId of visited) {
        if (!canReachFinish.has(nodeId)) continue;
        const node = nodes.get(nodeId);
        for (const option of node?.options ?? []) {
            const leadsToFinish =
                option?.type === 'finish' ||
                (Boolean(option?.goto) && canReachFinish.has(option.goto as string));
            if (!leadsToFinish) continue;
            for (const itemId of getRequiredItemIds(option)) {
                required.add(itemId);
            }
        }
    }

    return [...required];
};

const getMissingItems = (required: string[], obtainable: Set<string>) =>
    required.filter((itemId) => !obtainable.has(itemId));

const uniqueItemIds = (items: string[]) => [...new Set(items.filter(Boolean))];

const getItemDependencies = (item: any) =>
    uniqueItemIds(toItemIdsFromUnknown(item?.dependencies));

const loadQuestPaths = async (baseDir = QUESTS_DIR) => {
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

describe('quest completion item availability', () => {
    it('ensures reachable dialogue nodes are not dead-ends and can reach finish', async () => {
        const quests = await loadQuests();
        const questPaths = await loadQuestPaths();
        const errors: string[] = [];

        for (const quest of quests) {
            if (!Array.isArray(quest.dialogue) || quest.dialogue.length === 0) continue;

            const result = validateDialogueGraph(quest);
            const questPath = questPaths.get(quest.id) ?? 'unknown path';

            if (result.missingStart) {
                errors.push(
                    `Quest "${quest.id}" (${questPath}) start node "${result.startId}" is missing.`
                );
            }
            if (result.deadEnds.length > 0) {
                errors.push(
                    `Quest "${quest.id}" (${questPath}) has reachable dead-end nodes:\n  - ${result.deadEnds.join('\n  - ')}`
                );
            }
            if (!result.reachableFinishFound) {
                errors.push(
                    `Quest "${quest.id}" (${questPath}) has no reachable finish option from start node "${result.startId}".`
                );
            }
            if (result.unreachableFinishNodes.length > 0) {
                errors.push(
                    `Quest "${quest.id}" (${questPath}) has finish nodes that are unreachable: ${result.unreachableFinishNodes.join(', ')}.`
                );
            }
        }

        expect(errors).toEqual([]);
    });

    it('regresses composting/turn-pile temp branch dead-end checks', async () => {
        const quests = await loadQuests();
        const quest = quests.find((entry: any) => entry.id === 'composting/turn-pile');
        expect(quest).toBeTruthy();

        const result = validateDialogueGraph(quest);
        expect(result.deadEnds).toEqual([]);
        expect(result.reachableFinishFound).toBe(true);
    });

    it('detects dead-end fixtures that cannot reach finish', () => {
        const fixture = {
            id: 'test/dead-end',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Start',
                    options: [{ type: 'goto', text: 'Go', goto: 'temp' }],
                },
                {
                    id: 'temp',
                    text: 'Trap node',
                    options: [{ type: 'process', text: 'Loop without goto', process: 'noop' }],
                },
                {
                    id: 'finish',
                    text: 'Finish',
                    options: [{ type: 'finish', text: 'Done' }],
                },
            ],
        };

        const result = validateDialogueGraph(fixture);
        expect(result.deadEnds).toHaveLength(1);
        expect(result.reachableFinishFound).toBe(false);
        expect(result.unreachableFinishNodes).toEqual(['finish']);
    });

    it('ensures finish requirements are obtainable', async () => {
        const quests = await loadQuests();
        const questPaths = await loadQuestPaths();
        const itemMap = new Map(
            (items as Array<any>).map((item) => [item.id, item])
        );
        const getItemDependencyInfo = (itemId: string) => {
            const item = itemMap.get(itemId);
            const dependencies = getItemDependencies(item);
            const unknown = dependencies.filter((dependency) => !itemMap.has(dependency));
            const known = dependencies.filter((dependency) => itemMap.has(dependency));
            return { known, unknown };
        };
        const purchasable = new Set(
            (items as Array<any>).filter((item) => item.price).map((item) => item.id)
        );
        const betaPlaceholderItems = new Set(
            (items as Array<any>)
                .filter((item) => item.priceExemptionReason === 'BETA_PLACEHOLDER')
                .map((item) => item.id)
        );

        const rewardSources = new Map<string, string[]>();
        for (const quest of quests) {
            const addRewardSource = (itemId: string) => {
                if (!rewardSources.has(itemId)) {
                    rewardSources.set(itemId, []);
                }
                rewardSources.get(itemId)?.push(quest.id);
            };

            for (const reward of quest.rewards ?? []) {
                addRewardSource(reward.id);
            }

            for (const itemId of getGrantedItems(quest)) {
                addRewardSource(itemId);
            }
        }

        const processSources = new Map<string, Array<any>>();
        for (const process of processes as Array<any>) {
            for (const item of process.createItems ?? []) {
                if (!processSources.has(item.id)) {
                    processSources.set(item.id, []);
                }
                processSources.get(item.id)?.push(process);
            }
        }

        const obtainable = new Set<string>();
        // This validator focuses on item obtainability and assumes GitHub connections can be made.
        const allowGitHubRequirement = true;
        const completableQuests = new Set<string>();
        let changed = true;

        while (changed) {
            changed = false;

            for (const itemId of [...purchasable, ...betaPlaceholderItems]) {
                if (obtainable.has(itemId)) continue;
                const { known, unknown } = getItemDependencyInfo(itemId);
                if (
                    unknown.length === 0 &&
                    known.every((dependency) => obtainable.has(dependency))
                ) {
                    obtainable.add(itemId);
                    changed = true;
                }
            }

            for (const process of processes as Array<any>) {
                const requirements = [
                    ...toItemIds(process.requireItems),
                    ...toItemIds(process.consumeItems),
                ];
                if (requirements.every((id) => obtainable.has(id))) {
                    for (const created of toItemIds(process.createItems)) {
                        if (!obtainable.has(created)) {
                            obtainable.add(created);
                            changed = true;
                        }
                    }
                }
            }

            for (const quest of quests) {
                if (completableQuests.has(quest.id)) continue;
                if (
                    (quest.requiresQuests ?? []).some(
                        (id: string) => !completableQuests.has(id)
                    )
                ) {
                    continue;
                }

                const finishOptions = getFinishOptions(quest);
                if (finishOptions.length === 0) continue;

                const canFinish = finishOptions.some((option: any) => {
                    const itemsMet = getRequiredItemIds(option).every((id) =>
                        obtainable.has(id)
                    );
                    const githubRequirementMet = !option.requiresGitHub || allowGitHubRequirement;
                    return itemsMet && githubRequirementMet;
                });

                if (canFinish) {
                    completableQuests.add(quest.id);
                    const questRewards = [
                        ...toItemIds(quest.rewards),
                        ...getGrantedItems(quest),
                    ];
                    for (const reward of questRewards) {
                        if (!obtainable.has(reward)) {
                            obtainable.add(reward);
                            changed = true;
                        }
                    }
                }
            }
        }

        const errors: string[] = [];

        const explainMissingItem = (itemId: string) => {
            const item = itemMap.get(itemId);
            if (!item) {
                return `Unknown item (${itemId}) is not defined in inventory.`;
            }
            const name = item?.name ?? 'Unknown item';
            const { known, unknown } = getItemDependencyInfo(itemId);
            if (unknown.length > 0) {
                return `${name} (${itemId}) depends on unknown item IDs: ${unknown.join(', ')}.`;
            }
            const missingDependencies = getMissingItems(
                known,
                obtainable
            );
            if (missingDependencies.length > 0) {
                const missingNames = missingDependencies
                    .map((missingId) => itemMap.get(missingId)?.name ?? missingId)
                    .join(', ');
                return `${name} (${itemId}) depends on missing items: ${missingNames}.`;
            }
            const sources = processSources.get(itemId) ?? [];
            if (sources.length > 0) {
                const scored = sources.map((process) => {
                    const missing = getMissingItems(
                        [
                            ...toItemIds(process.requireItems),
                            ...toItemIds(process.consumeItems),
                        ],
                        obtainable
                    );
                    return { process, missing };
                });
                scored.sort((a, b) => a.missing.length - b.missing.length);
                const best = scored[0];
                if (best.missing.length > 0) {
                    const missingNames = best.missing
                        .map((missingId) => itemMap.get(missingId)?.name ?? missingId)
                        .join(', ');
                    return (
                        `${name} (${itemId}) requires "${best.process.id}" inputs: ${missingNames}.`
                    );
                }
                return `${name} (${itemId}) is produced by "${best.process.id}".`;
            }

            const rewarders = rewardSources.get(itemId) ?? [];
            if (rewarders.length > 0) {
                const rewardList = rewarders.join(', ');
                return (
                    `${name} (${itemId}) is only rewarded by quests that are not completable: ` +
                    `${rewardList}.`
                );
            }

            return (
                `${name} (${itemId}) has no price, no producing process, and no rewarding quest.`
            );
        };

        for (const quest of quests) {
            const finishOptions = getFinishOptions(quest);
            const questPath = questPaths.get(quest.id);
            if (finishOptions.length === 0) {
                errors.push(
                    `Quest "${quest.id}" (${questPath ?? 'unknown path'}) has no finish option.`
                );
                continue;
            }

            const missingByOption = finishOptions.map((option: any) => {
                const missing = getMissingItems(getRequiredItemIds(option), obtainable);
                const requiresGitHub = Boolean(option.requiresGitHub);
                return { option, missing, requiresGitHub };
            });

            const viable = missingByOption.find(
                (entry) =>
                    entry.missing.length === 0 &&
                    (!entry.requiresGitHub || allowGitHubRequirement)
            );
            if (viable) continue;

            missingByOption.sort((a, b) => a.missing.length - b.missing.length);
            const best = missingByOption[0];
            const missingItemsDetail =
                best.missing.length === 0
                    ? []
                    : best.missing.map(explainMissingItem);
            const missingRequirementsDetail = best.requiresGitHub
                ? ['GitHub connection required.']
                : [];
            const details = [...missingItemsDetail, ...missingRequirementsDetail]
                .filter(Boolean)
                .join('\n  - ');
            errors.push(
                `Quest "${quest.id}" (${questPath ?? 'unknown path'}) missing items:\n  - ${details}`
            );

        }

        for (const quest of quests) {
            const requiredInReachableDialogue = getReachableRequiredItemIds(quest);
            const unreachableRequired = getMissingItems(requiredInReachableDialogue, obtainable);
            if (unreachableRequired.length === 0) continue;

            const questPath = questPaths.get(quest.id);
            const diagnostics = unreachableRequired
                .slice(0, 5)
                .map(explainMissingItem)
                .join('\n  - ');
            errors.push(
                `Quest "${quest.id}" (${questPath ?? 'unknown path'}) has unobtainable required dialogue items:\n  - ${diagnostics}`
            );
        }

        expect(errors).toEqual([]);
    });
});
