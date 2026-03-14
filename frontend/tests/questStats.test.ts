import { describe, expect, it } from 'vitest';
import { getOfficialQuestStats } from '../src/utils/gameState/questStats.js';

describe('getOfficialQuestStats', () => {
    const officialQuestIds = [
        'welcome/howtodoquests',
        'welcome/intro-inventory',
        '3dprinting/start',
    ];

    it('returns completed=total and remaining=0 when all official quests are complete', () => {
        const state = {
            quests: {
                'welcome/howtodoquests': { finished: true },
                'welcome/intro-inventory': { finished: true },
                '3dprinting/start': { finished: true },
            },
        };

        expect(getOfficialQuestStats(state, { officialQuestIds })).toEqual({
            completedQuestCount: 3,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 0,
        });
    });

    it('returns correct completed and remaining counts for partial completion', () => {
        const state = {
            quests: {
                'welcome/howtodoquests': { finished: true },
                'welcome/intro-inventory': { finished: false },
                '3dprinting/start': { finished: false },
            },
        };

        expect(getOfficialQuestStats(state, { officialQuestIds })).toEqual({
            completedQuestCount: 1,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 2,
        });
    });

    it('ignores unknown finished quest ids when computing official stats', () => {
        const state = {
            quests: {
                'welcome/howtodoquests': { finished: true },
                'custom/non-official': { finished: true },
            },
        };

        expect(getOfficialQuestStats(state, { officialQuestIds })).toEqual({
            completedQuestCount: 1,
            totalOfficialQuestCount: 3,
            remainingOfficialQuestCount: 2,
        });
    });
});
