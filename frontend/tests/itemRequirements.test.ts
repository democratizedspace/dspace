import { describe, it, expect } from 'vitest';
import {
    areContainedItemRequirementsMet,
    areOptionRequirementsMet,
} from '../src/pages/quests/svelte/option/itemRequirements.js';

describe('item requirements utilities', () => {
    it('validates contained item requirements against container balances', () => {
        const requirements = [
            {
                containerItemId: 'jar-1',
                itemId: 'dusd',
                count: 100,
            },
        ];

        expect(
            areContainedItemRequirementsMet(requirements, {
                'jar-1': { dusd: 100 },
            })
        ).toBe(true);

        expect(
            areContainedItemRequirementsMet(requirements, {
                'jar-1': { dusd: 90 },
            })
        ).toBe(false);
    });

    it('combines inventory and container requirements for option checks', () => {
        const option = {
            requiresItems: [{ id: 'jar-1', count: 1 }],
            requiresContainedItems: [
                {
                    containerItemId: 'jar-1',
                    itemId: 'dusd',
                    count: 100,
                },
            ],
        };

        expect(
            areOptionRequirementsMet(option, {
                inventory: { 'jar-1': 1 },
                itemContainerCounts: { 'jar-1': { dusd: 100 } },
            })
        ).toBe(true);

        expect(
            areOptionRequirementsMet(option, {
                inventory: { 'jar-1': 1 },
                itemContainerCounts: { 'jar-1': { dusd: 10 } },
            })
        ).toBe(false);
    });
});
