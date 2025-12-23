import { describe, it, expect } from 'vitest';
import {
    evaluateProcessQuality,
    evaluateQuestQuality,
    computeEmoji,
} from '../scripts/hardening/utils.mjs';

describe('hardening quality evaluators', () => {
    it('scores richer quests higher than minimal ones', () => {
        const minimalQuest = {
            id: 'q1',
            title: 'Test',
            description: 'short',
            image: '/img.png',
            npc: '/npc.png',
            start: 'start',
            dialogue: [
                { id: 'start', text: 'hi', options: [{ type: 'finish', text: 'bye' }] },
            ],
            hardening: { passes: 0, score: 0, emoji: '🛠️', history: [] },
        };
        const richQuest = {
            ...minimalQuest,
            description: 'A longer description that demonstrates gating and branching steps.'.repeat(3),
            rewards: [{ id: 'item', count: 1 }],
            requiresQuests: ['quests/example'],
            dialogue: [
                {
                    id: 'start',
                    text: 'hi',
                    options: [
                        { type: 'goto', text: 'next', goto: 'build', process: 'print-benchy' },
                        { type: 'goto', text: 'collect', goto: 'collect', grantsItems: [{ id: 'x', count: 1 }] },
                    ],
                },
                {
                    id: 'build',
                    text: 'build',
                    options: [
                        {
                            type: 'goto',
                            text: 'finish',
                            goto: 'finish',
                            requiresItems: [{ id: 'item', count: 1 }],
                        },
                    ],
                },
                { id: 'finish', text: 'done', options: [{ type: 'finish', text: 'done' }] },
            ],
        };

        expect(evaluateQuestQuality(richQuest)).toBeGreaterThan(evaluateQuestQuality(minimalQuest));
    });

    it('scores processes with complete IO higher', () => {
        const minimal = {
            id: 'p1',
            title: 'Process',
            requireItems: [],
            consumeItems: [],
            createItems: [],
            duration: '1m',
        };
        const detailed = {
            ...minimal,
            title: 'Detailed process with more context and descriptive title',
            requireItems: [{ id: 'a', count: 1 }],
            consumeItems: [{ id: 'b', count: 2 }],
            createItems: [{ id: 'c', count: 3 }],
            duration: '1h',
            image: '/assets/sample.jpg',
            hardening: { passes: 2, score: 80, emoji: '✅', history: [] },
        };

        expect(evaluateProcessQuality(detailed)).toBeGreaterThan(evaluateProcessQuality(minimal));
    });

    it('maps thresholds to expected emoji', () => {
        expect(computeEmoji(0, 0)).toBe('🛠️');
        expect(computeEmoji(1, 60)).toBe('🌀');
        expect(computeEmoji(2, 80)).toBe('✅');
        expect(computeEmoji(3, 95)).toBe('💯');
    });
});
