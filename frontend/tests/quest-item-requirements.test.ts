import { describe, expect, it } from 'vitest';
import {
    areContainedItemRequirementsMet,
    areItemRequirementsMet,
    areOptionRequirementsMet,
} from '../src/pages/quests/svelte/option/itemRequirements.js';

describe('quest option item requirements', () => {
    it('checks standard inventory requirements', () => {
        expect(areItemRequirementsMet([{ id: 'dUSD', count: 10 }], { dUSD: 9 })).toBe(false);
        expect(areItemRequirementsMet([{ id: 'dUSD', count: 10 }], { dUSD: 10 })).toBe(true);
    });

    it('checks contained item requirements against container balances', () => {
        const requirements = [{ containerId: 'jar', id: 'dUSD', count: 100 }];

        expect(areContainedItemRequirementsMet(requirements, { jar: { dUSD: 99 } })).toBe(false);
        expect(areContainedItemRequirementsMet(requirements, { jar: { dUSD: 100 } })).toBe(true);
    });

    it('requires both inventory and contained balances when both are defined', () => {
        const option = {
            requiresItems: [{ id: 'jar', count: 1 }],
            requiresContainedItems: [{ containerId: 'jar', id: 'dUSD', count: 100 }],
        };

        expect(
            areOptionRequirementsMet(option, {
                inventory: { jar: 1 },
                itemContainerCounts: { jar: { dUSD: 99 } },
            })
        ).toBe(false);

        expect(
            areOptionRequirementsMet(option, {
                inventory: { jar: 1 },
                itemContainerCounts: { jar: { dUSD: 100 } },
            })
        ).toBe(true);
    });
});
