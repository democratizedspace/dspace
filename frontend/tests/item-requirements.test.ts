import { describe, expect, it } from 'vitest';

import { areItemRequirementsMet } from '../src/pages/quests/svelte/option/itemRequirements.js';

describe('areItemRequirementsMet', () => {
    it('matches regular inventory requirements', () => {
        const requirements = [{ id: 'dusd', count: 100 }];
        const gameState = { inventory: { dusd: 120 } };

        expect(areItemRequirementsMet(requirements, gameState)).toBe(true);
    });

    it('matches container-backed requirements using containerItemId', () => {
        const requirements = [
            {
                id: 'dusd',
                count: 100,
                containerItemId: 'savings-jar',
            },
        ];
        const gameState = {
            inventory: { dusd: 5 },
            itemContainerCounts: {
                'savings-jar': {
                    dusd: 100,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, gameState)).toBe(true);
    });

    it('fails container-backed requirements when stored amount is below threshold', () => {
        const requirements = [
            {
                id: 'dusd',
                count: 100,
                containerItemId: 'savings-jar',
            },
        ];
        const gameState = {
            itemContainerCounts: {
                'savings-jar': {
                    dusd: 90,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, gameState)).toBe(false);
    });
});
