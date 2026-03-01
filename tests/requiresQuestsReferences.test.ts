import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');

type QuestRecord = {
    id: string;
    requiresQuests: string[];
    filePath: string;
};

function walkQuestFiles(dir: string, files: string[] = []) {
    for (const entry of readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stats = statSync(fullPath);

        if (stats.isDirectory()) {
            walkQuestFiles(fullPath, files);
            continue;
        }

        if (entry.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
}

describe('quest dependency integrity', () => {
    it('ensures every requiresQuests id exists in built-in quests', () => {
        const questFiles = walkQuestFiles(questsDir);
        const quests: QuestRecord[] = questFiles.map((filePath) => {
            const raw = readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);

            return {
                id: parsed.id,
                requiresQuests: Array.isArray(parsed.requiresQuests) ? parsed.requiresQuests : [],
                filePath,
            };
        });

        const questIds = new Set(quests.map((quest) => quest.id));
        const missingReferences: string[] = [];

        for (const quest of quests) {
            for (const dependencyId of quest.requiresQuests) {
                if (!questIds.has(dependencyId)) {
                    const relativePath = path.relative(path.join(__dirname, '..'), quest.filePath);
                    missingReferences.push(`${quest.id} -> ${dependencyId} (${relativePath})`);
                }
            }
        }

        expect(missingReferences).toEqual([]);
    });
});
