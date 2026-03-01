import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');
const allowedEmptyRequires = new Set(['welcome/howtodoquests']);

const resolveQuestId = (questId: string | undefined, fullPath: string) =>
    (questId ?? path.relative(questsDir, fullPath))
        .replace(/\\/g, '/')
        .replace(/\.json$/, '');

describe('quest prerequisite requirements', () => {
    const questFiles: Array<{ questId: string; requires: string[] }> = [];
    const allQuestIds = new Set<string>();

    const walkQuests = (dir: string) => {
        for (const entry of readdirSync(dir)) {
            const fullPath = path.join(dir, entry);
            const stats = statSync(fullPath);

            if (stats.isDirectory()) {
                walkQuests(fullPath);
                continue;
            }

            if (!entry.endsWith('.json')) {
                continue;
            }

            const raw = readFileSync(fullPath, 'utf8');
            const quest = JSON.parse(raw);
            const questId = resolveQuestId(quest.id, fullPath);
            const requires = Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [];

            questFiles.push({ questId, requires });
            allQuestIds.add(questId);
        }
    };

    walkQuests(questsDir);

    it('only allows welcome/howtodoquests to omit requiresQuests', () => {
        const questsMissingRequires = questFiles
            .filter((quest) => quest.requires.length === 0)
            .map((quest) => quest.questId);

        const unexpected = questsMissingRequires.filter(
            (questId) => !allowedEmptyRequires.has(questId)
        );

        expect(unexpected).toEqual([]);
    });

    it('requiresQuests only references existing quest ids', () => {
        const unknownDependencies: Array<{ questId: string; dependency: string }> = [];

        for (const quest of questFiles) {
            for (const dependency of quest.requires) {
                if (allQuestIds.has(dependency)) {
                    continue;
                }

                unknownDependencies.push({ questId: quest.questId, dependency });
            }
        }

        expect(unknownDependencies).toEqual([]);
    });
});
