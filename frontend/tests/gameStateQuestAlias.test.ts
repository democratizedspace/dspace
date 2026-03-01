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
});
