import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');

type QuestRecord = {
    id?: string;
    requiresQuests?: string[];
};

describe('quest requiresQuests references', () => {
    it('only references existing quest IDs', () => {
        const questFiles = globSync(path.join(questsDir, '**/*.json'));
        const quests = questFiles.map((filePath) => {
            const quest = JSON.parse(readFileSync(filePath, 'utf8')) as QuestRecord;
            const fallbackId = path
                .relative(questsDir, filePath)
                .replace(/\\/g, '/')
                .replace(/\.json$/, '');

            return {
                id: quest.id ?? fallbackId,
                requiresQuests: Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [],
            };
        });

        const questIdSet = new Set(quests.map((quest) => quest.id));
        const missingDependencies: string[] = [];

        for (const quest of quests) {
            for (const dependency of quest.requiresQuests) {
                if (!questIdSet.has(dependency)) {
                    missingDependencies.push(`${quest.id} -> ${dependency}`);
                }
            }
        }

        expect(missingDependencies).toEqual([]);
    });
});
