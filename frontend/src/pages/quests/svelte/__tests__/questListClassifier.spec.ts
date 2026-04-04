import { describe, expect, it } from 'vitest';
import {
    QUEST_LIST_STATUSES,
    classifyQuestList,
    buildClassifierInputFromState,
} from '../questListClassifier.js';

describe('questListClassifier', () => {
    const summaries = [
        { id: 'welcome/howtodoquests', requiresQuests: [] },
        { id: 'energy/solar', requiresQuests: ['welcome/howtodoquests'] },
        { id: 'energy/battery', requiresQuests: ['energy/solar'] },
    ];

    it('returns neutral statuses when data is not authoritative', () => {
        const classified = classifyQuestList(summaries, {
            authoritative: false,
            completedQuestIds: ['welcome/howtodoquests'],
        });

        expect(classified.every((entry) => entry.status === QUEST_LIST_STATUSES.UNKNOWN)).toBe(
            true
        );
    });

    it('classifies completed, available, and locked statuses from authoritative input', () => {
        const classified = classifyQuestList(summaries, {
            authoritative: true,
            completedQuestIds: ['welcome/howtodoquests'],
            inProgressQuestIds: ['energy/solar'],
        });

        expect(classified[0].status).toBe(QUEST_LIST_STATUSES.COMPLETED);
        expect(classified[1].status).toBe(QUEST_LIST_STATUSES.IN_PROGRESS);
        expect(classified[2].status).toBe(QUEST_LIST_STATUSES.LOCKED);
    });

    it('never falls back to available on malformed quest records', () => {
        const classified = classifyQuestList([{ requiresQuests: [] }], {
            authoritative: true,
            completedQuestIds: [],
        });

        expect(classified).toHaveLength(0);
    });

    it('builds one-pass input sets from full state', () => {
        const input = buildClassifierInputFromState({
            quests: {
                'welcome/howtodoquests': { finished: true },
                'energy/solar': { stepId: 'start' },
            },
        });

        expect(input.authoritative).toBe(true);
        expect(input.completedQuestIds).toEqual(['welcome/howtodoquests']);
        expect(input.inProgressQuestIds).toEqual(['energy/solar']);
    });
});
