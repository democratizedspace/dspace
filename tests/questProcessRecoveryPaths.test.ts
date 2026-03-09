import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
    type?: string;
};

type QuestNode = {
    id?: string;
    options?: QuestOption[];
};

type QuestData = {
    id: string;
    dialogue?: QuestNode[];
};

describe('quest process recovery paths', () => {
    it('requires an explicit non-process recovery/review option in process-heavy dialogue nodes', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;

            for (const node of quest.dialogue ?? []) {
                const options = node.options ?? [];
                const hasProcessOption = options.some((option) => option.type === 'process');
                if (!hasProcessOption) continue;

                const hasRecoveryOrReviewPath = options.some((option) => option.type === 'goto');
                if (hasRecoveryOrReviewPath) continue;

                flagged.push(`${quest.id}#${node.id ?? 'unknown-node'}`);
            }
        }

        expect(flagged).toEqual([]);
    });
});
