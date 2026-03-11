import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { listQuestJsonFiles } from './utils/questPaths';

type QuestJson = {
    id?: string;
};

const questsRoot = resolve(process.cwd(), 'frontend/src/pages/quests/json');

describe('quest id/path consistency', () => {
    it('keeps each quest id aligned with its json path', async () => {
        const mismatches = (await listQuestJsonFiles()).flatMap((relativeFilePath) => {
            const absoluteFilePath = resolve(questsRoot, relativeFilePath);
            const quest = JSON.parse(readFileSync(absoluteFilePath, 'utf8')) as QuestJson;
            const expectedId = relativeFilePath.replace(/\.json$/, '');

            if (!quest.id) {
                return [
                    {
                        file: relativeFilePath,
                        id: quest.id,
                        expectedId,
                        error: 'missing id field',
                    },
                ];
            }

            if (quest.id === expectedId) {
                return [];
            }

            return [
                {
                    file: relativeFilePath,
                    id: quest.id,
                    expectedId,
                    error: 'id/path mismatch',
                },
            ];
        });

        expect(mismatches).toEqual([]);
    });
});
