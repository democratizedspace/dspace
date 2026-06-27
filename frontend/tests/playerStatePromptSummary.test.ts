import { describe, expect, it } from 'vitest';
import { buildPlayerStatePromptSummary } from '../src/utils/playerStatePromptSummary.js';

const greenPlaId = 'd3590107-25ff-4de5-af3a-46e2497bfc52';
const dSolarId = 'b02ecff5-1f7d-4247-a09d-7d6cd6bb218a';

const makeInventory = (count: number) =>
    Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`uuid-like-item-${index}`, index + 1])
    );

describe('buildPlayerStatePromptSummary', () => {
    it('summarizes many finished quests with counts instead of the full questsFinished array', () => {
        const state = {
            versionNumberString: '3',
            quests: Object.fromEntries(
                Array.from({ length: 30 }, (_, index) => [
                    `custom/finished-${index}`,
                    { finished: true },
                ])
            ),
            inventory: {},
        };

        const summary = buildPlayerStatePromptSummary(state);

        expect(summary.block).toContain('PlayerState v3 compact');
        expect(summary.block).toContain('Official quests: completed');
        expect(summary.block).not.toContain('questsFinished');
        expect(summary.block).not.toContain('custom/finished-29');
        expect(summary.meta.playerStatePromptMode).toBe('compact');
        expect(summary.meta.remainingQuestIncludedCount).toBeLessThanOrEqual(12);
    });

    it('bounds inventory summaries and records truncation metadata', () => {
        const state = {
            versionNumberString: '3',
            quests: {},
            inventory: makeInventory(80),
        };

        const summary = buildPlayerStatePromptSummary(state, {
            latestUserMessage: 'what is my inventory?',
        });

        expect(summary.block).toContain('Inventory: 80 owned entries.');
        expect(summary.block).toContain('Bounded inventory sample (cap 8):');
        expect(summary.block).toContain('omitted from this prompt');
        expect(summary.block).not.toContain('uuid-like-item-79');
        expect(summary.meta.inventoryTotalCount).toBe(80);
        expect(summary.meta.inventoryIncludedCount).toBeLessThanOrEqual(8);
        expect(summary.meta.inventoryTruncated).toBe(true);
    });

    it('includes query-relevant green PLA when present', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { [greenPlaId]: 42, unrelated: 99 },
            },
            { latestUserMessage: 'do I have enough green PLA?' }
        );

        expect(summary.block).toContain('green PLA filament');
        expect(summary.block).toContain('42');
        expect(summary.block).not.toContain('unrelated');
    });

    it('includes notable dSolar balance when present', () => {
        const summary = buildPlayerStatePromptSummary(
            {
                versionNumberString: '3',
                quests: {},
                inventory: { [dSolarId]: 7 },
            },
            { latestUserMessage: 'dSolar' }
        );

        expect(summary.block).toContain('Notable balances:');
        expect(summary.block).toContain('dSolar');
        expect(summary.block).toContain('7');
    });

    it('omits arbitrary inventory detail for unrelated state questions', () => {
        const summary = buildPlayerStatePromptSummary({
            versionNumberString: '3',
            quests: {},
            inventory: makeInventory(40),
        });

        expect(summary.block).toContain('Inventory: 40 owned entries.');
        expect(summary.block).not.toContain('Bounded inventory sample');
        expect(summary.block).not.toContain('uuid-like-item-0');
        expect(summary.meta.inventoryIncludedCount).toBe(0);
        expect(summary.meta.inventoryTruncated).toBe(true);
    });
});
