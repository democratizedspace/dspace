import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';

type RewardEntry = { id?: unknown; count?: unknown };
type ProcessReference = { id?: unknown };
type ItemReference = { id?: unknown };

const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
const questFiles = globSync(path.join(questDir, '**/*.json')).sort();

const processes: Array<{ id: string }> = JSON.parse(
    readFileSync(path.join(__dirname, '../frontend/src/generated/processes.json'), 'utf8')
);

const itemIds = new Set(items.map((item) => item.id));
const processIds = new Set(processes.map((process) => process.id));
const allowedProcessPlaceholders = new Set<string>();
const allowedRewardPlaceholders = new Set(['15e3dd7e-374b-4233-b8c9-117e3057f009']);
const allowedRequiredItemPlaceholders = new Set([
    '11aa585c-16f6-4012-9fec-48f6c203f7c7',
    '15e3dd7e-374b-4233-b8c9-117e3057f009',
]);

type RewardContext = { entry: RewardEntry; path: string };
type ProcessContext = { entry: ProcessReference; path: string };
type ItemContext = { entry: ItemReference; path: string };

const collectRewardsAndProcesses = (
    node: unknown,
    pathPrefix: string,
    rewards: RewardContext[],
    processes: ProcessContext[],
    requiredItems: ItemContext[]
): void => {
    if (Array.isArray(node)) {
        node.forEach((value, index) =>
            collectRewardsAndProcesses(value, `${pathPrefix}[${index}]`, rewards, processes, requiredItems)
        );
        return;
    }

    if (!node || typeof node !== 'object') {
        return;
    }

    const record = node as Record<string, unknown>;

    if (Array.isArray(record.rewards)) {
        record.rewards.forEach((entry, index) =>
            rewards.push({ entry: entry as RewardEntry, path: `${pathPrefix}.rewards[${index}]` })
        );
    }

    if (Array.isArray(record.grantsItems)) {
        record.grantsItems.forEach((entry, index) =>
            rewards.push({
                entry: entry as RewardEntry,
                path: `${pathPrefix}.grantsItems[${index}]`,
            })
        );
    }

    if (record.type === 'process' && typeof record.process === 'string') {
        processes.push({ entry: { id: record.process }, path: `${pathPrefix}.process` });
    }

    if (Array.isArray(record.requiresItems)) {
        record.requiresItems.forEach((entry, index) =>
            requiredItems.push({
                entry: entry as ItemReference,
                path: `${pathPrefix}.requiresItems[${index}]`,
            })
        );
    }

    if (Array.isArray(record.requireItems)) {
        record.requireItems.forEach((entry, index) =>
            requiredItems.push({
                entry: entry as ItemReference,
                path: `${pathPrefix}.requireItems[${index}]`,
            })
        );
    }

    for (const [key, value] of Object.entries(record)) {
        if (key === 'rewards' || key === 'grantsItems') {
            continue;
        }
        collectRewardsAndProcesses(value, `${pathPrefix}.${key}`, rewards, processes, requiredItems);
    }
};

describe('quest reward validation', () => {
    it('uses known item/process ids and positive counts for rewards and process launches', () => {
        const seenRewardPlaceholders = new Set<string>();
        const seenRequiredItemPlaceholders = new Set<string>();
        const seenPlaceholderProcesses = new Set<string>();
        const missingRewardIds = new Set<string>();
        const missingProcessIds = new Set<string>();
        const missingRequiredItemIds = new Set<string>();

        for (const file of questFiles) {
            const quest = JSON.parse(readFileSync(file, 'utf8'));
            expect(Array.isArray(quest.rewards), `Quest must define a rewards array in ${file}`).toBe(true);
            expect(quest.rewards.length, `Quest must grant at least one reward in ${file}`).toBeGreaterThan(0);
            const rewardContexts: RewardContext[] = [];
            const processContexts: ProcessContext[] = [];
            const requiredItemContexts: ItemContext[] = [];

            collectRewardsAndProcesses(
                quest,
                path.basename(file),
                rewardContexts,
                processContexts,
                requiredItemContexts
            );

            for (const { entry, path: entryPath } of rewardContexts) {
                expect(typeof entry.id, `Expected reward id at ${entryPath} in ${file}`).toBe('string');
                const rewardId = entry.id as string;

                if (!itemIds.has(rewardId)) {
                    if (allowedRewardPlaceholders.has(rewardId)) {
                        seenRewardPlaceholders.add(rewardId);
                    } else {
                        missingRewardIds.add(`${rewardId} at ${entryPath} in ${file}`);
                    }
                }

                const count = entry.count ?? 1;
                expect(
                    typeof count,
                    `Reward count should be a number at ${entryPath} in ${file}`
                ).toBe('number');
                expect(
                    Number.isFinite(count as number),
                    `Reward count is not finite at ${entryPath} in ${file}: ${String(count)}`
                ).toBe(true);
                expect(
                    count as number,
                    `Reward count should be positive at ${entryPath} in ${file}: ${String(count)}`
                ).toBeGreaterThan(0);
            }

            for (const { entry, path: entryPath } of processContexts) {
                expect(typeof entry.id, `Expected process id at ${entryPath} in ${file}`).toBe('string');
                const processId = entry.id as string;

                if (processIds.has(processId)) {
                    continue;
                }

                if (allowedProcessPlaceholders.has(processId)) {
                    seenPlaceholderProcesses.add(processId);
                    continue;
                }

                missingProcessIds.add(`${processId} at ${entryPath} in ${file}`);
            }

            for (const { entry, path: entryPath } of requiredItemContexts) {
                expect(typeof entry.id, `Expected required item id at ${entryPath} in ${file}`).toBe(
                    'string'
                );
                const requiredItemId = entry.id as string;

                if (!itemIds.has(requiredItemId)) {
                    if (allowedRequiredItemPlaceholders.has(requiredItemId)) {
                        seenRequiredItemPlaceholders.add(requiredItemId);
                    } else {
                        missingRequiredItemIds.add(`${requiredItemId} at ${entryPath} in ${file}`);
                    }
                }
            }
        }

        expect(
            missingRewardIds.size,
            `Unknown reward item ids found:\n${Array.from(missingRewardIds).join('\n')}`
        ).toBe(0);

        expect(
            missingProcessIds.size,
            `Unknown process ids found:\n${Array.from(missingProcessIds).join('\n')}`
        ).toBe(0);

        expect(
            missingRequiredItemIds.size,
            `Unknown required item ids found:\n${Array.from(missingRequiredItemIds).join('\n')}`
        ).toBe(0);

        const unusedRewardPlaceholders = [...allowedRewardPlaceholders].filter(
            (rewardId) => !seenRewardPlaceholders.has(rewardId)
        );
        expect(
            unusedRewardPlaceholders.length,
            `Placeholder reward ids no longer referenced: ${unusedRewardPlaceholders.join(', ')}`
        ).toBe(0);


        const unusedRequiredItemPlaceholders = [...allowedRequiredItemPlaceholders].filter(
            (itemId) => !seenRequiredItemPlaceholders.has(itemId)
        );
        expect(
            unusedRequiredItemPlaceholders.length,
            `Placeholder required item ids no longer referenced: ${unusedRequiredItemPlaceholders.join(', ')}`
        ).toBe(0);

        const unusedPlaceholders = [...allowedProcessPlaceholders].filter(
            (processId) => !seenPlaceholderProcesses.has(processId)
        );
        expect(
            unusedPlaceholders.length,
            `Placeholder process ids no longer referenced: ${unusedPlaceholders.join(', ')}`
        ).toBe(0);
    });
});
