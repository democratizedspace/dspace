import { describe, expect, it } from 'vitest';
import { buildQuestProgressStats } from '../src/utils/questProgressStats.js';
import { listBuiltInQuestIds } from '../src/utils/builtInQuests.js';

describe('quest progress stats', () => {
    it('reports completed equals total and zero remaining when all official quests are finished', () => {
        const allOfficialIds = listBuiltInQuestIds();
        const quests = Object.fromEntries(
            allOfficialIds.map((questId) => [questId, { finished: true }])
        );

        const stats = buildQuestProgressStats({ quests });

        expect(stats.totalOfficialQuestCount).toBe(allOfficialIds.length);
        expect(stats.completedOfficialQuestCount).toBe(allOfficialIds.length);
        expect(stats.remainingOfficialQuestCount).toBe(0);
    });

    it('reports correct completed and remaining counts for partial progress', () => {
        const [firstOfficialId, secondOfficialId] = listBuiltInQuestIds();
        const stats = buildQuestProgressStats({
            quests: {
                [firstOfficialId]: { finished: true },
                [secondOfficialId]: { finished: false },
            },
        });

        expect(stats.completedOfficialQuestCount).toBe(1);
        expect(stats.totalOfficialQuestCount).toBeGreaterThanOrEqual(2);
        expect(stats.remainingOfficialQuestCount).toBe(stats.totalOfficialQuestCount - 1);
    });

    it('ignores unknown finished quest ids when computing official completion counts', () => {
        const [firstOfficialId] = listBuiltInQuestIds();
        const stats = buildQuestProgressStats({
            quests: {
                [firstOfficialId]: { finished: true },
                'custom/quest-id': { finished: true },
                'another-custom/quest-id': { finished: true },
            },
        });

        expect(stats.completedOfficialQuestCount).toBe(1);
        expect(stats.remainingOfficialQuestCount).toBe(stats.totalOfficialQuestCount - 1);
    });
});
