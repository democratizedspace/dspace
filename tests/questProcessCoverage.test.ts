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
const BUILD_OR_STRUCTURE_DESCRIPTION =
    /\b(build|construct|assemble|install|mount|set up|setup|enclosure|rig|reactor|digester|gripper|tracker|turbine|frame|chassis|fixture|structure)\b/i;

const IMMERSION_EXCEPTION_IDS = new Set<string>([
    'aquaria/guppy',
    'aquaria/shrimp',
    'aquaria/floating-plants',
]);

const hasRequiredProcessStep = (quest: QuestData) =>
    (quest.dialogue ?? []).some((node) =>
        (node.options ?? []).some(
            (option) =>
                option.type === 'process' &&
                typeof option.process === 'string' &&
                option.process.trim().length > 0
        )
    );

const isBuildOrStructureQuest = (quest: QuestData) => {
    const combinedText = `${quest.title ?? ''} ${quest.description ?? ''}`;
    return BUILD_OR_STRUCTURE_TITLE.test(combinedText) && BUILD_OR_STRUCTURE_DESCRIPTION.test(combinedText);
};

describe('quest process coverage quality gates', () => {
    it('enforces mandatory process-backed immersion for build/install quest titles', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const quests = await Promise.all(
            [...questPaths.values()].map(async (questPath) =>
                JSON.parse(await readFile(questPath, 'utf8')) as QuestData
            )
        );

        const buildOrStructureQuests = quests.filter(
            (quest) => isBuildOrStructureQuest(quest) && !IMMERSION_EXCEPTION_IDS.has(quest.id)
        );
        expect(buildOrStructureQuests.length).toBeGreaterThan(0);

        const flagged = buildOrStructureQuests
            .filter((quest) => !hasRequiredProcessStep(quest))
            .map((quest) => quest.id);

        expect(flagged).toEqual([]);
    });

    it('reports quest ids that still bypass process-backed build/install steps', async () => {
        const questPaths = await loadQuestPaths();
        expect(questPaths.size).toBeGreaterThan(0);

        const flagged: string[] = [];

        for (const questPath of questPaths.values()) {
            const quest = JSON.parse(await readFile(questPath, 'utf8')) as QuestData;
            if (!isBuildOrStructureQuest(quest)) continue;
            if (IMMERSION_EXCEPTION_IDS.has(quest.id)) continue;
            if (hasRequiredProcessStep(quest)) continue;
            flagged.push(quest.id);
        }

        expect(flagged).toEqual([]);
    });
});
