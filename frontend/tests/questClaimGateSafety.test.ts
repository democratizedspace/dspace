import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

type QuestOption = {
    type?: string;
    requiresItems?: Array<{ id: string; count: number }>;
    grantsItems?: Array<{ id: string; count: number }>;
};

type QuestNode = {
    id: string;
    options?: QuestOption[];
};

type Quest = {
    id: string;
    dialogue: QuestNode[];
};

const questDirectoryPath = path.join(__dirname, '../src/pages/quests/json');

const collectQuestFiles = (directoryPath: string): string[] => {
    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const entryPath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            return collectQuestFiles(entryPath);
        }

        return entryPath.endsWith('.json') ? [entryPath] : [];
    });
};

const readQuests = (): Quest[] =>
    collectQuestFiles(questDirectoryPath).map((filePath) =>
        JSON.parse(fs.readFileSync(filePath, 'utf8'))
    );

const canSatisfyRequirements = (
    option: QuestOption,
    inventory: Record<string, number>
): boolean => {
    const requirements = Array.isArray(option.requiresItems) ? option.requiresItems : [];
    return requirements.every((requirement) => (inventory[requirement.id] ?? 0) >= requirement.count);
};

const applyGrants = (option: QuestOption, inventory: Record<string, number>): void => {
    const grants = Array.isArray(option.grantsItems) ? option.grantsItems : [];

    grants.forEach((grantedItem) => {
        inventory[grantedItem.id] = (inventory[grantedItem.id] ?? 0) + grantedItem.count;
    });
};

describe('quest claim-gate safety', () => {
    test('self-contained claim gates unlock after claiming once', () => {
        const issues: string[] = [];

        readQuests().forEach((quest) => {
            quest.dialogue.forEach((node) => {
                const options = Array.isArray(node.options) ? node.options : [];
                const claimOptions = options.filter((option) => option.type === 'grantsItems');

                if (claimOptions.length === 0) {
                    return;
                }

                const emptyInventory: Record<string, number> = {};
                const claimOptionsAvailableFromEmpty = claimOptions.filter((option) =>
                    canSatisfyRequirements(option, emptyInventory)
                );

                if (claimOptionsAvailableFromEmpty.length === 0) {
                    return;
                }

                const grantedItemIds = new Set(
                    claimOptionsAvailableFromEmpty.flatMap((option) =>
                        (Array.isArray(option.grantsItems) ? option.grantsItems : []).map((item) => item.id)
                    )
                );

                const selfContainedProgressionOptions = options.filter((option) => {
                    if (option.type === 'grantsItems') {
                        return false;
                    }

                    const requirements = Array.isArray(option.requiresItems) ? option.requiresItems : [];
                    return (
                        requirements.length > 0 &&
                        requirements.every((requirement) => grantedItemIds.has(requirement.id))
                    );
                });

                if (selfContainedProgressionOptions.length === 0) {
                    return;
                }

                const inventoryAfterClaims: Record<string, number> = {};
                claimOptionsAvailableFromEmpty.forEach((option) => applyGrants(option, inventoryAfterClaims));

                const hasUnlockedProgression = selfContainedProgressionOptions.some((option) =>
                    canSatisfyRequirements(option, inventoryAfterClaims)
                );

                if (!hasUnlockedProgression) {
                    issues.push(
                        `${quest.id}::${node.id} claims items but does not unlock any self-contained progression option`
                    );
                }
            });
        });

        expect(issues).toEqual([]);
    });
});
