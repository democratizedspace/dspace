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
    it('only allows welcome/howtodoquests to omit requiresQuests', () => {
        const questsMissingRequires: string[] = [];

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

                const raw = readFileSync(fullPath, 'utf8');
                const quest = JSON.parse(raw);
                const requires = Array.isArray(quest.requiresQuests) ? quest.requiresQuests : [];

                if (requires.length === 0) {
                    questsMissingRequires.push(resolveQuestId(quest.id, fullPath));
                }
            }
        };

        walk(questsDir);

        const unexpected = questsMissingRequires.filter(
            (questId) => !allowedEmptyRequires.has(questId)
        );

        expect(unexpected).toEqual([]);
    });
});
