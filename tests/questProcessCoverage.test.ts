import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadQuestPaths } from './utils/questPaths';

type QuestOption = {
    type?: string;
    process?: string;
    goto?: string;
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
const RECOVERY_NODE_TARGET = /^(safety|troubleshoot|recover|retry|rework)/i;

const hasRequiredProcessStep = (quest: QuestData) =>
    (quest.dialogue ?? []).some((node) => {
        const options = node.options ?? [];
        const hasTypedProcessOption = options.some(
            (option) =>
                option.type === 'process' &&
                typeof option.process === 'string' &&
                option.process.trim().length > 0
        );

        if (!hasTypedProcessOption) return false;

        const hasBypassGoto = options.some(
            (option) =>
                option.type === 'goto' &&
                typeof option.goto === 'string' &&
                !RECOVERY_NODE_TARGET.test(option.goto)
        );

        return !hasBypassGoto;
    });

describe('quest process coverage quality gates', () => {
    it('enforces mandatory process-backed immersion for build/install quest titles', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) =>
                JSON.parse(await readFile(questPath, 'utf8')) as QuestData
            )
        );

        const buildOrStructureQuests = quests.filter((quest) =>
            BUILD_OR_STRUCTURE_TITLE.test(quest.title ?? '')
        );
        expect(buildOrStructureQuests.length).toBeGreaterThan(0);

        const withRequiredProcessCount = buildOrStructureQuests.filter(hasRequiredProcessStep).length;
        const coverage = withRequiredProcessCount / buildOrStructureQuests.length;

        expect(coverage).toBe(1);
    });

    it('reports quest ids that still bypass process-backed build/install steps', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;
            if (!BUILD_OR_STRUCTURE_TITLE.test(quest.title ?? '')) continue;
            if (hasRequiredProcessStep(quest)) continue;
            flagged.push(quest.id);
        }

        expect(flagged).toEqual([]);
    });
});
