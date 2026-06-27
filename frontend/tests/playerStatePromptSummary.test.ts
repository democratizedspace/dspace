import { describe, expect, it } from 'vitest';
import { buildPlayerStatePromptSummary } from '../src/utils/playerStatePromptSummary.js';

const greenPlaId = 'd3590107-25ff-4de5-af3a-46e2497bfc52';
const dSolarId = 'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a';

const manyInventory = Object.fromEntries(
    Array.from({ length: 60 }, (_, index) => [
        `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        index + 1,
    ])
);

const manyFinishedQuests = Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [`custom/finished-${index}`, { finished: true }])
);

describe('buildPlayerStatePromptSummary', () => {
    it('summarizes finished quests with counts instead of a raw questsFinished array', () => {
        const summary = buildPlayerStatePromptSummary({
            versionNumberString: '3',
            quests: manyFinishedQuests,
            inventory: {},
        });

        expect(summary.block).toContain('PlayerState compact summary v3');
        expect(summary.block).toContain('Official quests: completed');
        expect(summary.block).not.toContain('questsFinished');
        expect(summary.block).not.toContain('custom/finished-39');
        expect(summary.meta.remainingQuestIncludedCount).toBeLessThanOrEqual(12);
        expect(summary.block).toContain('Omitted inventory/quest details are not evidence');
    });

    it('bounds inventory entries and reports truncation metadata', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { ...manyInventory, [greenPlaId]: 25 },
            },
            { latestUserMessage: 'what is my inventory?' }
        );

        expect(summary.meta.inventoryTotalCount).toBe(61);
        expect(summary.meta.inventoryIncludedCount).toBeLessThanOrEqual(8);
        expect(summary.meta.inventoryTruncated).toBe(true);
        expect(summary.block).toContain('Inventory: 61 owned item/resource entries');
        expect(summary.block).not.toContain('00000000-0000-4000-8000-000000000059');
        expect(summary.block).toContain('omitted from this prompt');
    });

    it('includes query-relevant green PLA when present', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { ...manyInventory, [greenPlaId]: 42 },
            },
            { latestUserMessage: 'do I have enough green PLA?' }
        );

        expect(summary.block).toContain('green PLA filament');
        expect(summary.block).toContain('42');
        expect(summary.meta.inventoryIncludedCount).toBeLessThanOrEqual(8);
    });

    it('includes notable dSolar balances when mentioned or present', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { [dSolarId]: 7 },
            },
            { latestUserMessage: 'dSolar' }
        );

        expect(summary.block).toContain('dSolar');
        expect(summary.block).toContain('7');
        expect(summary.meta.inventoryTruncated).toBe(false);
    });

    it('does not include arbitrary huge inventory details for unrelated state questions', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { ...manyInventory, [greenPlaId]: 42 },
            },
            { latestUserMessage: 'what quest do I have left?' }
        );

        expect(summary.block).not.toContain('green PLA filament');
        expect(summary.block).not.toContain('00000000-0000-4000-8000-000000000020');
        expect(summary.meta.inventoryIncludedCount).toBe(0);
        expect(summary.meta.inventoryTruncated).toBe(true);
    });
});
