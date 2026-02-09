import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import { describe, it } from 'vitest';

type ItemRef = { id: string; count?: number };

type Process = {
    id: string;
    requireItems?: ItemRef[];
    createItems?: ItemRef[];
};

type QuestOption = {
    type: string;
    goto?: string;
    process?: string;
    requiresItems?: ItemRef[];
    grantsItems?: ItemRef[];
};

type QuestNode = {
    id: string;
    options?: QuestOption[];
};

type Quest = {
    id: string;
    start: string;
    dialogue: QuestNode[];
    rewards?: ItemRef[];
};

type QuestFile = {
    file: string;
    quest: Quest;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const questFiles = globSync(
    join(rootDir, 'frontend/src/pages/quests/json/**/*.json')
).sort();
const itemFiles = globSync(
    join(rootDir, 'frontend/src/pages/inventory/json/items/*.json')
).sort();
const processesPath = join(rootDir, 'frontend/src/pages/processes/base.json');

const readJson = <T>(path: string): T =>
    JSON.parse(readFileSync(path, 'utf8')) as T;

const items = itemFiles.flatMap((file) =>
    readJson<{ id: string; name?: string; price?: string }[]>(file)
);
const itemsById = new Map(items.map((item) => [item.id, item]));

const processes = readJson<Process[]>(processesPath);
const processesById = new Map(processes.map((process) => [process.id, process]));

const quests: QuestFile[] = questFiles.map((file) => ({
    file,
    quest: readJson<Quest>(file),
}));

const purchasableItems = new Set(
    items
        .filter((item) => typeof item.price === 'string' && item.price.trim())
        .map((item) => item.id)
);

const addItemsToSet = (
    itemsToAdd: ItemRef[] | undefined,
    target: Set<string>
) => {
    if (!itemsToAdd || itemsToAdd.length === 0) {
        return false;
    }
    let added = false;
    for (const item of itemsToAdd) {
        if (!target.has(item.id)) {
            target.add(item.id);
            added = true;
        }
    }
    return added;
};

const requirementsMet = (
    requirements: ItemRef[] | undefined,
    available: Set<string>
) => {
    if (!requirements || requirements.length === 0) {
        return true;
    }
    return requirements.every((item) => available.has(item.id));
};

const questCompletable = (quest: Quest, baseItems: Set<string>) => {
    const nodes = new Map(quest.dialogue.map((node) => [node.id, node]));
    const reachable = new Set<string>([quest.start]);
    const available = new Set(baseItems);

    let progressed = true;
    while (progressed) {
        progressed = false;
        for (const nodeId of Array.from(reachable)) {
            const node = nodes.get(nodeId);
            if (!node?.options) {
                continue;
            }

            for (const option of node.options) {
                if (!requirementsMet(option.requiresItems, available)) {
                    continue;
                }

                if (option.type === 'finish') {
                    return true;
                }

                if (addItemsToSet(option.grantsItems, available)) {
                    progressed = true;
                }

                if (option.process) {
                    const process = processesById.get(option.process);
                    if (process && requirementsMet(process.requireItems, available)) {
                        if (addItemsToSet(process.createItems, available)) {
                            progressed = true;
                        }
                    }
                }

                if (option.goto && !reachable.has(option.goto)) {
                    reachable.add(option.goto);
                    progressed = true;
                }
            }
        }
    }

    return false;
};

const itemToProcesses = new Map<string, Process[]>();
for (const process of processes) {
    for (const created of process.createItems ?? []) {
        const existing = itemToProcesses.get(created.id) ?? [];
        existing.push(process);
        itemToProcesses.set(created.id, existing);
    }
}

const itemToRewardQuests = new Map<string, Quest[]>();
for (const { quest } of quests) {
    for (const reward of quest.rewards ?? []) {
        const existing = itemToRewardQuests.get(reward.id) ?? [];
        existing.push(quest);
        itemToRewardQuests.set(reward.id, existing);
    }
}

describe('quest item obtainability', () => {
    it('ensures quests are completable with obtainable items', () => {
        const obtainableItems = new Set(purchasableItems);
        const completableQuests = new Set<string>();
        let changed = true;

        while (changed) {
            changed = false;

            for (const process of processes) {
                if (requirementsMet(process.requireItems, obtainableItems)) {
                    if (addItemsToSet(process.createItems, obtainableItems)) {
                        changed = true;
                    }
                }
            }

            for (const { quest } of quests) {
                if (completableQuests.has(quest.id)) {
                    continue;
                }
                if (questCompletable(quest, obtainableItems)) {
                    completableQuests.add(quest.id);
                    if (addItemsToSet(quest.rewards, obtainableItems)) {
                        changed = true;
                    }
                }
            }
        }

        const failures: string[] = [];

        const itemName = (id: string) =>
            itemsById.get(id)?.name ?? 'Unknown item';

        const enforcedQuestIds = new Set(
            quests
                .map(({ quest }) => quest.id)
                .filter((questId) => questId.startsWith('welcome/'))
        );

        for (const { quest, file } of quests) {
            if (!enforcedQuestIds.has(quest.id)) {
                continue;
            }
            if (questCompletable(quest, obtainableItems)) {
                continue;
            }

            const missingItems = new Set<string>();
            for (const node of quest.dialogue) {
                for (const option of node.options ?? []) {
                    for (const requirement of option.requiresItems ?? []) {
                        if (!obtainableItems.has(requirement.id)) {
                            missingItems.add(requirement.id);
                        }
                    }
                }
            }

            if (missingItems.size === 0) {
                continue;
            }

            const questLines = [
                `- ${quest.id} (${relative(rootDir, file)})`,
            ];
            for (const itemId of missingItems) {
                const item = itemsById.get(itemId);
                const reasons: string[] = [];

                if (!item?.price) {
                    reasons.push('no price');
                }

                const producers = itemToProcesses.get(itemId) ?? [];
                if (producers.length === 0) {
                    reasons.push('no producing process');
                } else {
                    const blocked = producers
                        .map((process) => {
                            const missingReqs = (
                                process.requireItems ?? []
                            ).filter((req) => !obtainableItems.has(req.id));
                            if (missingReqs.length === 0) {
                                return null;
                            }
                            const missingNames = missingReqs
                                .map((req) => `${itemName(req.id)} (${req.id})`)
                                .join(', ');
                            return `${process.id} requires ${missingNames}`;
                        })
                        .filter((entry): entry is string => Boolean(entry));

                    if (blocked.length === producers.length) {
                        reasons.push(
                            `producing processes blocked: ${blocked.join('; ')}`
                        );
                    }
                }

                const rewarders = itemToRewardQuests.get(itemId) ?? [];
                if (rewarders.length === 0) {
                    reasons.push('no rewarding quest');
                } else {
                    const blockedQuests = rewarders.filter(
                        (rewardQuest) =>
                            !completableQuests.has(rewardQuest.id)
                    );
                    if (blockedQuests.length === rewarders.length) {
                        reasons.push(
                            `rewarding quests blocked: ${blockedQuests
                                .map((rewardQuest) => rewardQuest.id)
                                .join(', ')}`
                        );
                    }
                }

                if (reasons.length === 0) {
                    reasons.push('no obtainable source found');
                }

                questLines.push(
                    `  - ${itemName(itemId)} (${itemId}): ${reasons.join('; ')}`
                );
            }

            failures.push(questLines.join('\n'));
        }

        if (failures.length > 0) {
            const message = [
                'Quest item obtainability check failed:',
                ...failures,
            ].join('\n');
            throw new Error(message);
        }
    });
});
