import { describe, expect, it } from 'vitest';
import {
    evaluateProcessQuality,
    evaluateQuestQuality,
    validateHardening,
} from '../frontend/src/utils/hardening.js';

describe('hardening evaluators', () => {
    it('scores a rich quest with dialogue coverage and finish nodes', () => {
        const quest = {
            title: 'Explore the meteor shower',
            description:
                'Spend an evening charting the meteor shower with your team, recording timings and brightness for later analysis.',
            dialogue: [
                {
                    id: 'start',
                    text: 'Welcome',
                    options: [
                        { type: 'goto', goto: 'observe', text: 'Begin' },
                        { type: 'process', process: 'calibrate-scope', text: 'Calibrate' },
                    ],
                },
                {
                    id: 'observe',
                    text: 'Observe sky',
                    options: [
                        { type: 'goto', goto: 'finish', text: 'Wrap up' },
                    ],
                },
                {
                    id: 'finish',
                    text: 'All done',
                    options: [
                        { type: 'finish', text: 'Complete' },
                    ],
                },
            ],
            rewards: [{ id: 'telescope-time', count: 1 }],
            requiresQuests: ['get-ready'],
        };

        expect(evaluateQuestQuality(quest)).toBe(95);
    });

    it('scores processes with duration, relationships, and media', () => {
        const process = {
            id: 'assemble-kit',
            title: 'Assemble EVA kit',
            duration: '1h',
            requireItems: [{ id: 'wrench', count: 1 }],
            consumeItems: [{ id: 'sealant', count: 1 }],
            createItems: [{ id: 'eva-kit', count: 1 }],
            image: '/images/eva-kit.png',
        };

        expect(evaluateProcessQuality(process)).toBe(100);
    });
});

describe('hardening validation rules', () => {
    it('flags missing hardening blocks', () => {
        expect(validateHardening(undefined)).toContain('missing hardening block');
    });

    it('fails when passes do not match history length', () => {
        const issues = validateHardening(
            {
                passes: 2,
                score: 50,
                emoji: '🛠️',
                history: [
                    { task: 'initial', date: '2024-01-01', score: 50 },
                ],
            },
            40
        );

        expect(issues).toContain('passes must equal history length');
    });

    it('requires valid date formats and integer scores', () => {
        const issues = validateHardening({
            passes: 1,
            score: 60,
            emoji: '🛠️',
            history: [{ task: 'bad date', date: '2024/01/01', score: 60.5 }],
        });

        expect(issues).toContain('history[0] has invalid date format');
        expect(issues).toContain('history[0] score must be an integer between 0 and 100');
    });

    it('enforces emoji thresholds and allowed set', () => {
        const issues = validateHardening({
            passes: 1,
            score: 90,
            emoji: '🛠️',
            history: [{ task: 'first', date: '2024-01-01', score: 90 }],
        });

        expect(issues).toContain('emoji must match hardening thresholds');
    });

    it('requires hardening scores to meet evaluator output', () => {
        const issues = validateHardening(
            {
                passes: 1,
                score: 30,
                emoji: '🌀',
                history: [{ task: 'first', date: '2024-01-01', score: 30 }],
            },
            50
        );

        expect(issues).toContain('score must meet or exceed the evaluator output');
    });
});
