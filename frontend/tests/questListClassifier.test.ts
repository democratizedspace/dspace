import { describe, expect, it } from 'vitest';
import manifest from '../src/generated/quests/listManifest.json';
import { classifyQuestList, QUEST_STATUS } from '../src/pages/quests/questListClassifier.js';

describe('quests list manifest + classifier', () => {
    it('manifest is sorted and excludes heavy dialogue payload', () => {
        const ids = manifest.map((entry) => entry.id);
        expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
        expect((manifest[0] as { dialogue?: unknown }).dialogue).toBeUndefined();
    });

    it('classifies status conservatively with trusted snapshot', () => {
        const summaries = [
            { id: 'a', title: 'A', requiresQuests: [] },
            { id: 'b', title: 'B', requiresQuests: ['a'] },
            { id: 'c', title: 'C', requiresQuests: ['missing'] },
        ];
        const results = classifyQuestList({
            questSummaries: summaries,
            snapshot: { trusted: true, completedQuestIds: ['a'] },
            fullState: null,
        });

        expect(results.find((entry) => entry.id === 'a')?.status).toBe(QUEST_STATUS.COMPLETED);
        expect(results.find((entry) => entry.id === 'b')?.status).toBe(QUEST_STATUS.AVAILABLE);
        expect(results.find((entry) => entry.id === 'c')?.status).toBe(QUEST_STATUS.LOCKED);
    });

    it('returns unknown when authoritative data is unavailable', () => {
        const results = classifyQuestList({
            questSummaries: [{ id: 'only', title: 'Only', requiresQuests: [] }],
            snapshot: { trusted: false, completedQuestIds: [] },
            fullState: null,
        });

        expect(results[0].status).toBe(QUEST_STATUS.UNKNOWN);
    });
});
