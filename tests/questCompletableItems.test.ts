import { describe, expect, it } from 'vitest';
import processes from '../frontend/src/generated/processes.json' assert {
    type: 'json',
};
import items from '../frontend/src/pages/inventory/json/items';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';

type ItemEntry = { id: string; count: number };

const toItemIds = (entries: ItemEntry[] | undefined) =>
    (entries ?? []).map((entry) => entry.id);

const getFinishOptions = (quest: any) =>
    (quest.dialogue ?? []).flatMap((node: any) =>
        (node.options ?? []).filter((option: any) => option.type === 'finish')
    );

const getMissingItems = (required: string[], obtainable: Set<string>) =>
    required.filter((itemId) => !obtainable.has(itemId));

describe('quest completion item availability', () => {
    it('ensures finish requirements are obtainable', async () => {
        const quests = await loadQuests();
        const itemMap = new Map(
            (items as Array<any>).map((item) => [item.id, item])
        );
        const purchasable = new Set(
            (items as Array<any>).filter((item) => item.price).map((item) => item.id)
        );

        const rewardSources = new Map<string, string[]>();
        for (const quest of quests) {
            for (const reward of quest.rewards ?? []) {
                if (!rewardSources.has(reward.id)) {
                    rewardSources.set(reward.id, []);
                }
                rewardSources.get(reward.id)?.push(quest.id);
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

        const obtainable = new Set<string>(purchasable);
        const completableQuests = new Set<string>();
        let changed = true;

        while (changed) {
            changed = false;

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

                const canFinish = finishOptions.some((option: any) =>
                    toItemIds(option.requiresItems).every((id) => obtainable.has(id))
                );

                if (canFinish) {
                    completableQuests.add(quest.id);
                    for (const reward of toItemIds(quest.rewards)) {
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
            const name = item?.name ?? 'Unknown item';
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

        const enforcedQuests = quests.filter((quest) => quest.id.startsWith('welcome/'));

        for (const quest of enforcedQuests) {
            const finishOptions = getFinishOptions(quest);
            if (finishOptions.length === 0) {
                errors.push(`Quest "${quest.id}" has no finish option.`);
                continue;
            }

            const missingByOption = finishOptions.map((option: any) => {
                const missing = getMissingItems(toItemIds(option.requiresItems), obtainable);
                return { option, missing };
            });

            const viable = missingByOption.find((entry) => entry.missing.length === 0);
            if (viable) continue;

            missingByOption.sort((a, b) => a.missing.length - b.missing.length);
            const best = missingByOption[0];
            const details =
                best.missing.length === 0
                    ? 'Unknown missing requirements.'
                    : best.missing.map(explainMissingItem).join('\n  - ');
            errors.push(`Quest "${quest.id}" missing items:\n  - ${details}`);
        }

        expect(errors).toEqual([]);
    });
});
