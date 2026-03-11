import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type QuestJson = {
    id?: string;
};

const questsRoot = resolve(process.cwd(), 'frontend/src/pages/quests/json');

const listQuestFiles = (): string[] => {
    const categoryDirs = readdirSync(questsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    return categoryDirs.flatMap((category) => {
        const categoryPath = resolve(questsRoot, category);
        return readdirSync(categoryPath, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => `${category}/${entry.name}`)
            .sort();
    });
};

describe('quest id/path consistency', () => {
    it('keeps each quest id aligned with its json path', () => {
        const mismatches = listQuestFiles().flatMap((relativeFilePath) => {
            const absoluteFilePath = resolve(questsRoot, relativeFilePath);
            const quest = JSON.parse(readFileSync(absoluteFilePath, 'utf8')) as QuestJson;
            const expectedId = relativeFilePath.replace(/\.json$/, '');

            if (quest.id === expectedId) {
                return [];
            }

            return [
                {
                    file: relativeFilePath,
                    id: quest.id,
                    expectedId,
                },
            ];
        });

        expect(mismatches).toEqual([]);
    });
});
