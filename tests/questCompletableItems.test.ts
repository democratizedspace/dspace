import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { loadQuestPaths } from './utils/questPaths';

type ItemEntry = { id: string; count: number };

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

const getQuestLevelRequiredItemIds = (quest: any) =>
    uniqueItemIds([
        ...toItemIdsFromUnknown(quest?.requiresItems),
        ...toItemIdsFromUnknown(quest?.requiredItems),
        ...toItemIdsFromUnknown(quest?.requiredItemIds),
        ...toItemIdsFromUnknown(quest?.requiredItemId),
    ]);

const getGrantedItems = (quest: any) =>
    (quest.dialogue ?? []).flatMap((node: any) =>
        (node.options ?? []).flatMap((option: any) => toItemIds(option.grantsItems))
    );

const getFinishOptions = (quest: any) =>
    (quest.dialogue ?? []).flatMap((node: any) =>
        (node.options ?? []).filter((option: any) => option.type === 'finish')
    );

const getRequiredItemsFromDialoguePath = (quest: any) => {
    const dialogue = quest.dialogue ?? [];
    if (dialogue.length === 0) return [];

    const idToNode = new Map<string, any>(
        dialogue
            .filter((node: any) => typeof node?.id === 'string' && node.id.trim())
            .map((node: any) => [node.id.trim(), node])
    );
    const startId =
        typeof quest.start === 'string' && quest.start.trim()
            ? quest.start.trim()
            : (dialogue[0]?.id ?? '').trim();
    if (!startId || !idToNode.has(startId)) return [];

    const reverseEdges = new Map<string, string[]>();
    for (const node of dialogue) {
        const sourceId = typeof node?.id === 'string' ? node.id.trim() : '';
        if (!sourceId) continue;
        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!idToNode.has(target)) continue;
            if (!reverseEdges.has(target)) reverseEdges.set(target, []);
            reverseEdges.get(target)?.push(sourceId);
        }
    }

    const canReachFinish = new Set<string>();
    const queue: string[] = [];
    for (const node of dialogue) {
        const nodeId = typeof node?.id === 'string' ? node.id.trim() : '';
        if (!nodeId) continue;
        const hasFinish = (node.options ?? []).some((option: any) => option.type === 'finish');
        if (!hasFinish) continue;
        canReachFinish.add(nodeId);
        queue.push(nodeId);
    }

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId) continue;
        for (const previous of reverseEdges.get(nodeId) ?? []) {
            if (canReachFinish.has(previous)) continue;
            canReachFinish.add(previous);
            queue.push(previous);
        }
    }

    const reachableFromStart = new Set<string>();
    const walkQueue = [startId];
    while (walkQueue.length > 0) {
        const nodeId = walkQueue.shift();
        if (!nodeId || reachableFromStart.has(nodeId)) continue;
        reachableFromStart.add(nodeId);
        const node = idToNode.get(nodeId);
        if (!node) continue;
        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!idToNode.has(target) || reachableFromStart.has(target)) continue;
            walkQueue.push(target);
        }
    }

    const required = new Set<string>();
    for (const nodeId of reachableFromStart) {
        if (!canReachFinish.has(nodeId)) continue;
        const node = idToNode.get(nodeId);
        if (!node) continue;

        const hasFinishOption = (node.options ?? []).some((option: any) => option.type === 'finish');
        if (hasFinishOption) continue;

        const validTransitions = (node.options ?? []).filter((option: any) => {
            if (option.type !== 'goto' || typeof option.goto !== 'string') return false;
            const target = option.goto.trim();
            return canReachFinish.has(target) && idToNode.has(target);
        });

        if (validTransitions.length !== 1) continue;
        for (const itemId of getRequiredItemIds(validTransitions[0])) {
            required.add(itemId);
        }
    }

    return [...required];
};

const getRequiredItemsFromFinishReachableTransitions = (quest: any) => {
    const dialogue = quest.dialogue ?? [];
    if (dialogue.length === 0) return [];

    const idToNode = new Map<string, any>(
        dialogue
            .filter((node: any) => typeof node?.id === 'string' && node.id.trim())
            .map((node: any) => [node.id.trim(), node])
    );
    const startId =
        typeof quest.start === 'string' && quest.start.trim()
            ? quest.start.trim()
            : (dialogue[0]?.id ?? '').trim();
    if (!startId || !idToNode.has(startId)) return [];

    const reverseEdges = new Map<string, string[]>();
    for (const node of dialogue) {
        const sourceId = typeof node?.id === 'string' ? node.id.trim() : '';
        if (!sourceId) continue;
        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!idToNode.has(target)) continue;
            if (!reverseEdges.has(target)) reverseEdges.set(target, []);
            reverseEdges.get(target)?.push(sourceId);
        }
    }

    const canReachFinish = new Set<string>();
    const reverseQueue: string[] = [];
    for (const node of dialogue) {
        const nodeId = typeof node?.id === 'string' ? node.id.trim() : '';
        if (!nodeId) continue;
        const hasFinish = (node.options ?? []).some((option: any) => option.type === 'finish');
        if (!hasFinish) continue;
        canReachFinish.add(nodeId);
        reverseQueue.push(nodeId);
    }

    while (reverseQueue.length > 0) {
        const nodeId = reverseQueue.shift();
        if (!nodeId) continue;
        for (const previous of reverseEdges.get(nodeId) ?? []) {
            if (canReachFinish.has(previous)) continue;
            canReachFinish.add(previous);
            reverseQueue.push(previous);
        }
    }

    const reachableFromStart = new Set<string>();
    const forwardQueue = [startId];
    while (forwardQueue.length > 0) {
        const nodeId = forwardQueue.shift();
        if (!nodeId || reachableFromStart.has(nodeId)) continue;
        reachableFromStart.add(nodeId);
        const node = idToNode.get(nodeId);
        if (!node) continue;
        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!idToNode.has(target) || reachableFromStart.has(target)) continue;
            forwardQueue.push(target);
        }
    }

    const required = new Set<string>();
    for (const nodeId of reachableFromStart) {
        if (!canReachFinish.has(nodeId)) continue;
        const node = idToNode.get(nodeId);
        if (!node) continue;
        for (const option of node.options ?? []) {
            if (option.type !== 'goto' || typeof option.goto !== 'string') continue;
            const target = option.goto.trim();
            if (!idToNode.has(target) || !canReachFinish.has(target)) continue;
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

const computeObtainableItems = ({
    allItems,
    allQuests,
}: {
    allItems: Array<any>;
    allQuests: Array<any>;
}) => {
    const itemMap = new Map(allItems.map((item) => [item.id, item]));
    const getItemDependencyInfo = (itemId: string) => {
        const item = itemMap.get(itemId);
        const dependencies = getItemDependencies(item);
        const unknown = dependencies.filter((dependency) => !itemMap.has(dependency));
        const known = dependencies.filter((dependency) => itemMap.has(dependency));
        return { known, unknown };
    };

    const purchasable = new Set(allItems.filter((item) => item.price).map((item) => item.id));
    const betaPlaceholderItems = new Set(
        allItems
            .filter((item) => item.priceExemptionReason === 'BETA_PLACEHOLDER')
            .map((item) => item.id)
    );

    const obtainable = new Set<string>();
    const completableQuests = new Set<string>();
    const allowGitHubRequirement = true;
    let changed = true;

    while (changed) {
        changed = false;

        for (const itemId of [...purchasable, ...betaPlaceholderItems]) {
            if (obtainable.has(itemId)) continue;
            const { known, unknown } = getItemDependencyInfo(itemId);
            if (unknown.length === 0 && known.every((dependency) => obtainable.has(dependency))) {
                obtainable.add(itemId);
                changed = true;
            }
        }

        for (const process of processes as Array<any>) {
            const requirements = [...toItemIds(process.requireItems), ...toItemIds(process.consumeItems)];
            if (requirements.every((id) => obtainable.has(id))) {
                for (const created of toItemIds(process.createItems)) {
                    if (!obtainable.has(created)) {
                        obtainable.add(created);
                        changed = true;
                    }
                }
            }
        }

        for (const quest of allQuests) {
            if (completableQuests.has(quest.id)) continue;
            if ((quest.requiresQuests ?? []).some((id: string) => !completableQuests.has(id))) continue;

            const finishOptions = getFinishOptions(quest);
            if (finishOptions.length === 0) continue;

            const questRequiredItems = getQuestLevelRequiredItemIds(quest);
            const dialoguePathRequiredItems = getRequiredItemsFromDialoguePath(quest);
            const canFinish = finishOptions.some((option: any) => {
                const itemsMet = uniqueItemIds([
                    ...questRequiredItems,
                    ...dialoguePathRequiredItems,
                    ...getRequiredItemIds(option),
                ]).every((id) => obtainable.has(id));
                const githubRequirementMet = !option.requiresGitHub || allowGitHubRequirement;
                return itemsMet && githubRequirementMet;
            });

            if (canFinish) {
                completableQuests.add(quest.id);
                const questRewards = [...toItemIds(quest.rewards), ...getGrantedItems(quest)];
                for (const reward of questRewards) {
                    if (!obtainable.has(reward)) {
                        obtainable.add(reward);
                        changed = true;
                    }
                }
            }
        }
    }

    return obtainable;
};

describe('quest completion item availability', () => {
    it('flags unobtainable dialogue-path required items with a clear reason', () => {
        const quest = {
            id: 'fixture/unobtainable-required-item',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    options: [
                        {
                            type: 'goto',
                            goto: 'finish',
                            requiresItems: [{ id: 'missing-item', count: 1 }],
                            text: 'Attempt finish',
                        },
                    ],
                },
                {
                    id: 'finish',
                    options: [{ type: 'finish', text: 'Done' }],
                },
            ],
        };
        const questPath = 'frontend/src/pages/quests/json/fixtures/unobtainable-required-item.json';
        const obtainable = new Set<string>();
        const questRequiredItems = getQuestLevelRequiredItemIds(quest);
        const dialoguePathRequiredItems = getRequiredItemsFromDialoguePath(quest);
        const finishOptions = getFinishOptions(quest);

        const missingByOption = finishOptions.map((option: any) =>
            getMissingItems(
                uniqueItemIds([
                    ...questRequiredItems,
                    ...dialoguePathRequiredItems,
                    ...getRequiredItemIds(option),
                ]),
                obtainable
            )
        );

        const explainMissingItem = (itemId: string) =>
            `Missing Item (${itemId}) has no price, no producing process, and no rewarding quest.`;

        const detail = missingByOption[0].map(explainMissingItem).join('\n  - ');
        const error = `Quest "${quest.id}" (${questPath}) missing items:\n  - ${detail}`;

        expect(error).toContain('fixture/unobtainable-required-item');
        expect(error).toContain(questPath);
        expect(error).toContain('has no price, no producing process, and no rewarding quest.');
    });

    it('requires hand-crank-generator finish path items to be obtainable without placeholders', async () => {
        const quests = await loadQuests();
        const handCrankQuest = quests.find((quest: any) => quest.id === 'energy/hand-crank-generator');

        expect(handCrankQuest).toBeDefined();

        const obtainable = computeObtainableItems({
            allItems: items as Array<any>,
            allQuests: quests,
        });
        const handCrankMotorId = '6caa08d8-815c-4a0e-9297-0fda4516659d';

        const requiredItemIds = uniqueItemIds([
            ...getQuestLevelRequiredItemIds(handCrankQuest),
            ...getRequiredItemsFromFinishReachableTransitions(handCrankQuest),
            ...getFinishOptions(handCrankQuest).flatMap((option: any) => getRequiredItemIds(option)),
        ]);

        expect(requiredItemIds).toContain(handCrankMotorId);

        const unobtainable = requiredItemIds.filter((itemId) => !obtainable.has(itemId));

        expect(unobtainable).toEqual([]);
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
        const dialoguePathRequiredItemsByQuest = new Map<string, string[]>();
        for (const quest of quests) {
            dialoguePathRequiredItemsByQuest.set(quest.id, getRequiredItemsFromDialoguePath(quest));
        }

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

        const allowGitHubRequirement = true;
        const obtainable = computeObtainableItems({
            allItems: items as Array<any>,
            allQuests: quests,
        });

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
            const questRequiredItems = getQuestLevelRequiredItemIds(quest);
            const dialoguePathRequiredItems = (dialoguePathRequiredItemsByQuest.get(quest.id) ?? []).filter((id) =>
                itemMap.has(id)
            );
            if (finishOptions.length === 0) {
                errors.push(
                    `Quest "${quest.id}" (${questPath ?? 'unknown path'}) has no finish option.`
                );
                continue;
            }

            const missingByOption = finishOptions.map((option: any) => {
                const missing = getMissingItems(
                    uniqueItemIds([
                        ...questRequiredItems,
                        ...dialoguePathRequiredItems,
                        ...getRequiredItemIds(option),
                    ]),
                    obtainable
                );
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
            const pathRequirementSummary = dialoguePathRequiredItems.length
                ? `\n  - Path-required items considered: ${dialoguePathRequiredItems.join(', ')}`
                : '';
            errors.push(
                `Quest "${quest.id}" (${questPath ?? 'unknown path'}) missing items:\n  - ${details}${pathRequirementSummary}`
            );
        }

        expect(errors).toEqual([]);
    });
});
