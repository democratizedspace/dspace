import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');
const allowedEmptyRequires = new Set(['welcome/howtodoquests']);

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
                const requires = quest.requiresQuests ?? [];

                if (requires.length === 0) {
                    const questId =
                        quest.id ||
                        path
                            .relative(questsDir, fullPath)
                            .replace(/\\/g, '/')
                            .replace(/\.json$/, '');
                    questsMissingRequires.push(questId);
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
