import { describe, expect, it } from 'vitest';
import { classifyQuestList } from '../src/utils/quests/listClassifier.js';

const quests = [
    { id: 'a', requiresQuests: [] },
    { id: 'b', requiresQuests: ['a'] },
    { id: 'c', requiresQuests: ['b'] },
];

describe('quest list classifier', () => {
    it('returns unknown without authoritative snapshot', () => {
        const result = classifyQuestList({ quests, snapshot: { authoritative: false } });
        expect(result.map((q) => q.status)).toEqual(['unknown', 'unknown', 'unknown']);
    });

    it('classifies completed and availability from authoritative snapshot', () => {
        const result = classifyQuestList({
            quests,
            snapshot: { authoritative: true, completedQuestIds: ['a'] },
        });
        expect(result.map((q) => q.status)).toEqual(['completed', 'available', 'locked']);
    });

    it('uses full state for reconciliation', () => {
        const result = classifyQuestList({
            quests,
            snapshot: {
                state: {
                    quests: {
                        a: { finished: true },
                        b: { finished: true },
                    },
                },
            },
        });
        expect(result.map((q) => q.status)).toEqual(['completed', 'completed', 'available']);
    });
});
