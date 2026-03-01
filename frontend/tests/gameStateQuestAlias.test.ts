import { describe, expect, test } from 'vitest';
import { validateGameState } from '../src/utils/gameState/common.js';

describe('gameState quest alias migration', () => {
    test('migrates legacy 3dprinter/start quest progress to 3dprinting/start', () => {
        const validated = validateGameState({
            quests: {
                '3dprinter/start': {
                    finished: true,
                    stepId: 'progress',
                    itemsClaimed: ['legacy-step'],
                },
                '3dprinting/start': {
                    itemsClaimed: ['canonical-step'],
                },
            },
        });

        expect(validated.quests['3dprinter/start']).toBeUndefined();
        expect(validated.quests['3dprinting/start']).toMatchObject({
            finished: true,
            stepId: 'progress',
        });
        expect(validated.quests['3dprinting/start'].itemsClaimed).toEqual(
            expect.arrayContaining(['legacy-step', 'canonical-step'])
        );
    });

    test('rewrites legacy claimed-option keys to canonical quest id during migration', () => {
        const validated = validateGameState({
            quests: {
                '3dprinter/start': {
                    itemsClaimed: ['3dprinter/start-grant-0', 'custom-claim-key'],
                },
                '3dprinting/start': {
                    itemsClaimed: ['3dprinting/start-grant-0'],
                },
            },
        });

        expect(validated.quests['3dprinter/start']).toBeUndefined();
        expect(validated.quests['3dprinting/start'].itemsClaimed).toEqual(
            expect.arrayContaining(['3dprinting/start-grant-0', 'custom-claim-key'])
        );
        expect(validated.quests['3dprinting/start'].itemsClaimed).not.toContain(
            '3dprinter/start-grant-0'
        );
    });

    test('keeps completion when canonical progress is unfinished but legacy progress is finished', () => {
        const validated = validateGameState({
            quests: {
                '3dprinter/start': {
                    finished: true,
                },
                '3dprinting/start': {
                    finished: false,
                },
            },
        });

        expect(validated.quests['3dprinter/start']).toBeUndefined();
        expect(validated.quests['3dprinting/start']).toMatchObject({ finished: true });
    });

    test('ignores array-shaped quest progress entries during alias migration', () => {
        const validated = validateGameState({
            quests: {
                '3dprinter/start': ['not', 'a', 'progress', 'object'],
                '3dprinting/start': {
                    stepId: 'canonical',
                },
            },
        });

        expect(validated.quests['3dprinter/start']).toEqual(['not', 'a', 'progress', 'object']);
        expect(validated.quests['3dprinting/start']).toMatchObject({ stepId: 'canonical' });
    });

    test('replaces non-object quests container before alias migration', () => {
        const validated = validateGameState({
            quests: ['invalid quests container'],
        });

        expect(validated.quests).toEqual({});
    });
});
