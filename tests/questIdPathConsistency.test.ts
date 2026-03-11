import { describe, expect, it } from 'vitest';
import path from 'path';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

type QuestFile = {
    id?: string;
};

describe('built-in quest id/path consistency', () => {
    it('matches each quest id to its tree directory and filename', () => {
        const questFiles = globSync(
            path.join(process.cwd(), 'frontend/src/pages/quests/json/*/*.json')
        ).sort();

        expect(questFiles.length).toBeGreaterThan(0);

        const mismatches: string[] = [];

        for (const questFile of questFiles) {
            const quest = JSON.parse(readFileSync(questFile, 'utf8')) as QuestFile;
            const relativePath = path.relative(process.cwd(), questFile).replaceAll('\\', '/');
            const questTree = path.basename(path.dirname(questFile));
            const questSlug = path.basename(questFile, '.json');
            const expectedId = `${questTree}/${questSlug}`;

            if (quest.id !== expectedId) {
                mismatches.push(`${relativePath}: expected id \"${expectedId}\" but found \"${quest.id}\"`);
            }
        }

        expect(
            mismatches,
            `Quest ids must match frontend/src/pages/quests/json/<tree>/<slug>.json:\n${mismatches.join('\n')}`
        ).toEqual([]);
    });
});
