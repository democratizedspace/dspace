import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';

type ItemRef = { id?: unknown; count?: unknown };
type Process = {
    id: string;
    requireItems?: Array<{ id: string; count?: number }>;
    createItems?: Array<{ id: string; count?: number }>;
};
type Quest = {
    id: string;
    start?: string;
    dialogue?: Array<{ id?: string; options?: Array<Record<string, unknown>> }>;
    rewards?: ItemRef[];
};

type QuestFile = {
    path: string;
    quest: Quest;
};

const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
const questFiles = globSync(path.join(questDir, '**/*.json')).sort();
const allowlist = new Set<string>(
    JSON.parse(
        readFileSync(path.join(__dirname, 'fixtures/unobtainableQuestAllowlist.json'), 'utf8')
    )
);

const processes: Process[] = JSON.parse(
    readFileSync(path.join(__dirname, '../frontend/src/generated/processes.json'), 'utf8')
);

const processMap = new Map(processes.map((process) => [process.id, process]));
const itemMap = new Map(items.map((item) => [item.id, item]));
const purchasableItems = new Set(
    items
        .filter((item) => typeof item.price === 'string' && item.price.trim().length > 0)
        .map((item) => item.id)
);

const quests: QuestFile[] = questFiles.map((file) => ({
    path: file,
    quest: JSON.parse(readFileSync(file, 'utf8')),
}));

const collectRewardIds = (quest: Quest): string[] => {
    const rewards: string[] = [];
    const addReward = (entry: ItemRef | undefined) => {
        if (entry && typeof entry.id === 'string') {
            rewards.push(entry.id);
        }
    };

    (quest.rewards || []).forEach(addReward);

    const visit = (node: unknown) => {
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        if (!node || typeof node !== 'object') return;
        const record = node as Record<string, unknown>;
        if (Array.isArray(record.grantsItems)) {
            record.grantsItems.forEach((entry) => addReward(entry as ItemRef));
        }
        Object.values(record).forEach(visit);
    };

    visit(quest.dialogue);
    return rewards;
};

const questRewards = new Map<string, string[]>(
    quests.map(({ quest }) => [quest.id, collectRewardIds(quest)])
);

const rewardQuestMap = new Map<string, QuestFile[]>();
for (const questFile of quests) {
    const rewardIds = questRewards.get(questFile.quest.id) || [];
    for (const rewardId of rewardIds) {
        const existing = rewardQuestMap.get(rewardId) || [];
        existing.push(questFile);
        rewardQuestMap.set(rewardId, existing);
    }
}

const processOutputMap = new Map<string, Process[]>();
for (const process of processes) {
    for (const output of process.createItems || []) {
        if (!output.id) continue;
        const existing = processOutputMap.get(output.id) || [];
        existing.push(process);
        processOutputMap.set(output.id, existing);
    }
}

const getOptionMissingItems = (option: Record<string, unknown>, obtainable: Set<string>) => {
    const missing = new Set<string>();
    const requiresItems = option.requiresItems as ItemRef[] | undefined;
    if (Array.isArray(requiresItems)) {
        for (const req of requiresItems) {
            if (typeof req.id === 'string' && !obtainable.has(req.id)) {
                missing.add(req.id);
            }
        }
    }

    if (typeof option.process === 'string') {
        const process = processMap.get(option.process);
        if (process?.requireItems) {
            for (const req of process.requireItems) {
                if (!obtainable.has(req.id)) {
                    missing.add(req.id);
                }
            }
        }
    }

    return missing;
};

const getQuestCompletionStatus = (quest: Quest, obtainable: Set<string>) => {
    const nodes = new Map<string, { options?: Array<Record<string, unknown>> }>();
    (quest.dialogue || []).forEach((node) => {
        if (node && typeof node.id === 'string') {
            nodes.set(node.id, node as { options?: Array<Record<string, unknown>> });
        }
    });

    const startId = quest.start || 'start';
    if (!nodes.has(startId)) {
        return { completable: false, missingItems: new Set<string>() };
    }

    const queue = [startId];
    const visited = new Set<string>();
    const missingItems = new Set<string>();

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId || visited.has(nodeId)) continue;
        visited.add(nodeId);
        const node = nodes.get(nodeId);
        if (!node) continue;

        for (const option of node.options || []) {
            const missing = getOptionMissingItems(option, obtainable);
            const hasMissing = missing.size > 0;

            if (!hasMissing) {
                if (typeof option.goto === 'string') {
                    queue.push(option.goto);
                }
                if (option.type === 'finish') {
                    return { completable: true, missingItems };
                }
                continue;
            }

            if (typeof option.goto === 'string' || option.type === 'finish') {
                missing.forEach((itemId) => missingItems.add(itemId));
            }
        }
    }

    return { completable: false, missingItems };
};

const computeObtainableItems = () => {
    const obtainable = new Set(purchasableItems);
    const completableQuests = new Set<string>();
    let changed = true;

    while (changed) {
        changed = false;

        for (const process of processes) {
            const canRun = (process.requireItems || []).every((req) => obtainable.has(req.id));
            if (!canRun) continue;
            for (const output of process.createItems || []) {
                if (!obtainable.has(output.id)) {
                    obtainable.add(output.id);
                    changed = true;
                }
            }
        }

        for (const { quest } of quests) {
            if (completableQuests.has(quest.id)) continue;
            const status = getQuestCompletionStatus(quest, obtainable);
            if (!status.completable) continue;
            completableQuests.add(quest.id);
            for (const rewardId of questRewards.get(quest.id) || []) {
                if (!obtainable.has(rewardId)) {
                    obtainable.add(rewardId);
                    changed = true;
                }
            }
        }
    }

    return { obtainable, completableQuests };
};

const describeUnobtainableItem = (
    itemId: string,
    obtainable: Set<string>,
    completableQuests: Set<string>
) => {
    const item = itemMap.get(itemId);
    const name = item?.name || 'Unknown item';

    if (purchasableItems.has(itemId)) {
        return `${itemId} (${name}) is purchasable but not in obtainable set.`;
    }

    const reasons: string[] = [];
    const producingProcesses = processOutputMap.get(itemId) || [];
    if (producingProcesses.length > 0) {
        const details = producingProcesses.map((process) => {
            const missingInputs = (process.requireItems || [])
                .filter((req) => !obtainable.has(req.id))
                .map((req) => itemMap.get(req.id)?.name || req.id);
            if (missingInputs.length === 0) {
                return `${process.id} (requirements met)`;
            }
            return `${process.id} requires ${missingInputs.join(', ')}`;
        });
        reasons.push(`process: ${details.join('; ')}`);
    }

    const rewardingQuests = rewardQuestMap.get(itemId) || [];
    if (rewardingQuests.length > 0) {
        const details = rewardingQuests.map(({ quest }) => {
            if (completableQuests.has(quest.id)) {
                return `${quest.id} (quest completable)`;
            }
            const blocked = getQuestCompletionStatus(quest, obtainable).missingItems;
            const blockedNames = [...blocked].map((id) => itemMap.get(id)?.name || id);
            const blockedLabel = blockedNames.length > 0 ? blockedNames.join(', ') : 'unknown';
            return `${quest.id} blocked by ${blockedLabel}`;
        });
        reasons.push(`quest: ${details.join('; ')}`);
    }

    if (reasons.length === 0) {
        reasons.push('no price, no producing process, no rewarding quest');
    }

    return `${itemId} (${name}): ${reasons.join(' | ')}`;
};

describe('quest item obtainability', () => {
    it('ensures required quest items can be obtained', () => {
        const { obtainable, completableQuests } = computeObtainableItems();
        const failures: string[] = [];
        const resolvedAllowlist: string[] = [];

        for (const { quest, path: questPath } of quests) {
            const status = getQuestCompletionStatus(quest, obtainable);
            if (allowlist.has(quest.id)) {
                if (status.completable || status.missingItems.size === 0) {
                    resolvedAllowlist.push(quest.id);
                }
                continue;
            }

            if (status.completable || status.missingItems.size === 0) continue;

            const missing = [...status.missingItems].filter((id) => !obtainable.has(id));
            if (missing.length === 0) continue;

            const reasons = missing.map((itemId) =>
                describeUnobtainableItem(itemId, obtainable, completableQuests)
            );
            failures.push(
                `${quest.id} (${path.relative(questDir, questPath)}): ${reasons.join(' | ')}`
            );
        }

        expect(
            failures.length,
            `Unfinishable quests due to unobtainable items:\n${failures.join('\n')}`
        ).toBe(0);

        expect(
            resolvedAllowlist.length,
            `Allowlist quests are now completable; remove them from the allowlist:\n${resolvedAllowlist.join('\n')}`
        ).toBe(0);
    });
});
