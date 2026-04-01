import { describe, expect, it } from 'vitest';
import { areItemRequirementsMet } from '../src/pages/quests/svelte/option/itemRequirements.js';

describe('areItemRequirementsMet', () => {
    it('passes when wallet inventory meets plain requirements', () => {
        const requirements = [{ id: 'dusd', count: 100 }];
        const inventory = { dusd: 100 };

        expect(areItemRequirementsMet(requirements, inventory, { inventory })).toBe(true);
    });

    it('checks container balances when containerItemId is provided', () => {
        const requirements = [
            {
                id: 'dusd',
                count: 100,
                containerItemId: 'savings-jar',
            },
        ];

        const fullState = {
            inventory: { dusd: 0 },
            itemContainerCounts: {
                'savings-jar': {
                    dusd: 100,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(true);
    });

    it('fails when container balance is below minimum', () => {
        const requirements = [
            {
                id: 'dusd',
                count: 100,
                containerItemId: 'savings-jar',
            },
        ];

        const fullState = {
            inventory: { dusd: 200 },
            itemContainerCounts: {
                'savings-jar': {
                    dusd: 90,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(false);
    });
});
