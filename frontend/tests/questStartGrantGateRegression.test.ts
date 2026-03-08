import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type QuestOption = {
    type?: string;
    grantsItems?: Array<{ id?: string; count?: number }>;
    requiresItems?: Array<{ id?: string; count?: number }>;
};

type QuestStep = { id?: string; options?: QuestOption[] };
type Quest = { id?: string; start?: string; dialogue?: QuestStep[] };

const QUEST_ROOT = join(process.cwd(), 'src/pages/quests/json');

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

describe('quest start-step grant/gate compatibility', () => {
    test('start-step same-item gates are satisfiable by same-step claim grants', () => {
        const violations: string[] = [];

        for (const file of walkQuestFiles(QUEST_ROOT)) {
            const quest = JSON.parse(readFileSync(file, 'utf8')) as Quest;
            const startStep = quest.dialogue?.find((step) => step.id === quest.start);
            if (!startStep) continue;

            const grantTotals = new Map<string, number>();
            for (const option of startStep.options ?? []) {
                if (option.type !== 'grantsItems') continue;
                for (const item of option.grantsItems ?? []) {
                    const itemId = typeof item.id === 'string' ? item.id : '';
                    const count = Number(item.count ?? 0);
                    if (!itemId || !Number.isFinite(count) || count <= 0) continue;
                    grantTotals.set(itemId, (grantTotals.get(itemId) ?? 0) + count);
                }
            }

            if (grantTotals.size === 0) continue;

            for (const option of startStep.options ?? []) {
                if (option.type !== 'goto') continue;
                for (const required of option.requiresItems ?? []) {
                    const itemId = typeof required.id === 'string' ? required.id : '';
                    if (!itemId || !grantTotals.has(itemId)) continue;
                    const requiredCount = Number(required.count ?? 0);
                    const grantedCount = grantTotals.get(itemId) ?? 0;
                    if (Number.isFinite(requiredCount) && requiredCount > grantedCount) {
                        violations.push(
                            `${quest.id}: start requires ${requiredCount} of ${itemId} ` +
                                `but start-step grants only ${grantedCount}`
                        );
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
