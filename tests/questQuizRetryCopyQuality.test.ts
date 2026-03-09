import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
    text?: string;
    goto?: string;
};

type QuestNode = {
    id: string;
    options?: QuestOption[];
};

type QuestData = {
    id: string;
    dialogue?: QuestNode[];
};

const GENERIC_RETRY_COPY = new Set(['retry', 'try again', 'again']);

describe('quest quiz retry copy quality', () => {
    it('requires non-generic retry copy for quiz remediation nodes', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;

            for (const node of quest.dialogue ?? []) {
                if (!node.id.startsWith('retry-')) continue;

                for (const option of node.options ?? []) {
                    if (!option.goto?.startsWith('quiz-')) continue;

                    const normalized = (option.text ?? '').trim().toLowerCase();
                    if (GENERIC_RETRY_COPY.has(normalized)) {
                        flagged.push(`${quest.id}:${node.id}`);
                    }
                }
            }
        }

        expect(flagged).toEqual([]);
    });
});
