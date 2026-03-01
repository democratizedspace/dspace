import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');

type QuestRecord = {
    id?: string;
    requiresQuests?: string[];
};

const loadQuestRecords = (): QuestRecord[] => {
    const quests: QuestRecord[] = [];

    const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
            const fullPath = path.join(dir, entry);
            const stats = statSync(fullPath);

            if (stats.isDirectory()) {
                walk(fullPath);
                continue;
            }

            if (!entry.endsWith('.json')) {
                continue;
            }

            quests.push(JSON.parse(readFileSync(fullPath, 'utf8')));
        }
    };

    walk(questsDir);
    return quests;
};

describe('quest dependencies', () => {
    it('only references existing quest ids in requiresQuests', () => {
        const quests = loadQuestRecords();
        const questIds = new Set(quests.map((quest) => quest.id).filter(Boolean));
        const missingRefs: string[] = [];

        for (const quest of quests) {
            for (const dependencyId of quest.requiresQuests ?? []) {
                if (!questIds.has(dependencyId)) {
                    missingRefs.push(`${quest.id} -> ${dependencyId}`);
                }
            }
        }

        expect(missingRefs).toEqual([]);
    });
});
