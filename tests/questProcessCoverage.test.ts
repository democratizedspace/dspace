import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
    process?: string;
};

type QuestNode = {
    options?: QuestOption[];
};

type QuestData = {
    id: string;
    title?: string;
    description?: string;
    dialogue?: QuestNode[];
};

const BUILD_OR_STRUCTURE_TITLE = /^(build|construct|assemble|install|make|add)\b/i;

const hasProcessOption = (quest: QuestData) =>
    (quest.dialogue ?? []).some((node) =>
        (node.options ?? []).some(
            (option) => typeof option.process === 'string' && option.process.trim().length > 0
        )
    );

describe('quest process coverage quality gates', () => {
    it('keeps process coverage high across the quest corpus', async () => {
        const questPaths = await loadQuestPaths();
        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) =>
                JSON.parse(await readFile(questPath, 'utf8')) as QuestData
            )
        );

        const withProcessCount = quests.filter(hasProcessOption).length;
        const coverage = withProcessCount / quests.length;

        expect(coverage).toBeGreaterThanOrEqual(0.88);
    });

    it('requires process-backed immersion for build/structure quests', async () => {
        const questPaths = await loadQuestPaths();
        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;
            if (!BUILD_OR_STRUCTURE_TITLE.test(quest.title ?? '')) continue;
            if (hasProcessOption(quest)) continue;
            flagged.push(quest.id);
        }

        expect(flagged).toEqual([]);
    });
});
