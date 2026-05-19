import { describe, expect, it } from 'vitest';
import { areItemRequirementsMet } from '../src/pages/quests/svelte/option/itemRequirements.js';
import items from '../src/pages/inventory/json/items';

const savingsJar = items.find((item) => item.name === 'savings jar');
const dUSD = items.find((item) => item.name === 'dUSD');

if (!savingsJar || !dUSD) {
    throw new Error('Expected built-in savings jar and dUSD fixtures for container tests.');
}

describe('areItemRequirementsMet', () => {
    it('passes when wallet inventory meets plain requirements', () => {
        const requirements = [{ id: 'dusd', count: 100 }];
        const inventory = { dusd: 100 };

        expect(areItemRequirementsMet(requirements, inventory, { inventory })).toBe(true);
    });

    it('checks container balances when containerItemId is provided', () => {
        const requirements = [
            {
                id: dUSD.id,
                count: 100,
                containerItemId: savingsJar.id,
            },
        ];

        const fullState = {
            inventory: { [dUSD.id]: 0 },
            itemContainerCounts: {
                [savingsJar.id]: {
                    [dUSD.id]: 100,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(true);
    });

    it('fails when container balance is below minimum', () => {
        const requirements = [
            {
                id: dUSD.id,
                count: 100,
                containerItemId: savingsJar.id,
            },
        ];

        const fullState = {
            inventory: { [dUSD.id]: 200 },
            itemContainerCounts: {
                [savingsJar.id]: {
                    [dUSD.id]: 90,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(false);
    });

    it('ignores unknown persisted containers and falls back to wallet inventory', () => {
        const requirements = [
            {
                id: dUSD.id,
                count: 100,
                containerItemId: 'unknown-persisted-container',
            },
        ];

        const fullState = {
            inventory: { [dUSD.id]: 100 },
            itemContainerCounts: {
                'unknown-persisted-container': {
                    [dUSD.id]: 9999,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(true);
    });

    it('does not satisfy requirements from unknown persisted container balances alone', () => {
        const requirements = [
            {
                id: dUSD.id,
                count: 100,
                containerItemId: 'unknown-persisted-container',
            },
        ];

        const fullState = {
            inventory: { [dUSD.id]: 0 },
            itemContainerCounts: {
                'unknown-persisted-container': {
                    [dUSD.id]: 9999,
                },
            },
        };

        expect(areItemRequirementsMet(requirements, fullState.inventory, fullState)).toBe(false);
    });
});
