import { describe, expect, it, vi } from 'vitest';
import { computeOfficialQuestStats } from '../src/utils/questStats.js';

vi.mock('../src/utils/builtInQuests.js', () => ({
    listBuiltInQuestIds: vi.fn(() => ['quest/a', 'quest/b', 'quest/c']),
}));

describe('computeOfficialQuestStats', () => {
    it('reports completed equals total and remaining zero when all official quests are finished', () => {
        const stats = computeOfficialQuestStats({
            quests: {
                'quest/a': { finished: true },
                'quest/b': { finished: true },
                'quest/c': { finished: true },
            },
        });

        expect(stats).toEqual({
            completedQuestCount: 3,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 0,
        });
    });

    it('reports correct completed and remaining counts for a partial state', () => {
        const stats = computeOfficialQuestStats({
            quests: {
                'quest/a': { finished: true },
                'quest/b': { finished: false },
                'quest/c': {},
            },
        });

        expect(stats).toEqual({
            completedQuestCount: 1,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 2,
        });
    });

    it('ignores finished custom or unknown quest ids in official quest counts', () => {
        const stats = computeOfficialQuestStats({
            quests: {
                'quest/a': { finished: true },
                'quest/custom': { finished: true },
                'quest/unknown': { finished: true },
            },
        });

        expect(stats).toEqual({
            completedQuestCount: 1,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 2,
        });
    });

    it('deduplicates and normalizes official quest ids before counting', () => {
        const stats = computeOfficialQuestStats(
            {
                quests: {
                    'quest/a': { finished: true },
                    'quest/b': { finished: true },
                },
            },
            { officialQuestIds: ['quest/a', 'quest/a', ' quest/b ', '', null as unknown as string] }
        );

        expect(stats).toEqual({
            completedQuestCount: 2,
            totalOfficialQuestCount: 2,
            remainingOfficialQuestCount: 0,
        });
    });
});
