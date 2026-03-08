import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type QuestOption = {
    type?: string;
    grantsItems?: Array<{ id?: string; count?: number }>;
    requiresItems?: Array<{ id?: string; count?: number }>;
};

type QuestStep = { id?: string; options?: QuestOption[] };
type Quest = { id?: string; dialogue?: QuestStep[] };

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const QUEST_ROOT = join(TEST_DIR, '../src/pages/quests/json');

const walkQuestFiles = (dir: string): string[] => {
    const files: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkQuestFiles(fullPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    }
    return files;
};

describe('quest same-step grant/gate compatibility', () => {
    test('same-step goto gates are satisfiable by same-step claim grants', () => {
        const violations: string[] = [];

        for (const file of walkQuestFiles(QUEST_ROOT)) {
            const quest = JSON.parse(readFileSync(file, 'utf8')) as Quest;

            for (const step of quest.dialogue ?? []) {
                const maxGrantByItem = new Map<string, number>();
                for (const option of step.options ?? []) {
                    if (option.type !== 'grantsItems') continue;
                    for (const item of option.grantsItems ?? []) {
                        const itemId = typeof item.id === 'string' ? item.id : '';
                        const count = Number(item.count ?? 0);
                        if (!itemId || !Number.isFinite(count) || count <= 0) continue;
                        maxGrantByItem.set(itemId, Math.max(maxGrantByItem.get(itemId) ?? 0, count));
                    }
                }

                if (maxGrantByItem.size === 0) continue;

                for (const option of step.options ?? []) {
                    if (option.type !== 'goto') continue;
                    for (const required of option.requiresItems ?? []) {
                        const itemId = typeof required.id === 'string' ? required.id : '';
                        if (!itemId || !maxGrantByItem.has(itemId)) continue;
                        const requiredCount = Number(required.count ?? 0);
                        const grantedCount = maxGrantByItem.get(itemId) ?? 0;
                        if (Number.isFinite(requiredCount) && requiredCount > grantedCount) {
                            violations.push(
                                `${quest.id ?? file}: step ${step.id ?? '(unknown)'} goto gate requires ` +
                                    `${requiredCount} of ${itemId} but the same step only grants ` +
                                    `${grantedCount} in any single claim option`
                            );
                        }
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
