import { describe, expect, it } from 'vitest';
import hardening from '../common/hardening.js';

const { evaluateQuestQuality, evaluateProcessQuality, emojiForHardening, normalizeHardening } =
    hardening;

describe('hardening evaluators', () => {
    it('scores a branching quest with rewards higher than a minimal stub', () => {
        const minimalScore = evaluateQuestQuality({ description: 'short', dialogue: [] });
        const detailedScore = evaluateQuestQuality({
            description: 'A thorough walkthrough of sensors and actuators for a microcontroller.',
            start: 'intro',
            rewards: [{ id: 'item/1', count: 1 }],
            requiresQuests: ['quest/a'],
            npc: 'npc.jpg',
            dialogue: [
                {
                    id: 'intro',
                    text: 'Welcome',
                    options: [
                        { type: 'next', text: 'Go on', goto: 'step-1' },
                        { type: 'process', text: 'Start build', process: 'build-widget' },
                    ],
                },
                {
                    id: 'step-1',
                    text: 'Finish up',
                    options: [
                        { type: 'finish', text: 'Done' },
                        { type: 'next', text: 'Add more', goto: 'bonus' },
                    ],
                },
                { id: 'bonus', text: 'Extras', options: [{ type: 'finish', text: 'done' }] },
            ],
        });

        expect(detailedScore).toBeGreaterThan(minimalScore);
        expect(detailedScore).toBeGreaterThanOrEqual(30);
    });

    it('rewards well-specified processes', () => {
        const score = evaluateProcessQuality({
            id: 'proc-1',
            title: 'Assemble a solar kit with charge controller',
            duration: '30m',
            requireItems: [{ id: 'panel', count: 1 }],
            consumeItems: [{ id: 'screws', count: 4 }],
            createItems: [{ id: 'built-kit', count: 1 }],
            image: '/assets/solar.jpg',
        });

        expect(score).toBeGreaterThanOrEqual(60);
    });

    it('normalizes emoji based on passes and score', () => {
        const normalized = normalizeHardening({
            passes: 2,
            score: 80,
            history: [
                { task: 't1', date: '2025-01-01', score: 80 },
                { task: 't2', date: '2025-01-02', score: 80 },
            ],
        });
        expect(emojiForHardening(normalized)).toBe('✅');
    });
});
