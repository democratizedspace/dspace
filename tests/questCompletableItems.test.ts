import { describe, expect, it } from 'vitest';
import { loadQuests } from '../scripts/gen-quest-tree.mjs';
import { validateQuestRequiredItemObtainability } from '../scripts/validate-quest-completion.mjs';

describe('quest completion item availability', () => {
    it('ensures required quest items are obtainable', async () => {
        const quests = await loadQuests();
        const failures = validateQuestRequiredItemObtainability(quests);

        const formatted = failures.map((failure) => {
            const details = failure.details.map((detail) => `  - ${detail}`).join('\n');
            return `Quest "${failure.questId}" missing obtainable required items:\n${details}`;
        });

        expect(formatted).toEqual([]);
    });
});
