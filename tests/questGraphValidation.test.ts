import { describe, expect, it } from 'vitest';
import { loadQuests, validateQuestGraph } from '../scripts/gen-quest-tree.mjs';

describe('quest graph validation', () => {
    it('has no missing prerequisites or cycles', async () => {
        const quests = await loadQuests();
        const { errors } = validateQuestGraph(quests);

        expect(errors).toEqual([]);
    });

    it('finds a starter within five hops for every quest group', async () => {
        const quests = await loadQuests();
        const { warnings } = validateQuestGraph(quests, { starterMaxDepth: 5 });

        expect(warnings).toEqual([]);
    });
});
